"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaEdit, FaCheck, FaTimes, FaFilter } from "react-icons/fa"
import userService from "../services/userService"

const UserManager = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [editingUser, setEditingUser] = useState(null)
  const [userStats, setUserStats] = useState({
    total: 0,
    admin: 0,
    agent: 0,
    user: 0,
    newThisMonth: 0,
  })

  // Lấy danh sách người dùng
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const usersData = await userService.getUsers()
        setUsers(usersData)

        // Tính toán thống kê
        const stats = {
          total: usersData.length,
          admin: usersData.filter((user) => user.LoaiTaiKhoan === "Admin").length,
          agent: usersData.filter((user) => user.LoaiTaiKhoan === "Môi giới").length,
          user: usersData.filter((user) => user.LoaiTaiKhoan === "Người dùng").length,
          newThisMonth: 3, // Giả sử có 3 người dùng mới trong tháng này
        }
        setUserStats(stats)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách người dùng:", error)
        setError("Không thể tải danh sách người dùng. Vui lòng thử lại sau.")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Lọc người dùng theo tìm kiếm và vai trò
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.SDT.includes(searchTerm)

    const matchesRole = filterRole === "all" || user.LoaiTaiKhoan === filterRole

    return matchesSearch && matchesRole
  })

  // Xử lý thay đổi loại tài khoản
  const handleRoleChange = (e, userId) => {
    const newRole = e.target.value
    setEditingUser({
      ...editingUser,
      LoaiTaiKhoan: newRole,
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
        await userService.updateUser(editingUser.MaNgDung, {
          LoaiTaiKhoan: editingUser.LoaiTaiKhoan,
        })

        const updatedUsers = users.map((user) =>
          user.MaNgDung === editingUser.MaNgDung ? { ...user, LoaiTaiKhoan: editingUser.LoaiTaiKhoan } : user,
        )

        setUsers(updatedUsers)

        // Cập nhật thống kê
        const stats = {
          total: updatedUsers.length,
          admin: updatedUsers.filter((user) => user.LoaiTaiKhoan === "Admin").length,
          agent: updatedUsers.filter((user) => user.LoaiTaiKhoan === "Môi giới").length,
          user: updatedUsers.filter((user) => user.LoaiTaiKhoan === "Người dùng").length,
          newThisMonth: userStats.newThisMonth,
        }
        setUserStats(stats)

        setEditingUser(null)
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error)
      alert("Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.")
    }
  }

  // Xử lý hủy chỉnh sửa
  const handleCancel = () => {
    setEditingUser(null)
  }

  if (loading) {
    return <div className="admin-loading">Đang tải dữ liệu...</div>
  }

  if (error) {
    return <div className="admin-error">{error}</div>
  }

  return (
    <div className="user-manager">
      <div className="user-stats">
        <div className="stat-card">
          <h3>Tổng số người dùng</h3>
          <p className="stat-value">{userStats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Admin</h3>
          <p className="stat-value">{userStats.admin}</p>
        </div>
        <div className="stat-card">
          <h3>Môi giới</h3>
          <p className="stat-value">{userStats.agent}</p>
        </div>
        <div className="stat-card">
          <h3>Người dùng thường</h3>
          <p className="stat-value">{userStats.user}</p>
        </div>
        <div className="stat-card">
          <h3>Mới trong tháng</h3>
          <p className="stat-value">{userStats.newThisMonth}</p>
        </div>
      </div>

      <div className="user-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="role-filter">
          <FaFilter />
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Môi giới">Môi giới</option>
            <option value="Người dùng">Người dùng</option>
          </select>
        </div>
      </div>

      <div className="user-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Loại tài khoản</th>
              <th>Ngày đăng ký</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.MaNgDung}>
                <td>{user.MaNgDung}</td>
                <td>{user.HoTen}</td>
                <td>{user.Email}</td>
                <td>{user.SDT}</td>
                <td>
                  {editingUser && editingUser.MaNgDung === user.MaNgDung ? (
                    <select value={editingUser.LoaiTaiKhoan} onChange={(e) => handleRoleChange(e, user.MaNgDung)}>
                      <option value="Admin">Admin</option>
                      <option value="Môi giới">Môi giới</option>
                      <option value="Người dùng">Người dùng</option>
                    </select>
                  ) : (
                    <span className={`role-badge ${user.LoaiTaiKhoan.toLowerCase()}`}>{user.LoaiTaiKhoan}</span>
                  )}
                </td>
                <td>{user.NgayDangKy}</td>
                <td>
                  <span className={`status-badge ${user.TrangThai === "Hoạt động" ? "active" : "inactive"}`}>
                    {user.TrangThai}
                  </span>
                </td>
                <td>
                  {editingUser && editingUser.MaNgDung === user.MaNgDung ? (
                    <div className="action-buttons">
                      <button className="admin-save-button" onClick={handleSave}>
                        <FaCheck />
                      </button>
                      <button className="admin-cancel-button" onClick={handleCancel}>
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <button className="admin-edit-button" onClick={() => handleEdit(user)}>
                      <FaEdit />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserManager
