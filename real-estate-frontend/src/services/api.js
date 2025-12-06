import axios from "axios";

// Đọc URL từ biến môi trường
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor: Tự động đính kèm Bearer Token nếu có trong localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper hàm format URL ảnh/media từ server trả về
export const getMediaUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${SERVER_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export { API_URL, SERVER_URL };
export default api;
