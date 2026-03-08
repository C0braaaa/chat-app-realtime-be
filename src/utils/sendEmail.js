import nodemailer from "nodemailer";
import { env } from "#src/config/environment.js";

export const sendEmail = async (options) => {
  // Cấu hình transporter (Dùng Gmail)
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: '"C Chat App" <' + env.SMTP_USER + ">",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};
