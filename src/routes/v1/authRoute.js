import express from "express";
import { authController } from "#src/controllers/authControler.js";

const Router = express.Router();

Router.post("/register", authController.register);
Router.post("/login", authController.login);

export const authRoute = Router;
