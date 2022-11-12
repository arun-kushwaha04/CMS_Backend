const express = require("express");
const router = express.Router();
const { multipleFileUpload } = require("../controller/fileController");
const submissionValidator = require("../validator/submissionValidator");
const submissionController = require("../controller/submissionController");

router.post(
    "/postSubmission",
    multipleFileUpload,
    submissionValidator.postSubmissionValidator,
    submissionController.postSubmission
);

router.get(
    "/getSubmission",
    submissionValidator.getSubmissionValidator,
    submissionController.getSubmission
);

router.get(
    "/getSubmissions",
    submissionValidator.getSubmissionValidator,
    submissionController.getSubmissions
);
router.post(
    "/saveMarks",
    submissionValidator.saveMarksValidator,
    submissionController.saveMarks
);
module.exports.router = router;
