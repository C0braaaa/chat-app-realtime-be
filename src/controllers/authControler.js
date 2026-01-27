import { authService } from "#src/services/authService.js";

// register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await authService.register({ name, email, password });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const authController = {
  register,
  login,
};
