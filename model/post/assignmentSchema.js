const mongoose = require("mongoose"),
    Schema = mongoose.Schema;

const AssignmentSchema = new mongoose.Schema(
    {
        classroomID: {
            type: Schema.Types.ObjectId,
            ref: "Classrooms",
            required: true,
        },
        facultyID: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        body: {
            type: String,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        maxMarks: {
            type: Number,
            required: true,
        },
        commentIDs: [{ type: Schema.Types.ObjectId, ref: "Comments" }],
        fileIDs: [{ type: Schema.Types.ObjectId, ref: "Uploads" }],
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("Assignments", AssignmentSchema);
/*
    3.Attach files
*/
