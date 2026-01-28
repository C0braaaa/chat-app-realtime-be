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

    res
      .status(200)
      .json({
        success: true,
        message: "Cập nhật thành công!",
        data: updatedUser,
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const userController = {
  updateProfile,
};
