import { userModel } from "#src/models/userModel.js";
import { conversationModel } from "#src/models/conversationModel.js";

const updateProfile = async (userId, { name, avatar }) => {
  const updatedUser = await userModel.User.findByIdAndUpdate(
    userId,
    {
      name,
      avatar,
    },
    { returnDocument: "after" },
  );
  if (!updatedUser) {
    throw new Error("Không tìm thấy người dùng!");
  }

  return updatedUser;
};

// get all users
const getAllUsers = async (
  currentUserId,
  filterDirect = false,
  search = "",
) => {
  const BOT_ID = "69a4e9eac9f54c6cf692d028";
  let excludedIds = [currentUserId, BOT_ID]; // Mặc định loại bỏ chính mình và bot

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

  let query = { _id: { $nin: excludedIds } };

  // 3. Query User và loại bỏ danh sách excludedIds
  const usersRaw = await userModel.User.find(query).select("-password");

  if (!search) return usersRaw;

  // normalize function: remove diacritics and lowercase
  const normalize = (str) =>
    (str || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

  const normSearch = normalize(search);

  // filter in-memory to support diacritic-insensitive matching
  const users = usersRaw.filter((u) => normalize(u.name).includes(normSearch));

  return users;
};
export const userService = {
  updateProfile,
  getAllUsers,
};
