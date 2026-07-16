import api from "../api/axiosInstance";

export const loginUser = async (email: string, password: string) => {
  const { data } = await api.post(`/auth/login`, {
    email,
    password,
  });

  return data;
};

export const logoutUser = async () => {
  const { data } = await api.post(`/auth/logout`);

  return data;
};

// export const getCurrentUser = async () => {
//   const { data } = await axios.get(`${API_URL}/auth/me`, {
//     withCredentials: true,
//   });

//   return data;
// };
