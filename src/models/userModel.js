import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên!"],
    },
    email: {
      type: String,
      required: [true, "Vui lòng nhập email!"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Email không hợp lệ!"],
    },
    password: {
      type: String,
      required: [true, "Vui lòng nhập mật khẩu!"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
      select: false, // Ẩn mật khẩu khi query để bảo mật
    },
    avatar: {
      type: String,
      default:
        "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1",
      validate: {
        validator: (value) => {
          return !value || validator.isURL(value);
        },
        message: "Link avatar không hợp lệ!",
      },
    },
  },
  {
    // Cấu hình timestamps để dùng tên trường theo ý bạn (snake_case)
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

// register
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// compare password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

export const userModel = {
  User,
};
