"use client";

import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaEdit,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaCheckCircle,
  FaUserCircle,
  FaShieldAlt,
  FaBan,
  FaClock,
} from "react-icons/fa";
import axios from "axios";
import { API_URL } from "../../services/api";

// Cấu hình nhãn và style vai trò (Enterprise Corporate Badges)
const ACCOUNT_TYPES = [
  {
    value: "admin",
    label: "Admin",
    badgeStyle: "bg-purple-50 text-purple-700 border-purple-200",
    icon: FaShieldAlt,
  },
  {
    value: "thường",
    label: "Thường",
    badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
    icon: FaUserCircle,
  },
  {
    value: "chủ đầu tư",
    label: "Chủ đầu tư",
    badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: FaUsers,
  },
  {
    value: "môi giới",
    label: "Môi giới",
    badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
    icon: FaUsers,
  },
];

// Cấu hình trạng thái tài khoản (Chỉ gồm Mở và Khóa)
const STATUS_TYPES = [
  {
    value: "hoạt động",
    label: "Mở",
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
    icon: FaCheckCircle,
  },
  {
    value: "khóa",
    label: "Khóa",
    badgeStyle: "bg-rose-50 text-rose-700 border-rose-200",
    dotColor: "bg-rose-500",
    icon: FaBan,
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
    } catch (err) {
      console.error("Lỗi khi lấy danh sách tài khoản:", err);
      if (err.response?.status === 403) {
        setError("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản admin.");
      } else {
        setError("Không thể tải danh sách tài khoản. Vui lòng thử lại sau.");
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

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật người dùng:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.");
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
    if (value === "khóa") return STATUS_TYPES[1];
    return STATUS_TYPES[0]; // Mặc định là "Mở"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Đang tải danh sách tài khoản...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toast thông báo lưu thành công */}
      {saveSuccess && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-lg shadow-lg text-xs font-semibold animate-fadeIn">
          <FaCheckCircle className="text-base" />
          <span>Cập nhật thông tin tài khoản thành công!</span>
        </div>
      )}

      {/* 1. Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Quản lý tài khoản
          </h2>
          <p className="text-xs text-slate-500">
            Tổng số: <span className="font-semibold text-slate-800">{pagination.total}</span> tài khoản trên hệ thống
          </p>
        </div>

        {/* Thanh tìm kiếm chuẩn SEO / Enterprise */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <FaSearch className="absolute text-slate-400 left-3 top-1/2 -translate-y-1/2 text-xs" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs flex-shrink-0"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* 2. Thống kê trạng thái tài khoản (Subtle Summary Badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
            <FaUsers className="text-sm" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tất cả tài khoản
            </span>
            <p className="text-lg font-bold text-slate-900 leading-tight">
              {pagination.total || users.length}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <FaCheckCircle className="text-sm" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tài khoản Mở
            </span>
            <p className="text-lg font-bold text-slate-900 leading-tight">
              {users.filter((u) => u.TrangThai === "hoạt động" || u.TrangThai !== "khóa").length}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 flex-shrink-0">
            <FaBan className="text-sm" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tài khoản Khóa
            </span>
            <p className="text-lg font-bold text-slate-900 leading-tight">
              {users.filter((u) => u.TrangThai === "khóa").length}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Doanh Nghiệp (Data Table) */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Thông tin liên hệ</th>
                <th className="px-4 py-3">Loại tài khoản</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-center">Bài đăng</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isEditing = editingUser && editingUser.MaNgDung === user.MaNgDung;
                const roleInfo = getRoleInfo(isEditing ? editingUser.LoaiTaiKhoan : user.LoaiTaiKhoan);
                const statusInfo = getStatusInfo(isEditing ? editingUser.TrangThai : user.TrangThai);

                return (
                  <tr
                    key={user.MaNgDung}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-500">
                      #{user.MaNgDung}
                    </td>

                    {/* Avatar & Tên */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.AnhDaiDien || "/placeholder.svg?height=32&width=32"}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full border border-slate-200 object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://ui-avatars.com/api/?name=User&background=64748b&color=fff";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {user.HoTen || "Chưa đặt tên"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Liên hệ */}
                    <td className="px-4 py-3">
                      <p className="text-slate-800 font-medium truncate">{user.Email}</p>
                      <p className="text-slate-500 text-[11px] font-mono">{user.SDT || "Chưa có SĐT"}</p>
                    </td>

                    {/* Loại tài khoản */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={editingUser.LoaiTaiKhoan}
                          onChange={handleRoleChange}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          {ACCOUNT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${roleInfo.badgeStyle}`}
                        >
                          <roleInfo.icon className="text-[9px]" />
                          <span>{roleInfo.label}</span>
                        </span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={editingUser.TrangThai}
                          onChange={handleStatusChange}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          {STATUS_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold ${statusInfo.badgeStyle}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`}></span>
                          <span>{statusInfo.label}</span>
                        </span>
                      )}
                    </td>

                    {/* Số bài đăng */}
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {user.SoBaiDang || 0}
                    </td>

                    {/* Ngày tạo */}
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(user.NgayTao).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={handleSave}
                            className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-2xs"
                            title="Lưu thay đổi"
                          >
                            <FaCheck className="text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            title="Hủy bỏ"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                          title="Sửa quyền hoặc trạng thái"
                        >
                          <FaEdit className="text-[10px]" />
                          <span>Sửa</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Phân trang Pagination chuẩn mực */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs">
          <span className="text-slate-500">
            Hiển thị trang <b className="text-slate-800">{pagination.page}</b> /{" "}
            <b>{pagination.totalPages || 1}</b>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-200"
              title="Trang trước"
            >
              <FaChevronLeft className="text-[10px]" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Trang {pagination.page}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-slate-200"
              title="Trang tiếp"
            >
              <FaChevronRight className="text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
