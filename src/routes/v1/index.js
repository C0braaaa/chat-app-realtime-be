import express from "express";
import { authRoute } from "./authRoute.js";

const Router = express.Router();

Router.use("/auth", authRoute);

export const APIs_V1 = Router;
