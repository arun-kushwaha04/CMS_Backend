const mongoose = require("mongoose"),
    Schema = mongoose.Schema;

const UsersSchema = new mongoose.Schema(
    {
        uuid: {
            type: String,
            require: true,
            unique: true,
        },
        name: {
            type: String,
        },
        email: {
            type: String,
            required: true,
        },
        batchCode:String,
        password: {
            type: String,
            required: true,
        },
        classroomIDs: [{ type: Schema.Types.ObjectId, ref: "Classrooms" }],
        role: {
            type: String,
            default: "student",
        },
        status: {
            type: String,
            default: "Active",
            required: true,
        },
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },
        disableReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Users", UsersSchema);
