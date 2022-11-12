const express = require("express");
const router = express.Router();
//User Authentication routes
const authController = require("../controller/authController");
const authValidator = require("../validator/authValidations");
const userController = require("../controller/userController");

router.post(
    "/login",
    authValidator.loginValidator,
    authController.loginController
);
router.post(
    "/logout",
    authValidator.logoutValidator,
    authController.logoutController
);
router.post(
    "/getUserInfo",
    authValidator.logoutValidator,
    userController.getUserInfo
);
router.post(
    "/resetPassword",
    authValidator.resetPassword,
    authController.resetPassword
);
router.post(
    "/sendResetPasswordEmail",
    authValidator.sendResetPasswordEmail,
    authController.sendResetPasswordEmail
);
router.get(
    "/validMeetAccess",
    authValidator.meetAccessValidator,
    authController.validMeetAccess
)
// Exporting routes
module.exports.router = router;
