const mongoose = require("mongoose");
const ObjectID = mongoose.Types.ObjectId;
require("../model/comment/commentSchema");
require("../model/uploads/uploads").uploadMetaModel;
const assignmentModel = require("../model/post/assignmentSchema");
const announcementModel = require("../model/post/announcementSchema");
const classroomModel = require("../model/classroom/classroom");
const {
    isUserInClass,
    uuidToUserDetails,
    getAllClassroomAssignments,
    getClassAvg,
    getStudentsClassAvg,
    getAssignmentAvg,
} = require("../utils/controllerUtils");
const userModel = require("../model/user/userSchema");
const submissionModel = require("../model/post/submissionSchema");
const studentClassAvgModel = require("../model/results/StudentClassAvgSchema");
const { nanoid } = require("nanoid");

exports.getUpcomingAssignments = async (req, res) => {
    try {
        const classroomID = req.query.classID;
        // const studentID = req.query.id;
        const uuid = req.body.uuid;
        const { userID } = await uuidToUserDetails(uuid);
        if (isUserInClass(uuid, classroomID)) {
            const result = await submissionModel
                .find({
                    studentID: ObjectID(userID),
                    submissionDate: { $exists: false },
                })
                .populate({
                    path: "assignmentID",
                    match: { classroomID: ObjectID(classroomID) },
                });
            res.status(200).json({
                data: result.filter(
                    (item) =>
                        item.assignmentID &&
                        item.assignmentID.dueDate > Date.now()
                ),
                error: null,
            });
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};

exports.getUserClassAssignments = async (req, res) => {
    try {
        const classroomID = req.query.classID;
        const uuid = req.body.uuid;
        const { userID } = await uuidToUserDetails(uuid);
        if (isUserInClass(uuid, classroomID)) {
            const result = await submissionModel
                .find({
                    studentID: ObjectID(userID),
                })
                .populate({
                    path: "assignmentID",
                    match: {
                        classroomID: ObjectID(classroomID),
                    },
                });
            let assignmentIDs = [];
            let assignments = result.filter((asg) => {
                if (asg.assignmentID) {
                    assignmentIDs.push(asg.assignmentID._id);
                    return true;
                }
                return false;
            });
            //calculate class Average
            const studentAvg = await studentClassAvgModel.find({
                classroomID,
                studentID: userID,
            });
            const classAverage = await getClassAvg(classroomID);
            if (assignments.length && studentAvg.length) {
                res.status(200).json({
                    data: {
                        assignments,
                        classAverage,
                    },
                    error: null,
                });
            } else {
                res.status(404).json({
                    data: null,
                    error: "Failed to fetch data!",
                });
            }
        } else {
            res.status(403).json({ data: null, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};

exports.getClassroomDetails = async (req, res) => {
    try {
        const classroomID = req.query.classID;
        const uuid = req.body.uuid;
        if (isUserInClass(uuid, classroomID)) {
            const result = await classroomModel.findById(ObjectID(classroomID));
            res.status(200).json({ data: result, error: null });
        } else {
            res.status(403).json({ data: result, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};

exports.getPostFeed = async (req, res) => {
    try {
        const classroomID = req.query.classID;
        const uuid = req.body.uuid;
        if (isUserInClass(uuid, classroomID)) {
            const asgFeed = await assignmentModel
                .find({
                    classroomID: classroomID,
                })
                .populate({
                    path: "commentIDs",
                    populate: { path: "userID", select: "name" },
                })
                .populate({
                    path: "facultyID",
                    select: "name email",
                })
                .populate("fileIDs");

            const annFeed = await announcementModel
                .find({
                    classroomID: classroomID,
                })
                .populate({
                    path: "commentIDs",
                    populate: { path: "userID", select: "name" },
                })
                .populate({
                    path: "userID",
                    select: "name email",
                })
                .populate("fileIDs");
            let feed = [...asgFeed, ...annFeed];
            feed.sort((a, b) => b.createdAt - a.createdAt);
            res.status(200).json({ data: feed, error: null });
        } else {
            res.status(403).json({ data: result, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};

exports.createClassroom = async (req, res) => {
    try {
        const themes = [
            "orange",
            "purple",
            "blue",
            "red",
            "green",
            "yellow",
            "orange",
        ];
        const theme = themes[Math.floor(Math.random() * 6)];
        const studentIDs = await userModel.find(
            { batchCode: req.body.batchCode },
            { _id: true }
        );
        const result = await classroomModel.create({
            ...req.body,
            theme,
            studentIDs,
            meetingID: nanoid(10),
        });
        const classID = result._id;
        //enroll students to the classroom
        await userModel.updateMany(
            {
                $or: [
                    { batchCode: req.body.batchCode },
                    { _id: req.body.facultyID },
                ],
            },
            { $push: { classroomIDs: classID } }
        );
        //create studentclassavg for all enrolled students
        let insertOption = [];
        for (let i = 0; i < studentIDs.length; i++) {
            insertOption.push({
                classroomID: classID,
                studentID: studentIDs[i],
            });
        }
        await studentClassAvgModel.insertMany(insertOption);
        if (classID) {
            res.status(200).json({ data: result, error: null });
        } else {
            res.status(500).json({
                data: null,
                error: "Internal Server Error!",
            });
        }
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
};

exports.getPeopleInClassroom = async (req, res) => {
    try {
        const classroomID = req.query.classID;
        const uuid = req.body.uuid;
        if (isUserInClass(uuid, classroomID)) {
            // const people = await userModel
            //     .find({
            //         classroomIDs: {
            //             $all: [classroomID],
            //         },
            //     })
            //     .select("name role email");
            const allPeople = await classroomModel
                .findById(ObjectID(classroomID))
                .populate({
                    path: "facultyID",
                    select: "name role email",
                })
                .populate({
                    path: "studentIDs",
                    select: "name role email",
                })
                .populate({
                    path: "assistantIDs",
                    select: "name role email",
                });
            const faculty = allPeople.facultyID,
                students = allPeople.studentIDs,
                assistant = allPeople.assistantIDs.map((item) => {
                    let data = item;
                    data.role = "assistant";
                    return data;
                });
            const people = [faculty, ...students, ...assistant];
            // console.log(people)
            people.sort((a, b) => {
                return a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1;
            });
            res.status(200).json({ data: people, error: null });
        } else {
            res.status(403).json({ data: result, error: "Access Denied" });
        }
    } catch (error) {
        res.status(500).json({
            data: null,
            error: error.message,
        });
    }
};

exports.addStudentToClassroom = async (req, res) => {
    try {
        const { classID, email, uuid } = req.body;
        if (!isUserInClass(uuid, classID)) {
            res.status(403).json({
                data: null,
                error: "User not faculty!",
            });
            return;
        }
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
            res.status(400).json({
                data: null,
                error: "Email not registered",
            });
            return;
        }
        await classroomModel.findByIdAndUpdate(classID, {
            $addToSet: { studentIDs: student._id },
        });
        //check if there exist any assignments before enroll
        const allAssignments = await getAllClassroomAssignments(
            classID,
            student._id
        );

        //upsert submissions
        // await submissionModel.insertMany(allAssignments);
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
                },
            };
            bulkOps.push(upsertDoc);
        }
        const bulkWriteOpResult = await submissionModel.collection.bulkWrite(
            bulkOps
        );

        res.status(200).json({ data: "Success", error: null });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            error: "Failed to add student to class!",
        });
    }
};

exports.removeStudentFromClassroom = async (req, res) => {
    try {
        const { classID, email, uuid } = req.body;
        if (!isUserInClass(uuid, classID)) {
            res.status(403).json({
                data: null,
                error: "User not faculty!",
            });
            return;
        }
        const student = await userModel.findOneAndUpdate(
            {
                email,
            },
            { $pull: { classroomIDs: classID } },
            {
                fields: { _id: 1 },
                new: true,
            }
        );
        if (!student) {
            res.status(400).json({
                data: null,
                error: "Email not registered",
            });
            return;
        }
        await classroomModel.findByIdAndUpdate(classID, {
            $pull: { studentIDs: student._id },
        });
        res.status(200).json({ data: "Success", error: null });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            error: "Failed to remove student to class!",
        });
    }
};

exports.unrollStudentFromClassroom = async (req, res) => {
    try {
        const { classID, uuid } = req.body;
        if (!isUserInClass(uuid, classID)) {
            res.status(403).json({
                data: null,
                error: "User not a student of the class!",
            });
            return;
        }
        const student = await userModel.findOneAndUpdate(
            {
                uuid,
            },
            { $pull: { classroomIDs: classID } },
            {
                fields: { _id: 1 },
                new: true,
            }
        );
        if (!student) {
            res.status(400).json({
                data: null,
                error: "Email not registered",
            });
            return;
        }
        await classroomModel.findByIdAndUpdate(classID, {
            $pull: { studentIDs: student._id, assistantIDs: student._id },
        });
        res.status(200).json({ data: "Success", error: null });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            error: "Failed to unroll student from class!",
        });
    }
};

exports.addAssistantToClassroom = async (req, res) => {
    try {
        const { classID, email, uuid } = req.body;
        if (!isUserInClass(uuid, classID)) {
            res.status(403).json({
                data: null,
                error: "User not faculty!",
            });
            return;
        }
        const assistant = await userModel.findOneAndUpdate(
            {
                email,
            },
            { $addToSet: { classroomIDs: classID } },
            {
                fields: { _id: 1 },
                new: true,
            }
        );
        if (!assistant) {
            res.status(400).json({
                data: null,
                error: "Email not registered",
            });
            return;
        }
        await classroomModel.findByIdAndUpdate(classID, {
            $pull: { studentIDs: assistant._id },
            $addToSet: { assistantIDs: assistant._id },
        });
        res.status(200).json({ data: "Success", error: null });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            error: "Failed to remove student to class!",
        });
    }
};

exports.removeAssistantFromClassroom = async (req, res) => {
    try {
        const { classID, email, uuid } = req.body;
        if (!isUserInClass(uuid, classID)) {
            res.status(403).json({
                data: null,
                error: "User not faculty!",
            });
            return;
        }
        const assistant = await userModel.findOneAndUpdate(
            {
                email,
            },
            { $pull: { classroomIDs: classID } },
            {
                fields: { _id: 1 },
                new: true,
            }
        );
        if (!assistant) {
            res.status(400).json({
                data: null,
                error: "Email not registered",
            });
            return;
        }
        await classroomModel.findByIdAndUpdate(classID, {
            $pull: { assistantIDs: assistant._id },
        });
        res.status(200).json({ data: "Success", error: null });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            error: "Failed to remove student to class!",
        });
    }
};

exports.getStudentAverageGraphData = async (req, res) => {
    try {
        const { classID } = req.query;
        const { uuid } = req.body;
        if (!isUserInClass(uuid, classID)) {
            res.status(403).json({
                data: null,
                error: "User not in the class",
            });
            return;
        }
        const { userID } = await uuidToUserDetails(uuid);
        const allClassStudents = (
            await classroomModel.findById(ObjectID(classID), { studentIDs: 1 })
        )?.studentIDs;
        if (!allClassStudents) {
            res.status(400).json({
                data: null,
                error: "Invalid ClassID given.",
            });
            return;
        }
        let data = [];
        for (let ID of allClassStudents) {
            const studentClassAvg = await getStudentsClassAvg(classID, ID);
            const user = await userModel.findById(ID);
            let obj = {
                y: studentClassAvg,
                name: user.name,
                email: user.email,
            };
            if (JSON.stringify(ID) === JSON.stringify(userID)) {
                obj.highlight = true;
            }
            data.push(obj);
        }

        data.sort((a, b) => {
            if (a.y == 0 && b.y == 0) {
                return a.name.localeCompare(b.name);
            } else {
                return b.y - a.y;
            }
        });
        for (let i = 0; i < data.length; i++) {
            data[i].x = i + 1;
        }
        res.status(200).json({ data: data, error: null });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            data: null,
            error: error,
        });
    }
};

