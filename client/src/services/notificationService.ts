import api from "../api/axiosInstance";

export const getNotificationsApi = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

// Lightweight — used for the sidebar badge poll so we're not pulling the
// full feed every 30s just to show a count.
export const getUnreadNotificationCountApi = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

export const markNotificationReadApi = async (id: string) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsReadApi = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};