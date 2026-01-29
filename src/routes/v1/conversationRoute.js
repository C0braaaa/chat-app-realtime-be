import { conversationController } from "#src/controllers/conversationController.js";
import express from "express";

const Router = express.Router();

Router.post("/conversation", conversationController.createConversation);
Router.get("/conversation", conversationController.getConversations);

export const conversationRoute = Router;
