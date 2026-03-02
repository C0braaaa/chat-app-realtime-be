import { userModel } from "#src/models/userModel.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "#src/utils/sendEmail.js";

const register = async ({ name, email, password }) => {
  const isExistUser = await userModel.User.findOne({ email });

  if (isExistUser) {
    throw new Error("Email đã tồn tại!");
  }
  const newUser = await userModel.User.create({
    name,
    email,
    password,
  });
  return newUser;
};

const login = async ({ email, password }) => {
  const user = await userModel.User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Không tìm thấy email!");
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

const forgotPassword = async (email) => {
  const user = await userModel.User.findOne({ email });
  if (!user) throw new Error("Người dùng với email này không tồn tại.");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpires = Date.now() + 5 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    const message = `Mã OTP đặt lại mật khẩu của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`;
    await sendEmail({
      email: user.email,
      subject: "C Chat - Mã OTP đặt lại mật khẩu",
      message,
    });
  } catch (error) {
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error("Đã xảy ra lỗi khi gửi email. Vui lòng thử lại sau!");
  }
};

const verifyOtp = async (email, otp) => {
  const user = await userModel.User.findOne({
    email,
    resetPasswordOtp: otp,
    resetPasswordOtpExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Mã OTP không hợp lệ hoặc đã hết hạn.");
  }
  return true;
};

const resetPassword = async (email, otp, newPassword) => {
  const user = await userModel.User.findOne({
    email,
    resetPasswordOtp: otp,
    resetPasswordOtpExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("Mã OTP không hợp lệ hoặc đã hết hạn.");

  user.password = newPassword;
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
