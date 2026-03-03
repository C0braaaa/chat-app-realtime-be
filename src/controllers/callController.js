import { callService } from "#src/services/callService.js";

const saveCall = async (req, res) => {
  try {
    const { senderId, receiverId, type, status, duration } = req.body;

    const callRecord = await callService.saveCall({
      senderId,
      receiverId,
      type,
      status,
      duration,
    });

    res.status(201).json({ success: true, data: callRecord });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

const getCallHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await callService.getCallHistory(userId);
    
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const callController = {
  saveCall,
  getCallHistory,
};