const express = require("express");
const router = express.Router();
const fileController = require("../controller/fileController");

router.post("/files/upload-single", fileController.singleFileUpload);
router.post("/files/upload-multiple", fileController.multipleFileUpload);
router.get("/files/download", fileController.downloadFile);

// Exporting routes
module.exports.router = router;
