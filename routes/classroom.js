const express = require("express");
const router = express.Router();
//Classroom routes
const classController = require("../controller/classController");
const classroomValidator = require("../validator/classroomValidator");

router.get(
    "/getUpcomingAssignments",
    classroomValidator.getUserClassAssignments,
    classController.getUpcomingAssignments
);
router.get(
    "/getUserClassAssignments",
    classroomValidator.getUserClassAssignments,
    classController.getUserClassAssignments
);
router.get(
    "/getClassroomDetails",
    classroomValidator.validateClassroom,
    classController.getClassroomDetails
);
router.post(
    "/createClassroom",
    classroomValidator.createClassroom,
    classController.createClassroom
);
router.get(
    "/getPostFeed",
    classroomValidator.validateClassroom,
    classController.getPostFeed
);
router.get(
    "/getPeopleInClassroom",
    classroomValidator.validateClassroom,
    classController.getPeopleInClassroom
);

router.post(
    "/addStudentToClassroom",
    classroomValidator.addStudentToClassroom,
    classController.addStudentToClassroom
);
router.post(
    "/removeStudentFromClassroom",
    classroomValidator.addStudentToClassroom,
    classController.removeStudentFromClassroom
);
router.post(
    "/addAssistantToClassroom",
    classroomValidator.addStudentToClassroom,
    classController.addAssistantToClassroom
);
router.post(
    "/removeAssistantFromClassroom",
    classroomValidator.addStudentToClassroom,
    classController.removeAssistantFromClassroom
);
router.post(
    "/unrollStudentFromClassroom",
    classroomValidator.unrollStudentFromClassroom,
    classController.unrollStudentFromClassroom
);
router.get(
    "/getStudentAverageGraphData",
    classroomValidator.getUserClassAssignments,
    classController.getStudentAverageGraphData
);
router.get(
    "/getStudentAssignmentsGraphData",
    classroomValidator.getUserClassAssignments,
    classController.getStudentAssignmentsGraphData
);
// Exporting routes
module.exports.router = router;
