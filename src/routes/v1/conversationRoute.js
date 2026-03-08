import { conversationController } from "#src/controllers/conversationController.js";
import express from "express";

const Router = express.Router();

Router.post("/conversation", conversationController.createConversation);
Router.get("/conversation", conversationController.getConversations);
Router.delete("/:conversationId", conversationController.deleteConversation);
Router.delete("/group/:conversationId", conversationController.deleteGroup);
Router.put("/theme/:conversationId", conversationController.updateTheme);

export const conversationRoute = Router;
