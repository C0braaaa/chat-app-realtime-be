import express from "express";
import { authRoute } from "./authRoute.js";
import { userRoute } from "./userRoute.js";
import { conversationRoute } from "./conversationRoute.js";

const Router = express.Router();

Router.use("/auth", authRoute);
Router.use("/users", userRoute);
Router.use("/conversations", conversationRoute);

export const APIs_V1 = Router;
