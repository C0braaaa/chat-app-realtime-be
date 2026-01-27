import dotenv from "dotenv";
dotenv.config({ path: ".env" });

export const env = {
  APP_PORT: process.env.APP_PORT,
  MONGODB_URI: process.env.MONGODB_URI,
};
