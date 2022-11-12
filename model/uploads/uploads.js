const crypto = require("crypto");
const path = require("path");
const { GridFsStorage } = require("multer-gridfs-storage");
const multer = require("multer");
const mongoose = require("mongoose"),
    Schema = mongoose.Schema;

const storage = new GridFsStorage({
    url: global.mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename =
                    buf.toString("hex") + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    metadata: { originalname: file.originalname },
                    bucketName: "Uploads",
                    uploadDate: Date.now(),
                };
                resolve(fileInfo);
            });
        });
    },
});

module.exports.uploadMetaModel = mongoose.model(
    "Uploads",
    new Schema({}, { strict: false }),
    "Uploads.files"
);

module.exports.upload = multer({ storage });
