import { userService } from "#src/services/userService.js";
import { PushToken } from "#src/models/pushTokenModel.js";

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
    const search = req.query.search;

    const filterDirect = fetchType === "direct";

    const users = await userService.getAllUsers(
      currentUserId,
      filterDirect,
      search,
    );

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const savePushToken = async (req, res) => {
  try {
    const { userId, token, deviceType } = req.body;

    if (!userId || !token) {
      console.error("❌ [Save Token] Missing userId or token");
      return res.status(400).json({
        success: false,
        message: "userId and token are required",
      });
    }

    // Token là duy nhất cho mỗi thiết bị.
    // Nếu token đã tồn tại (kể cả đang gắn với user khác) thì cập nhật lại userId/deviceType.
    const existingToken = await PushToken.findOne({ token });

    if (existingToken) {
      existingToken.userId = userId;
      existingToken.deviceType = deviceType;
      existingToken.updatedAt = new Date();
      await existingToken.save();
    } else {
      await PushToken.create({ userId, token, deviceType });
    }

    res.status(200).json({
      success: true,
      message: "Push token saved successfully",
    });
  } catch (error) {
    // Nếu trùng key do index unique(token) thì coi như đã tồn tại, trả success để FE không báo lỗi
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Push token already exists",
      });
    }

    console.error("Save push token error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const userController = {
  updateProfile,
  getAllUsers,
  savePushToken,
};
