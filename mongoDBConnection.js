const mongoose = require("mongoose");

const mongoConnection = async () => {
    try {
        await mongoose.connect
            (
                global.mongoURI,
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    connectTimeoutMS: 1000
                }
            );
            return mongoose.connection;
    } catch (error) {
        throw error;
    }
}
module.exports = mongoConnection;