const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const CommentSchema = new mongoose.Schema
    (
        {
            userID: { type: Schema.Types.ObjectId, ref: 'Users' },
            body: {
                type: String,
                required: true
            },
        },
        {
            timestamps: true
        }
    )
module.exports = mongoose.model('Comments', CommentSchema);
