const mongoose = require("mongoose"),
    Schema = mongoose.Schema;

const StudentClassAvgSchema = new mongoose.Schema(
    {
        classroomID: { type: Schema.Types.ObjectId, ref: "Classrooms" },
        studentID: { type: Schema.Types.ObjectId, ref: "Students" },
        totalMarks: {
            type: Number,
            default: 0,
            required: true,
        },
        correctedSubmissions: {
            type: Number,
            default: 0,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("StudentClassAvg", StudentClassAvgSchema);
