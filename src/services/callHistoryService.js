import { callHistoryModel } from "#src/models/callHistoryModel.js";
const createCallRecord = async ({
  conversationId,
  callerId,
  receiverId,
  callType,
}) => {
  const record = await callHistoryModel.CallHistory.create({
    conversationId,
    callerId,
    receiverId,
    callType,
    status: "missed",
  });
  return record;
};

const markCallAccepted = async (callId) => {
  const record = await callHistoryModel.CallHistory.findByIdAndUpdate(
    callId,
    { startedAt: new Date() },
    { new: true },
  );
  return record;
};

const markCallEnded = async (callId) => {
  const record = await callHistoryModel.CallHistory.findById(callId);
  if (!record) return null;
  if (!record.startedAt) return record;

  const endedAt = new Date();
  const duration = Math.floor((endedAt - new Date(record.startedAt)) / 1000);

  const updated = await callHistoryModel.CallHistory.findByIdAndUpdate(
    callId,
    { status: "completed", endedAt, duration },
    { new: true },
  );
  return updated;
};

const markCallRejected = async (callId) => {
  const record = await callHistoryModel.CallHistory.findByIdAndUpdate(
    callId,
    { status: "rejected" },
    { new: true },
  );
  return record;
};

const getCallsByConversation = async (conversationId) => {
  const calls = await callHistoryModel.CallHistory.find({ conversationId })
    .populate("callerId", "name avatar")
    .populate("receiverId", "name avatar")
    .sort({ created_at: -1 });
  return calls;
};

export const callHistoryService = {
  createCallRecord,
  markCallAccepted,
  markCallEnded,
  markCallRejected,
  getCallsByConversation,
};
