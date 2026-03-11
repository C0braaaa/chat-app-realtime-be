import { callHistoryService } from "#src/services/callHistoryService.js";

const getCallsByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const calls =
      await callHistoryService.getCallsByConversation(conversationId);
    res.status(200).json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const callHistoryController = { getCallsByConversation };
