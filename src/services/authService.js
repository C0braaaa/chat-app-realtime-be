import { userModel } from "#src/models/userModel.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "#src/utils/sendEmail.js";

// register
const register = async ({ name, email, password }) => {
  const isExistUser = await userModel.User.findOne({ email });

  if (isExistUser) {
    throw new Error("Email already exists!");
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
    throw new Error("Email not found!");
  }

  const isMatch = await user.correctPassword(password, user.password);
  if (!isMatch) {
    throw new Error("Incorrect password!");
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

const forgotPassword = async (email) => {
  const user = await userModel.User.findOne({ email });
  if (!user) throw new Error("User with this email does not exist.");

  // Tạo mã OTP ngẫu nhiên 6 số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu OTP và thiết lập hết hạn sau 5 phút (5 * 60 * 1000 ms)
  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpires = Date.now() + 5 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  // Gửi mail
  try {
    const message = `Your password reset OTP is: ${otp}. This OTP is valid for 5 minutes.`;
    await sendEmail({
      email: user.email,
      subject: "C Chat - Password Reset OTP",
      message,
    });
  } catch (error) {
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error("There was an error sending the email. Try again later!");
  }
};

const verifyOtp = async (email, otp) => {
  const user = await userModel.User.findOne({
    email,
    resetPasswordOtp: otp,
    resetPasswordOtpExpires: { $gt: Date.now() }, // Kiểm tra OTP còn hạn không
  });

  if (!user) {
    throw new Error("OTP is invalid or has expired.");
  }
  return true;
};

const resetPassword = async (email, otp, newPassword) => {
  const user = await userModel.User.findOne({
    email,
    resetPasswordOtp: otp,
    resetPasswordOtpExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("OTP is invalid or has expired.");

  // Cập nhật mật khẩu mới (hook pre-save trong model sẽ tự băm mật khẩu)
  user.password = newPassword;
  // Xóa OTP
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpires = undefined;
  await user.save();
};
export const authService = {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
