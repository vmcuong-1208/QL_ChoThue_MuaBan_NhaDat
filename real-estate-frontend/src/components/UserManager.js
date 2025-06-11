"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaEdit, FaCheck, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa"
import axios from "axios"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

// Danh sách cố định các loại tài khoản và trạng thái
const ACCOUNT_TYPES = [
  { value: "admin", label: "Admin" },
  { value: "thường", label: "Thường" },
  { value: "chủ đầu tư", label: "Chủ đầu tư" },
  { value: "môi giới", label: "Môi giới" },
]

const STATUS_TYPES = [
  { value: "hoạt động", label: "Hoạt động" },
  { value: "khóa", label: "Khóa" },
  { value: "chờ xác thực", label: "Chờ xác thực" },
]

const UserManager = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Lấy danh sách người dùng
  const fetchUsers = async (page = 1, search = "") => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")

      console.log("Fetching users with token:", token ? "exists" : "missing")

      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: pagination.limit,
          search,
        },
      })

      setUsers(response.data.users)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error)
      if (error.response?.status === 403) {
        setError("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản admin.")
      } else {
        setError("Không thể tải danh sách người dùng. Vui lòng thử lại sau.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(1, searchTerm)
  }, [])

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers(1, searchTerm)
  }

  // Xử lý thay đổi trang
  const handlePageChange = (newPage) => {
    fetchUsers(newPage, searchTerm)
  }

  // Xử lý thay đổi loại tài khoản
  const handleRoleChange = (e) => {
    setEditingUser({
      ...editingUser,
      LoaiTaiKhoan: e.target.value,
    })
  }

  // Xử lý thay đổi trạng thái
  const handleStatusChange = (e) => {
    setEditingUser({
      ...editingUser,
      TrangThai: e.target.value,
    })
  }

  // Xử lý bắt đầu chỉnh sửa
  const handleEdit = (user) => {
    setEditingUser(user)
  }

  // Xử lý lưu thay đổi
  const handleSave = async () => {
    try {
      if (editingUser) {
        const token = localStorage.getItem("token")

        console.log("Saving user data:", {
          LoaiTaiKhoan: editingUser.LoaiTaiKhoan,
          TrangThai: editingUser.TrangThai,
        })

        await axios.put(
          `${API_URL}/admin/users/${editingUser.MaNgDung}`,
          {
            LoaiTaiKhoan: editingUser.LoaiTaiKhoan,
            TrangThai: editingUser.TrangThai,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        // Refresh danh sách
        fetchUsers(pagination.page, searchTerm)
        setEditingUser(null)
        alert("Cập nhật thành công!")
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error)
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi cập nhật. Vui lòng thử lại."
      alert(errorMessage)
    }
  }

  // Xử lý hủy chỉnh sửa
  const handleCancel = () => {
    setEditingUser(null)
  }

  // Hàm lấy label cho loại tài khoản
  const getRoleLabel = (value) => {
    const role = ACCOUNT_TYPES.find((type) => type.value === value)
    return role ? role.label : value
  }

  // Hàm lấy label cho trạng thái
  const getStatusLabel = (value) => {
    const status = STATUS_TYPES.find((type) => type.value === value)
    return status ? status.label : value
  }

  // Hàm lấy class CSS cho trạng thái
  const getStatusClass = (status) => {
    switch (status) {
      case "hoạt động":
        return "active"
      case "khóa":
        return "inactive"
      case "chờ xác thực":
        return "pending"
      default:
        return "unknown"
    }
  }

  // Hàm lấy class CSS cho role
  const getRoleClass = (role) => {
    switch (role) {
      case "admin":
        return "admin"
      case "môi giới":
        return "agent"
      case "chủ đầu tư":
        return "investor"
      case "thường":
        return "user"
      default:
        return "unknown"
    }
  }

  if (loading) {
    return <div className="admin-loading">Đang tải dữ liệu...</div>
  }

  if (error) {
    return <div className="admin-error">{error}</div>
  }

  return (
    <div className="user-manager">
      {/* Header với thống kê */}
      <div className="user-manager-header">
        <div className="user-stats-summary">
          <span className="total-users">Tổng: {pagination.total} người dùng</span>
        </div>
      </div>

      {/* Thanh tìm kiếm đẹp */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="modern-search-form">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              Tìm kiếm
            </button>
          </div>
        </form>
      </div>

      <div className="user-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Loại tài khoản</th>
              <th>Trạng thái</th>
              <th>Số bài đăng</th>
              <th>Ngày đăng ký</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.MaNgDung}>
                <td>{user.MaNgDung}</td>
                <td>
                  <img
                    src={user.AnhDaiDien || "https://via.placeholder.com/40"}
                    alt="Avatar"
                    className="user-avatar-small"
                  />
                </td>
                <td>{user.HoTen}</td>
                <td>{user.Email}</td>
                <td>{user.SDT}</td>
                <td>
                  {editingUser && editingUser.MaNgDung === user.MaNgDung ? (
                    <select value={editingUser.LoaiTaiKhoan} onChange={handleRoleChange} className="edit-select">
                      {ACCOUNT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`role-badge ${getRoleClass(user.LoaiTaiKhoan)}`}>
                      {getRoleLabel(user.LoaiTaiKhoan)}
                    </span>
                  )}
                </td>
                <td>
                  {editingUser && editingUser.MaNgDung === user.MaNgDung ? (
                    <select value={editingUser.TrangThai} onChange={handleStatusChange} className="edit-select">
                      {STATUS_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`status-badge ${getStatusClass(user.TrangThai)}`}>
                      {getStatusLabel(user.TrangThai)}
                    </span>
                  )}
                </td>
                <td>{user.SoBaiDang}</td>
                <td>{new Date(user.NgayTao).toLocaleDateString("vi-VN")}</td>
                <td>
                  {editingUser && editingUser.MaNgDung === user.MaNgDung ? (
                    <div className="action-buttons">
                      <button className="admin-save-button" onClick={handleSave} title="Lưu">
                        <FaCheck />
                      </button>
                      <button className="admin-cancel-button" onClick={handleCancel} title="Hủy">
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <button className="admin-edit-button" onClick={() => handleEdit(user)} title="Chỉnh sửa">
                      <FaEdit />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-btn"
          >
            <FaChevronLeft /> Trước
          </button>

          <span className="pagination-info">
            Trang {pagination.page} / {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="pagination-btn"
          >
            Sau <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  )
}

export default UserManager
