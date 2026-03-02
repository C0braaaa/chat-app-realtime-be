import express from "express";
import { userController } from "#src/controllers/userController.js";

const Router = express.Router();

Router.post("/user", userController.updateProfile);
Router.get("/user", userController.getAllUsers);
Router.post("/push-token", userController.savePushToken);

export const userRoute = Router;
