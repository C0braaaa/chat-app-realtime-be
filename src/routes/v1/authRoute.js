import express from "express";
import { authController } from "#src/controllers/authControler.js";

const Router = express.Router();

Router.post("register", () => {});
Router.post("login", () => {});

export const authRoute = Router;
