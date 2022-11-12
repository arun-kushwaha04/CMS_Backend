const express = require("express");
const router = express.Router();
const commentController = require("../controller/commentController");
const commentValidator = require("../validator/commentValidator");
//comment endpoints

router.post(
    "/postComment",
    commentValidator.postCommentValidator,
    commentController.postComment
);
// Exporting routes
module.exports.router = router;
