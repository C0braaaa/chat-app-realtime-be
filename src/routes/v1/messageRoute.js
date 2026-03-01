import express from "express";
import { messageController } from "#src/controllers/messageController.js";

const Router = express.Router();

Router.post("/", messageController.sendMessage);
Router.get("/:conversationId", messageController.getMessages);
Router.delete("/:messageId", messageController.deleteMessage);
Router.put("/:messageId", messageController.editMessage);

export const messageRoute = Router;
