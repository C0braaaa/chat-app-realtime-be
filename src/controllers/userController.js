import { userService } from "#src/services/userService.js";

const updateProfile = async (req, res) => {
  try {
    const { userId, name, avatar } = req.body;

    const updatedUser = await userService.updateProfile(userId, {
      name,
      avatar,
    });

    const io = req.app.get("socketio");
    if (io) {
      io.emit("user_updated", updatedUser);
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công!",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// get all users
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.query.userId;
    const fetchType = req.query.fetchType;

    const filterDirect = fetchType === "direct";

    const users = await userService.getAllUsers(currentUserId, filterDirect);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const userController = {
  updateProfile,
  getAllUsers,
};
