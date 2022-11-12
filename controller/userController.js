const userModel = require("../model/user/userSchema");

exports.getUserInfo = async (req, res) => {
    try {
        const result = await userModel
            .findOne(
                { uuid: req.body.uuid },
                { name: true, email: true, classroomIDs: true, role: true }
            )
            .populate({
                path: "classroomIDs",
                populate: {
                    path: "facultyID",
                    select: "name email",
                },
            });
        result._id
            ? res.status(200).json({ data: result, error: null })
            : res
                  .status(400)
                  .json({ data: null, error: "No such user exists!" });
    } catch (error) {
        res.status(500).json({ data: null, error: error });
    }
};
