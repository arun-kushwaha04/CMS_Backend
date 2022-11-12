const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const ClassRoomSchema = new mongoose.Schema
    (
        {
            facultyID: { type: Schema.Types.ObjectId, ref: 'Users' },
            subjectName: {
                type: String,
                required: true
            },
            batchCode: {
                type: String,
                required: true
            },
            semester: {
                type: String,
                required: true
            }, 
            description: {
                type: String,
                required: true
            },
            studentIDs: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
            assistantIDs: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
            meetingID: {
                type: String,
            },
            theme: {
                type: String,
                default: ''
            },
        },
        {
            timestamps: true
        }
    )
module.exports = mongoose.model('Classrooms', ClassRoomSchema);
