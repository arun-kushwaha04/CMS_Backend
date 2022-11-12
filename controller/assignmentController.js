const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;
const assignmentModel = require("../model/post/assignmentSchema");
const submissionModel = require("../model/post/submissionSchema");
const { isUserInClass, getStudentIDs } = require("../utils/controllerUtils");

exports.getAssignmentDetails = async (req, res) => {
    try {
        const assignmentID = req.query.asgID;
        const classroomID = req.query.classID;
        const uuid = req.body.uuid;
        const result = await assignmentModel
            .findById(ObjectID(assignmentID))
            .populate({
                path: "commentIDs",
                populate: { path: "userID", select: "name" },
            })
            .populate({
                path: "classroomID",
                // select: "subjectName",
                populate: {
                    path: "facultyID",
                    select: "name",
                },
            })
            .populate("fileIDs");

        if (
            result.classroomID._id == classroomID &&
            isUserInClass(uuid, classroomID)
        ) {
            res.status(200).json({ data: result, error: null });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};

exports.postAssignment = async (req, res) => {
    const getSubmissionList = (studentIDs, assignmentID) => {
        let submissions = [];
        for (let i = 0; i < studentIDs.length; i++) {
            submissions.push({
                assignmentID,
                studentID: studentIDs[i],
            });
        }
        return submissions;
    };

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
            //Getting studentIDs and fileIDs
            const studentIDs = await getStudentIDs(classroomID);
            const fileIDs = await getFileIDList();

            //Step1: create assignment
            const asgDetails = await assignmentModel.create({
                ...formData,
                fileIDs,
                classroomID,
            });
            const asgID = asgDetails._id;
            if (!asgID) {
                res.status(500).json({
                    data: null,
                    error: "Failed to create the assignment.",
                });
                return;
            }

            //Step2: create empty submissions for batch
            const submissions = getSubmissionList(studentIDs, asgID);
            await submissionModel.insertMany(submissions);

            res.status(200).json({ data: asgID, error: null });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};
