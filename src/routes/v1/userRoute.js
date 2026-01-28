import express from "express";
import { userController } from "#src/controllers/userController.js";

const Router = express.Router();

Router.post("/user", userController.updateProfile);

export const userRoute = Router;
