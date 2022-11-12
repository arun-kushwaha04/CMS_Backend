const mongoose = require("mongoose");
const submissionModel = require("../model/post/submissionSchema");
const StudentClassAvgModel = require("../model/results/StudentClassAvgSchema");

const {
    isUserInClass,
    isPostInClass,
    uuidToUserDetails,
} = require("../utils/controllerUtils");

exports.postSubmission = async (req, res) => {
    const getFileIDList = () => {
        const files = req.files;
        let fileIDs = [];
        for (let i = 0; i < files.length; i++) {
            fileIDs.push(files[i].id);
        }
        return fileIDs;
    };

    try {
        const classroomID = req.body.classroomID;
        const { userID } = await uuidToUserDetails(req.body.uuid);
        const assignmentID = req.body.assignmentID;
        if (
            isUserInClass(req.body.uuid, classroomID) &&
            isPostInClass(assignmentID, "asg", classroomID)
        ) {
            //Getting fileIDs

            const fileIDs = await getFileIDList();

            const submission = await submissionModel.findOne({
                assignmentID,
                studentID: userID,
            });
            const submissionDetails = await submissionModel.findByIdAndUpdate(
                { _id: submission._id },
                { submissionDate: Date.now(), fileIDs },
                { lean: true }
            );
            res.status(200).json({ data: submissionDetails, error: null });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};

exports.getSubmission = async (req, res) => {
    try {
        const classroomID = req.query.classID;
        const { userID } = await uuidToUserDetails(req.body.uuid);
        const assignmentID = req.query.asgID;
        if (
            isUserInClass(req.body.uuid, classroomID) &&
            isPostInClass(assignmentID, "asg", classroomID)
        ) {
            const submission = await submissionModel
                .findOne({
                    assignmentID,
                    studentID: userID,
                })
                .populate("fileIDs");

            res.status(200).json({ data: submission, error: null });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};

exports.getSubmissions = async (req, res) => {
    try {
        const classroomID = req.query.classID;
        const assignmentID = req.query.asgID;
        if (
            isUserInClass(req.body.uuid, classroomID) &&
            isPostInClass(assignmentID, "asg", classroomID)
        ) {
            const submissions = await submissionModel
                .find({
                    assignmentID,
                })
                .populate("fileIDs")
                .populate({
                    path: "studentID",
                    select: "name email",
                })
                .populate("assignmentID");

            res.status(200).json({ data: submissions, error: null });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};

exports.saveMarks = async (req, res) => {
    try {
        const classroomID = req.body.classroomID;
        const studentID = req.body.studentID;
        const assignmentID = req.body.assignmentID;
        if (
            isUserInClass(req.body.uuid, classroomID) &&
            isPostInClass(assignmentID, "asg", classroomID)
        ) {
            //Getting fileIDs

            const submission = await submissionModel
                .findOne({
                    assignmentID,
                    studentID,
                })
                .populate({ path: "assignmentID", select: "maxMarks" });

            const submissionDetails = await submissionModel
                .findByIdAndUpdate(
                    { _id: submission._id },
                    { marks: req.body.marks },
                    { new: true }
                )
                .populate("fileIDs")
                .populate({
                    path: "studentID",
                    select: "name email",
                })
                .populate("assignmentID");
            const normalizedMarks =
                (100 * req.body.marks) / submission.assignmentID.maxMarks;
            const normalizedMarksOld =
                (100 * submission.marks) / submission.assignmentID.maxMarks;
            if (submission.marks == -1) {
                await StudentClassAvgModel.findOneAndUpdate(
                    { studentID, classroomID },
                    {
                        $inc: {
                            correctedSubmissions: 1,
                            totalMarks: normalizedMarks,
                        },
                    }
                );
            } else {
                await StudentClassAvgModel.findOneAndUpdate(
                    { studentID, classroomID },
                    {
                        $inc: {
                            totalMarks: normalizedMarks - normalizedMarksOld,
                        },
                    }
                );
            }

            res.status(200).json({ data: submissionDetails, error: null });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};
