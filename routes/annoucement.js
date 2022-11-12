const express = require("express");
const router = express.Router();
//Assignment endpoints
const announcementController = require("../controller/announcementController");
const { multipleFileUpload } = require("../controller/fileController");
const announcementValidator = require("../validator/announcementValidator");

router.get(
    "/getAnnouncementDetails",
    announcementValidator.validateAnnouncement,
    announcementController.getAnnouncementDetails
);
router.post(
    "/postAnnouncement",
    multipleFileUpload,
    announcementController.postAnnouncement
);
// Exporting routes
module.exports.router = router;
