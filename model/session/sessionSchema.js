const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const UsersSessionSchema = new mongoose.Schema
    (
        {
            sessionID: {
                type: String,
                require: true
            },
            user: { type: Schema.Types.ObjectId, ref: 'Users' },
            clientAgent: {
                type: String,
                require: true
            },
            jwtUid: {
                type: String,
                required: true
            },
            refreshToken: {
                type: String,
                required: true
            },
        },
        {
            timestamps: true
        }
    );


module.exports = mongoose.model('UsersSession', UsersSessionSchema);