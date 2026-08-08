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

// Hides one notification from this user's feed immediately — works for
// both derived (e.g. low stock) and persisted items, without waiting for
// the underlying condition (e.g. a restock) to resolve on its own.
export const dismissNotificationApi = async (id: string) => {
  const response = await api.post(`/notifications/${id}/dismiss`);
  return response.data;
};

// Permanently deletes a persisted notification. For a derived item this
// falls back to a dismiss server-side, so it's always safe to call.
export const deleteNotificationApi = async (id: string) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};