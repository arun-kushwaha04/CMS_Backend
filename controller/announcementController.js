const announcementModel = require("../model/post/announcementSchema");
const { isUserInClass } = require("../utils/controllerUtils");
const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;

exports.getAnnouncementDetails = async (req, res) => {
    try {
        const announcementID = req.query.annouceID;
        const classroomID = req.query.classID;
        const uuid = req.body.uuid;
        const result = await announcementModel
            .findById(ObjectID(announcementID))
            .populate({
                path: "commentIDs",
                populate: { path: "userID", select: "name" },
            })
            .populate("fileIDs");
        if (
            result.classroomID === classroomID &&
            isUserInClass(uuid, classroomID)
        ) {
            res.status(200).json({ data: result, error: null });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: e.message });
    }
};

exports.postAnnouncement = async (req, res) => {
    const getFileIDList = () => {
        const files = req.files;
        let fileIDs = [];
        for (let i = 0; i < files.length; i++) {
            fileIDs.push(files[i].id);
        }
        return fileIDs;
    };

    try {
        const formData = JSON.parse(req.body.formData);
        const classroomID = req.body.classroomID;
        const uuid = req.body.uuid;
        // console.log(formData, classroomID, uuid);
        if (isUserInClass(uuid, classroomID)) {
            //Getting fileIDs
            const fileIDs = await getFileIDList();

            //Step1: create announcement
            const announcementDetails = await announcementModel.create({
                ...formData,
                fileIDs,
                classroomID,
            });
            const announcementID = announcementDetails._id;
            if (!announcementID) {
                res.status(500).json({
                    data: null,
                    error: "Failed to create the announcement.",
                });
                return;
            }
            res.status(200).json({ data: announcementID, error: null });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};
