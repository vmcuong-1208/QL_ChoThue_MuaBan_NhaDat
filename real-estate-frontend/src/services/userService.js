import axios from "axios";

const API_URL = "http://localhost:5000/api";

const getUsers = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const updateUser = async (userId, data) => {
  const token = localStorage.getItem("token");
  await axios.put(`${API_URL}/users/${userId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export default {
  getUsers,
  updateUser,
};