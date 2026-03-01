import mongoose from "mongoose";
import { env } from "./environment.js";

const connecDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      // Mongoose 6+ has sensible defaults; keep options here for compatibility
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log("MongoDB connection established");
  } catch (error) {
    console.log("MongoDB connection error:", error);
    // Rethrow so the caller knows connection failed and can stop the server
    throw error;
  }
};

export default connecDB;
