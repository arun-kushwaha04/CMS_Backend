const userModel = require("../model/user/userSchema"),
    classModel = require("../model/classroom/classroom"),
    jwt = require("../utils/jwt"),
    brcypt = require("../utils/userPassword"),
    Session = require("../model/session/sessionSchema"),
    UID = require("../utils/uid");
const { resetPasswordHTML } = require("../template/reset-password");
const { sendEmail } = require("../utils/nodemailer");
const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;

exports.loginController = async (req, res, next) => {
    try {
        //1.Checking wether email exits or not
        let userInfo = await userModel.findOne({
            email: req.body.email,
        });
        //==>User does not exists
        if (userInfo === null) {
            res.status(400).json({ data: null, error: "User not registered" });
            return;
        }

        //2.Checking number of failed attemps
        if (userInfo.failedattemps > 2) {
            res.status(400).json({
                data: null,
                error: "Failed login attemps " + userInfo.failedattemps,
            });
            return;
        }

        //3.checking whether User is active
        if (userInfo.status.toLowerCase() !== "active") {
            res.status(400).json({
                data: null,
                error: "Login disabled kindly contact admin",
            });
            return;
        }

        //4.verifying password
        var passwordVerified = await brcypt.verifyPasswordHash(
            req.body.password,
            userInfo.password
        );
        //==>Invalid password
        if (!passwordVerified) {
            await userModel.updateOne(
                { email: req.body.email },
                {
                    $set: {
                        failedattemps: userInfo.failedattemps + 1,
                    },
                }
            );
            res.status(400).json({ data: null, error: "Invalid password" });
            return;
        } else {
            await userModel.updateOne(
                { email: req.body.email },
                {
                    $set: {
                        failedattemps: 0,
                    },
                }
            );
        }

        //Creating unique id for JWT token
        const jwtUid = await jwt.createJWTUniqueID();

        //Creating sessionID
        const sessionID = await UID.createUniqueID();

        //Creating JWT token
        const accessToken = await jwt.createAccessToken({
            sessionID: sessionID,
            uuid: userInfo.uuid,
            jwtUid: jwtUid,
            role: userInfo.role,
        });

        //Creating refresh token
        const refreshToken = await jwt.createRefreshToken({
            sessionID: sessionID,
        });

        await Session.insertMany([
            {
                sessionID: sessionID,
                user: userInfo._id,
                refreshToken: refreshToken,
                jwtUid: jwtUid,
                clientAgent: req.headers["user-agent"],
            },
        ]);

        res.clearCookie("login");
        res.cookie("login", JSON.stringify({ accessToken: accessToken }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });
        res.status(200).json({
            data: { accessToken: accessToken },
            error: null,
        });
    } catch (e) {
        res.status(400).json({ data: null, error: e.message });
    }
};

exports.logoutController = async (req, res, next) => {
    try {
        //
        let result = await Session.deleteOne({
            sessionID: req.body.sessionID,
        });

        if (result.deletedCount > 0) {
            res.clearCookie("login");
            res.status(200).json({ data: result, error: null });
        } else {
            res.status(200).json({ data: null, error: "No data deleted" });
        }
    } catch (e) {
        res.status(400).json({ data: null, error: e.message });
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        //0.decode the jwt token
        const decoded = await jwt.decodeResetLinkAccessToken(
            req.body.accessToken
        );
        //1.Creating hashed password
        let hashPassword = await brcypt.createPasswordHash(
            req.body.newPassword
        );
        // console.log(decoded, decoded.email, hashPassword);
        const userInfo = await userModel.updateOne(
            { email: decoded.email },
            { password: hashPassword }
        );
        //==>User does exists
        if (!userInfo.modifiedCount) {
            res.status(401).json({
                data: null,
                error: "Access Denied",
            });
            return;
        }
        res.status(200).json({ data: "Success", error: null });
    } catch (e) {
        res.status(400).json({ data: null, error: e.message || e });
    }
};

exports.sendResetPasswordEmail = async (req, res, next) => {
    try {
        //0.Checking if user exists
        let userInfo = await userModel.findOne({ email: req.body.email });
        //==>User does exists
        if (!userInfo) {
            res.status(400).json({
                data: null,
                error: "User not registered",
            });
            return;
        }
        //1.create reset link
        const resetlink = await jwt.createResetLink({ email: req.body.email });
        const html = resetPasswordHTML.replace("<RESET_LINK>", resetlink);
        const emailOptions = {
            from: process.env.EMAIL,
            to: req.body.email,
            subject: "Reset Password",
            html,
        };
        await sendEmail(emailOptions);
        res.status(200).json({ data: "Success", error: null });
    } catch (e) {
        // console.log(e)
        res.status(400).json({ data: null, error: e.message || e });
    }
};

exports.validMeetAccess = async (req, res, next) => {
    try {
        //
        let user = await userModel.findOne({ uuid: req.body.uuid });
        let currentClass = await classModel.findById(
            ObjectID(req.query.classID)
        );
        if (
            user?.classroomIDs.includes(currentClass._id) &&
            currentClass.meetingID == req.query.meetID
        ) {
            res.status(200).json({ data: "valid", error: null });
        } else {
            res.status(403).json({ data: null, error: "Unauthorized" });
        }
    } catch (e) {
        res.status(400).json({ data: null, error: e.message });
    }
};
