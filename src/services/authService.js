import { userModel } from "#src/models/userModel.js";
import jwt from "jsonwebtoken";
import { env } from "#src/config/environment.js";

// register
const register = async ({ name, email, password }) => {
  const isExistUser = await userModel.User.findOne({ email });

  if (isExistUser) {
    throw new Error("Email đã được sử dụng!");
  }
  const newUser = await userModel.User.create({
    name,
    email,
    password,
  });
  return newUser;
};

//login
const login = async ({ email, password }) => {
  const user = await userModel.User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Email không tồn tại!");
  }

  const isMatch = await user.correctPassword(password, user.password);
  if (!isMatch) {
    throw new Error("Mật khẩu không chính xác!");
  }
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  const userObject = user.toObject();
  delete userObject.password;

  return { user: userObject, token };
};
export const authService = {
  register,
  login,
};
