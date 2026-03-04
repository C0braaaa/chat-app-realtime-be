import { StreamVideoClient } from '@stream-io/node-sdk';
import { env } from '#src/config/environment.js';

const apiKey = env.STREAM_API_KEY;
const secret = env.STREAM_API_SECRET;

const client = new StreamVideoClient(apiKey, secret);

export const getStreamToken = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "Thiếu userId" });

    // Tạo token có hiệu lực trong 24 giờ
    const token = client.createToken({ user_id: userId, validity_in_seconds: 86400 });
    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};