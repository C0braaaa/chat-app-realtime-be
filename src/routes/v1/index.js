import express from "express";
import { authRoute } from "./authRoute.js";
import { userRoute } from "./userRoute.js";
import { conversationRoute } from "./conversationRoute.js";
import { messageRoute } from "./messageRoute.js";
import { callHistoryRoute } from "./callRoute.js";

const Router = express.Router();

Router.use("/auth", authRoute);
Router.use("/users", userRoute);
Router.use("/conversations", conversationRoute);
Router.use("/messages", messageRoute);
Router.use("/calls", callHistoryRoute);

export const APIs_V1 = Router;
