import { userModel } from "#src/models/userModel.js";
import { conversationModel } from "#src/models/conversationModel.js";

const updateProfile = async (userId, { name, avatar }) => {
  const updatedUser = await userModel.User.findByIdAndUpdate(
    userId,
    {
      name,
      avatar,
    },
    { new: true },
  );
  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

// get all users
const getAllUsers = async (currentUserId, filterDirect = false) => {
  let excludedIds = [currentUserId]; // Mặc định loại bỏ chính mình

  // Nếu cờ filterDirect = true (tức là đang ở chế độ tạo Direct Chat)
  if (filterDirect) {
    // 1. Tìm các cuộc hội thoại direct của user hiện tại
    const existingConversations = await conversationModel.Conversation.find({
      type: "direct",
      participants: { $in: [currentUserId] },
    });

    // 2. Lấy ID của những người đã chat cùng
    existingConversations.forEach((conv) => {
      conv.participants.forEach((participantId) => {
        if (participantId.toString() !== currentUserId.toString()) {
          excludedIds.push(participantId);
        }
      });
    });
  }

  // 3. Query User và loại bỏ danh sách excludedIds
  const users = await userModel.User.find({
    _id: { $nin: excludedIds }, // $nin: Không nằm trong danh sách này
  }).select("-password");

  return users;
};
export const userService = {
  updateProfile,
  getAllUsers,
};
