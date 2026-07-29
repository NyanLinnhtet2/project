import api from "../api/axiosInstance";

export interface AIChatMessage {
  role: "user" | "model";
  text: string;
}

export const sendAssistantMessageApi = async (
  message: string,
  history: AIChatMessage[],
) => {
  const response = await api.post("/ai-assistant/chat", { message, history });
  return response.data;
};
