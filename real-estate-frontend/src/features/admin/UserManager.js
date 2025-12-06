"use client";

import { useState, useEffect } from "react";
import {
  FaSearch,
  FaEdit,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaFilter,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserCircle,
  FaShieldAlt,
  FaBan,
  FaClock,
} from "react-icons/fa";
import axios from "axios";
import { API_URL } from "../../services/api";

// Account types
const ACCOUNT_TYPES = [
  { value: "admin", label: "Admin", color: "red", icon: FaShieldAlt },
  { value: "thường", label: "Thường", color: "gray", icon: FaUserCircle },
  { value: "chủ đầu tư", label: "Chủ đầu tư", color: "purple", icon: FaUsers },
  { value: "môi giới", label: "Môi giới", color: "blue", icon: FaUsers },
];

// Status types
const STATUS_TYPES = [
  {
    value: "hoạt động",
    label: "Hoạt động",
    color: "green",
    icon: FaCheckCircle,
  },
  { value: "khóa", label: "Khóa", color: "red", icon: FaBan },
  {
    value: "chờ xác thực",
    label: "Chờ xác thực",
    color: "yellow",
    icon: FaClock,
  },
];

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch users
  const fetchUsers = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: pagination.limit,
          search,
        },
      });

      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      if (error.response?.status === 403) {
        setError(
          "Không có quyền truy cập. Vui lòng đăng nhập với tài khoản admin."
        );
      } else {
        setError("Không thể tải danh sách người dùng. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, searchTerm);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    fetchUsers(newPage, searchTerm);
  };

  const handleRoleChange = (e) => {
    setEditingUser({
      ...editingUser,
      LoaiTaiKhoan: e.target.value,
    });
  };

  const handleStatusChange = (e) => {
    setEditingUser({
      ...editingUser,
      TrangThai: e.target.value,
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        const token = localStorage.getItem("token");

        await axios.put(
          `${API_URL}/admin/users/${editingUser.MaNgDung}`,
          {
            LoaiTaiKhoan: editingUser.LoaiTaiKhoan,
            TrangThai: editingUser.TrangThai,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        fetchUsers(pagination.page, searchTerm);
        setEditingUser(null);

        // Show success toast
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.";
      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
  };

  const getRoleInfo = (value) => {
    return (
      ACCOUNT_TYPES.find((type) => type.value === value) || ACCOUNT_TYPES[1]
    );
  };

  const getStatusInfo = (value) => {
    return STATUS_TYPES.find((type) => type.value === value) || STATUS_TYPES[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-fadeIn">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-semibold text-gray-700">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 animate-fadeIn">
        <div className="flex items-start gap-3 p-6 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg max-w-md">
          <FaExclamationTriangle className="text-2xl text-red-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-red-700 mb-1">
              Có lỗi xảy ra
            </h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 bg-green-500 text-white rounded-lg shadow-2xl animate-slideInRight">
          <FaCheckCircle className="text-2xl" />
          <div>
            <p className="font-bold">Cập nhật thành công!</p>
            <p className="text-sm">Thông tin người dùng đã được lưu</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fadeInUp">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <FaUsers className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Quản lý người dùng
            </h2>
            <p className="text-sm text-gray-500">
              Tổng cộng:{" "}
              <span className="font-bold text-purple-600">
                {pagination.total}
              </span>{" "}
              người dùng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl hover:border-purple-400 hover:scale-105 active:scale-95">
            <FaFilter />
            <span>Bộ lọc</span>
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="animate-fadeInUp" style={{ animationDelay: "100ms" }}>
        <form onSubmit={handleSearch} className="relative">
          <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-32 text-sm font-medium text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none hover:border-purple-400"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg hover:scale-105 active:scale-95"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Stats Cards */}
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-3 animate-fadeInUp"
        style={{ animationDelay: "200ms" }}
      >
        <div className="p-4 bg-white border-2 border-green-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <FaCheckCircle className="text-2xl text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">
                Đang hoạt động
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {users.filter((u) => u.TrangThai === "hoạt động").length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-red-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
              <FaBan className="text-2xl text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">Đã khóa</p>
              <p className="text-2xl font-bold text-gray-800">
                {users.filter((u) => u.TrangThai === "khóa").length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-2 border-yellow-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
              <FaClock className="text-2xl text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">
                Chờ xác thực
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {users.filter((u) => u.TrangThai === "chờ xác thực").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div
        className="overflow-hidden bg-white rounded-2xl shadow-xl animate-fadeInUp"
        style={{ animationDelay: "300ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-gray-200">
                <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-gray-700 uppercase">
                  ID
                </th>
                <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-gray-700 uppercase">
                  Người dùng
                </th>
                <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-gray-700 uppercase">
                  Liên hệ
                </th>
                <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-gray-700 uppercase">
                  Loại TK
                </th>
                <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-gray-700 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase">
                  Bài đăng
                </th>
                <th className="px-4 py-4 text-xs font-bold tracking-wider text-left text-gray-700 uppercase">
                  Ngày tạo
                </th>
                <th className="px-4 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user, index) => {
                const isEditing =
                  editingUser && editingUser.MaNgDung === user.MaNgDung;
                const roleInfo = getRoleInfo(
                  isEditing ? editingUser.LoaiTaiKhoan : user.LoaiTaiKhoan
                );
                const statusInfo = getStatusInfo(
                  isEditing ? editingUser.TrangThai : user.TrangThai
                );
                const RoleIcon = roleInfo.icon;
                const StatusIcon = statusInfo.icon;

                return (
                  <tr
                    key={user.MaNgDung}
                    className="transition-all duration-300 hover:bg-purple-50 animate-fadeInUp"
                    style={{ animationDelay: `${(index + 4) * 50}ms` }}
                  >
                    <td className="px-4 py-4 text-sm font-bold text-gray-800">
                      #{user.MaNgDung}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.AnhDaiDien || "https://via.placeholder.com/40"
                          }
                          alt="Avatar"
                          className="flex-shrink-0 w-10 h-10 border-2 border-gray-200 rounded-full"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {user.HoTen}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 truncate">
                          {user.Email}
                        </p>
                        <p className="text-xs font-semibold text-gray-700">
                          {user.SDT}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <select
                          value={editingUser.LoaiTaiKhoan}
                          onChange={handleRoleChange}
                          className="px-3 py-2 text-xs font-bold transition-all duration-300 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                        >
                          {ACCOUNT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-${roleInfo.color}-700 bg-${roleInfo.color}-100 rounded-full`}
                        >
                          <RoleIcon />
                          <span>{roleInfo.label}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <select
                          value={editingUser.TrangThai}
                          onChange={handleStatusChange}
                          className="px-3 py-2 text-xs font-bold transition-all duration-300 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                        >
                          {STATUS_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-${statusInfo.color}-700 bg-${statusInfo.color}-100 rounded-full`}
                        >
                          <StatusIcon />
                          <span>{statusInfo.label}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full">
                        {user.SoBaiDang}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600">
                      {new Date(user.NgayTao).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSave}
                              className="flex items-center justify-center w-9 h-9 text-green-600 transition-all duration-300 bg-green-100 rounded-lg hover:bg-green-200 hover:scale-110 active:scale-95"
                              title="Lưu"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="flex items-center justify-center w-9 h-9 text-red-600 transition-all duration-300 bg-red-100 rounded-lg hover:bg-red-200 hover:scale-110 active:scale-95"
                              title="Hủy"
                            >
                              <FaTimes />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(user)}
                            className="flex items-center justify-center w-9 h-9 text-blue-600 transition-all duration-300 bg-blue-100 rounded-lg hover:bg-blue-200 hover:scale-110 active:scale-95"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div
          className="flex items-center justify-between px-6 py-4 bg-white rounded-xl shadow-lg animate-fadeInUp"
          style={{ animationDelay: "400ms" }}
        >
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 rounded-lg hover:bg-gray-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <FaChevronLeft />
            <span>Trước</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Trang <span className="text-purple-600">{pagination.page}</span> /{" "}
              {pagination.totalPages}
            </span>
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 rounded-lg hover:bg-gray-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span>Sau</span>
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManager;
