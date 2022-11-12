const express = require("express");
const router = express.Router();
//Assignment endpoints
const adminController = require("../controller/adminController");
const adminValidator = require("../validator/adminValidator");

router.post(
    "/register",
    adminValidator.registerUserValidator,
    adminController.registerUserController
);
router.post(
    "/disable",
    adminValidator.disableUserValidator,
    adminController.disableUserController
);
router.get(
    "/getUserList",
    adminValidator.getUserListValidator,
    adminController.getUserListController
);
router.post(
    "/updateUser",
    adminValidator.updateUserDetailsValidator,
    adminController.updateUserDetailsController
);
router.get(
    "/getAllBatchCodes",
    adminController.getAllBatchCodesController
);
// Exporting routes
module.exports.router = router;
