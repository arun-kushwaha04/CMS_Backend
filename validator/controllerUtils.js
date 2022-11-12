const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;
const userModel = require("../model/user/userSchema");
const classroomModel = require("../model/classroom/classroom");
const assignmentModel = require("../model/post/assignmentSchema");
const announcementModel = require("../model/post/announcementSchema");
const submissionModel = require("../model/post/submissionSchema");
const StudentClassAvgModel = require("../model/results/StudentClassAvgSchema");

exports.isUserInClass = async (uuid, classroomID) => {
    try {
        const user = await userModel.findOne({ uuid: uuid });
        return (
            user && user.classroomIDs && user.classroomIDs.includes(classroomID)
        );
    } catch (e) {
        throw e;
    }
};

exports.getStudentIDs = async (classroomID) => {
    try {
        const result = await classroomModel.findById(ObjectID(classroomID), {
            studentIDs: true,
        });
        return result.studentIDs;
    } catch (e) {
        throw e;
    }
};

exports.isPostInClass = async (postID, postType, classroomID) => {
    try {
        const post = await (postType === "asg"
            ? assignmentModel
            : announcementModel
        ).findById(postID);
        return classroomID === post.classroomID;
    } catch (e) {
        throw e;
    }
};

exports.uuidToUserDetails = async (uuid) => {
    try {
        const user = await userModel.findOne({ uuid: uuid });
        return { userID: user._id, email: user.email };
    } catch (e) {
        throw e;
    }
};

exports.getAllClassroomAssignments = async (
    classroomID,
    studentID = undefined
) => {
    try {
        const assignments = await assignmentModel.find({ classroomID });
        let allAssignments = [];
        for (let i = 0; assignments && i < assignments.length; i++) {
            allAssignments.push({
                studentID,
                assignmentID: assignments[0]._id,
            });
        }
        return allAssignments;
    } catch (e) {
        throw e;
    }
};

exports.enrollStudentToTheClassroom = async (classID, email) => {
    try {
        const student = await userModel.findOneAndUpdate(
            {
                email,
            },
            { $addToSet: { classroomIDs: classID } },
            {
                fields: { _id: 1 },
                new: true,
            }
        );
        if (!student) {
            console.error("Failed email not registered");
            throw "Failed email not registered";
        }
        await classroomModel.findByIdAndUpdate(classID, {
            $addToSet: { studentIDs: student._id },
        });
        //check if there exist any assignments before enroll
        const allAssignments = await exports.getAllClassroomAssignments(
            classID,
            student._id
        );
        let bulkOps = [];
        for (let i = 0; i < allAssignments.length; i++) {
            let upsertDoc = {
                updateOne: {
                    filter: {
                        studentID: allAssignments[i].studentID,
                        assignmentID: allAssignments[i].assignmentID,
                    },
                    update: { $set: allAssignments[i] },
                    upsert: true,
                    setDefaultsOnInsert: true,
                },
            };
            bulkOps.push(upsertDoc);
        }
        const bulkWriteOpResult = await submissionModel.bulkWrite(bulkOps);
    } catch (error) {
        throw error;
    }
};

exports.getClassAvg = async (classroomID) => {
    try {
        const avgs = await StudentClassAvgModel.aggregate([
            { $match: { classroomID: ObjectID(classroomID) } },
            {
                $group: {
                    _id: "$classroomID",
                    totalMarks: {
                        $sum: "$totalMarks",
                    },
                    correctedSubmissions: {
                        $sum: "$correctedSubmissions",
                    },
                },
            },
        ]);
        const classAvg = Math.round(
            avgs && avgs.length
                ? avgs[0].totalMarks / avgs[0].correctedSubmissions
                : 0
        );
        return classAvg;
    } catch (e) {
        throw e;
    }
};

exports.getStudentsClassAvg = async (classroomID, studentID) => {
    try {
        let result = await submissionModel
            .find({
                studentID: studentID,
            })
            .populate({
                path: "assignmentID",
                match: { classroomID: ObjectID(classroomID) },
            });

        result = result.filter((item) => item.assignmentID);
        const DR = result.length;
        let NR = 0;
        result.forEach(
            (item) =>
                (NR +=
                    item.marks > -1
                        ? (item.marks * 100) / item.assignmentID.maxMarks
                        : 0)
        );
        const avg = Math.round(NR / DR);
        return avg;
    } catch (e) {
        throw e;
    }
};

exports.getAssignmentAvg = async (assignmentID) => {
    try {
        let allAssignmentSubmissionsModel = await submissionModel.aggregate([
            { $match: { assignmentID } },
        ]);
        const DR = allAssignmentSubmissionsModel.length;
        allAssignmentSubmissionsModel = await submissionModel.aggregate([
            { $match: { assignmentID,marks:{$gt:-1} } },
            { $group: { "_id":assignmentID ,'total':{$sum:"$marks"}} },
        ])
        const NR = allAssignmentSubmissionsModel.length?allAssignmentSubmissionsModel[0].total || 0 : 0;
        const avg = Math.round(NR / DR);
        return avg;
    } catch (e) {
        throw e;
    }
};
