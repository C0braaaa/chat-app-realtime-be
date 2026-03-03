import { callModel } from "#src/models/callModel.js";

const saveCall = async ({ senderId, receiverId, type, status, duration }) => {
  const newCall = await callModel.Call.create({
    senderId,
    receiverId,
    type,
    status,
    duration,
  });
  
  const populatedCall = await newCall.populate("senderId receiverId", "name avatar");
  return populatedCall;
};

const getCallHistory = async (userId) => {
  const history = await callModel.Call.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  })
    .populate("senderId receiverId", "name avatar")
    .sort({ created_at: -1 }); // Sắp xếp cuộc gọi mới nhất lên đầu
    
  return history;
};

export const callService = {
  saveCall,
  getCallHistory,
};