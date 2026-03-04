import express from "express";
import { getStreamToken } from "#src/controllers/streamController.js";

const Router = express.Router();

Router.post('/token', getStreamToken);

export const streamRoute = Router;
