import mongoose from "mongoose";
import { env } from "./environment.js";

const connecDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
  } catch (error) {
    console.log("MongoDB connection error: ", error);
  }
};

export default connecDB;
