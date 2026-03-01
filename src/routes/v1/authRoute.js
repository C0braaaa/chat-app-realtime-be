import express from "express";
import { authController } from "#src/controllers/authControler.js";

const Router = express.Router();

Router.post("/register", authController.register);
Router.post("/login", authController.login);
Router.post("/forgot-password", authController.forgotPassword);
Router.post("/verify-otp", authController.verifyOtp);
Router.post("/reset-password", authController.resetPassword);

export const authRoute = Router;
