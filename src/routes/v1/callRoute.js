import express from "express";
import { callController } from "#src/controllers/callController.js";

const Router = express.Router();

Router.post("/", callController.saveCall);
Router.get("/:userId", callController.getCallHistory);

export const callRoute = Router;