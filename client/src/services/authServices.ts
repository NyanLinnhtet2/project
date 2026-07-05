import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Cookie support
axios.defaults.withCredentials = true;

export const loginUser = async (email: string, password: string) => {
  const { data } = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });

  return data;
};

export const logoutUser = async () => {
  const { data } = await axios.post(`${API_URL}/auth/logout`);

  return data;
};

// export const getCurrentUser = async () => {
//   const { data } = await axios.get(`${API_URL}/auth/me`, {
//     withCredentials: true,
//   });

//   return data;
// };
