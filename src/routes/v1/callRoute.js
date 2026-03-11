import express from "express";
import { callHistoryController } from "#src/controllers/callHistoryController.js";

const Router = express.Router();

Router.get(
  "/conversation/:conversationId",
  callHistoryController.getCallsByConversation,
);

export const callHistoryRoute = Router;
