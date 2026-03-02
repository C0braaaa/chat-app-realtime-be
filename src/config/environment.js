import dotenv from "dotenv";
dotenv.config({ path: ".env" });

export const env = {
  APP_PORT: process.env.APP_PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_NAME: process.env.DATABASE_NAME,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  BOT_USER_ID: process.env.BOT_USER_ID,
};
