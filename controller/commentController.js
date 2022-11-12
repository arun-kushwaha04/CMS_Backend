const userModel = require("../model/user/userSchema");
const assignmentModel = require("../model/post/assignmentSchema");
const announcementModel = require("../model/post/announcementSchema");
const commentModel = require("../model/comment/commentSchema");
const { isUserInClass, isPostInClass } = require("../utils/controllerUtils");
const { request } = require("express");

exports.postComment = async (req, res) => {
    const insertComment = async (commentID) => {
        const postType = req.body.postType;
        await (postType === "asg"
            ? assignmentModel
            : announcementModel
        ).updateMany(
            { _id: req.body.postID },
            { $push: { commentIDs: commentID } }
        );
    };
    try {
        const { body, classroomID, uuid, postID, postType } = req.body;

        if (
            isUserInClass(uuid, classroomID) &&
            isPostInClass(postID, postType, classroomID)
        ) {
            //Getting UUIDs
            const user = await userModel.findOne({ uuid: uuid });
            const userID = user._id;
            let comment = await commentModel.create({
                userID: userID,
                body: body,
            });
            comment = await comment.populate({
                path: "userID",
                select: "name",
            });
            await insertComment(comment._id);
            res.status(200).json({ data: comment, error: null });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};
