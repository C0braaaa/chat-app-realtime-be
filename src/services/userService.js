import { userModel } from "#src/models/userModel.js";

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

export const userService = {
  updateProfile,
};
