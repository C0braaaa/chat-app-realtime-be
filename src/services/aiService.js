import Groq from "groq-sdk";
import { env } from "#src/config/environment.js";

// Khởi tạo Groq tự động nhận Key
const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export const getBotResponse = async (prompt) => {
  try {
    // 1. Gắn "nhân cách" cho Bot
    const systemPrompt = `Bạn tên là Jarvis, trợ lý ảo của ứng dụng C Chat. Hãy trả lời ngắn gọn, thân thiện, hài hước và chính xác bằng tiếng Việt. Câu hỏi của người dùng là: ${prompt}`;

    // 2. Gọi AI xử lý
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile", // Model Llama 3 mạnh nhất hiện tại
      temperature: 0.7,
      max_tokens: 1024,
    });

    return (
      chatCompletion.choices[0]?.message?.content ||
      "Xin lỗi, Jarvis không hiểu ý bạn."
    );
  } catch (error) {
    console.error("Groq AI Error:", error);
    return "Xin lỗi, Jarvis đang bận bảo trì hệ thống. Vui lòng thử lại sau nhé!";
  }
};
