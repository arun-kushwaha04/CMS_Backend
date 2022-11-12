const userModel = require("../model/user/userSchema");
const classroomModel = require("../model/classroom/classroom");
const UID = require("../utils/uid");
const bcrypt = require("../utils/userPassword");
const { enrollStudentToTheClassroom } = require("../utils/controllerUtils");

exports.registerUserController = async (req, res, next) => {
    try {
        const allUsers = req.body;
        let userList = [];
        let batchCodeSet = new Set();
        for (let i = 0; i < allUsers.length; i++) {
            let userDetail = allUsers[i];
            const uuid = await UID.createUniqueID(),
                hashPassword = await bcrypt.createPasswordHash(uuid);
            userDetail.password = hashPassword;
            userDetail.uuid = uuid;
            userList.push(userDetail);
            if (userDetail.batchCode) batchCodeSet.add(userDetail.batchCode);
        }
        let batchCodes = Array.from(batchCodeSet);

        //creating classID array batchwise
        let classrooms = await classroomModel.aggregate([
            { $match: { batchCode: { $in: batchCodes } } },
            {
                $group: {
                    _id: "$batchCode",
                    classroomIDs: { $addToSet: "$_id" },
                },
            },
        ]);
        let lookup = {};
        classrooms.forEach(
            (classroom) => (lookup[classroom._id] = classroom.classroomIDs)
        );

        //bulk upsert userList
        let bulkOps = [];
        for (let i = 0; i < userList.length; i++) {
            let upsertDoc = {
                updateOne: {
                    filter: {
                        email: userList[i].email,
                    },
                    update: {
                        $set: userList[i],
                    },
                    upsert: true,
                    setDefaultsOnInsert: true,
                },
            };
            bulkOps.push(upsertDoc);
        }
        await userModel.bulkWrite(bulkOps);

        for (let i = 0; i < allUsers.length; i++) {
            if (!allUsers[i].batchCode) continue;
            const classroomList = lookup[allUsers[i].batchCode];
            classroomList.forEach((classID) => {
                //enroll student to the class
                enrollStudentToTheClassroom(classID, allUsers[i].email).catch(
                    (e) => console.error(e)
                );
            });
        }

        res.status(200).json({
            data: `${allUsers.length}/${allUsers.length} users successfully added`,
            error: null,
        });
    } catch (e) {
        res.status(400).json({ data: null, error: e.message });
    }
};

exports.disableUserController = async (req, res, next) => {
    try {
        const result = await userModel.updateMany(
            { email: { $in: req.body } },
            { $set: { status: "inactive" } }
        );
        res.status(200).json({
            data: `${result.modifiedCount}/${req.body.length} users disabled successfully`,
            error: null,
        });
    } catch (e) {
        res.status(500).json({ data: null, error: e.message });
    }
};

exports.getUserListController = async (req, res, next) => {
    try {
        const { role, batchCode } = req.query;
        if (
            role.toLowerCase() !== "student" &&
            role.toLowerCase() !== "teacher" &&
            role.toLowerCase() !== "admin"
        ) {
            res.status(400).json({
                data: null,
                error: "Invalid role specified!",
            });
            return;
        }
        const userList =
            role.toLowerCase() === "student" && batchCode
                ? await userModel.find(
                      { batchCode },
                      { name: 1, email: 1, role: 1, batchCode: 1, status: 1 }
                  )
                : await userModel.find(
                      { role },
                      { name: 1, email: 1, role: 1, status: 1 }
                  );

        res.status(200).json({
            data: userList,
            error: null,
        });
    } catch (e) {
        res.status(500).json({ data: null, error: e.message });
    }
};

exports.updateUserDetailsController = async (req, res, next) => {
    try {
        const { email } = req.body;
        const { modifiedCount } = await userModel.updateOne(
            { email },
            { $set: req.body }
        );

        res.status(200).json({
            data: `${modifiedCount} documents updated`,
            error: null,
        });
    } catch (e) {
        res.status(500).json({ data: null, error: e.message });
    }
};

exports.getAllBatchCodesController = async (req, res, next) => {
    try {
        let users = await userModel.aggregate([
            { $match: {batchCode: {$exists: true}} },
            {
                $group: {
                    _id: "$batchCode",
                },
            },
        ]);
        let lookup = [];
        users.forEach((classroom) => lookup.push(classroom._id));
        res.status(200).json({
            data: lookup,
            error: null,
        });
    } catch (e) {
        res.status(500).json({ data: null, error: e.message });
    }
};