exports.getStudentAssignmentsGraphData = async (req, res) => {
    try {
        const { classID } = req.query;
        const { uuid } = req.body;
        if (!isUserInClass(uuid, classID)) {
            res.status(403).json({
                data: null,
                error: "User not in the class",
            });
            return;
        }
        const { userID } = await uuidToUserDetails(uuid);
        const allClassAssignments = await assignmentModel
            .find({ classroomID: ObjectID(classID) })
            .sort({ createdAt: 1 });

        let data1 = [],
            data2 = [];
        for (let i = 0; i < allClassAssignments.length; i++) {
            const assignmentAvg = await getAssignmentAvg(
                allClassAssignments[i]._id
            );
            const studentAssignmentMarks = await submissionModel.findOne({
                assignmentID: allClassAssignments[i]._id,
                studentID: userID,
            });
            data1.push({
                x: `Assignment ${i + 1}`,
                y: assignmentAvg,
            });
            if (studentAssignmentMarks) {
                const nMarks =
                    ((studentAssignmentMarks.marks > -1
                        ? studentAssignmentMarks.marks
                        : 0) *
                        100) /
                    allClassAssignments[i].maxMarks;
                data2.push({
                    x: `Assignment ${i + 1}`,
                    y: nMarks,
                });
            }
        }
        let final = data2.length
            ? [
                  { id: "Class Average", data: data1 },
                  { id: "Your score", data: data2 },
              ]
            : [{ id: "Class Average", data: data1 }];
        if (data2.length === 0 && data1.length === 0) final = [];
        // console.log(data1, data2);
        res.status(200).json({ data: final, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: null,
            error: error.message,
        });
    }
};
