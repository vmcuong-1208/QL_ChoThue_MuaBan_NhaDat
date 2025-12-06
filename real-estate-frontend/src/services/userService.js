import api from "./api";

const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

const updateUser = async (userId, data) => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};

export default {
  getUsers,
  updateUser,
};
