"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaCalendarAlt,
  FaSearch,
} from "react-icons/fa"
import "../styles/VerificationManager.css"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000"

const VerificationManager = () => {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const statusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "chờ xác thực", label: "Chờ xác thực" },
    { value: "đã xác thực", label: "Đã xác thực" },
    { value: "từ chối", label: "Từ chối" },
  ]

  // Lấy danh sách yêu cầu xác thực
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")

        const response = await axios.get(`${API_URL}/verification/admin/list`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            status: statusFilter,
            page: currentPage,
            limit: 10,
          },
        })

        let filteredVerifications = response.data.verifications

        // Lọc theo từ khóa tìm kiếm
        if (searchTerm) {
          filteredVerifications = filteredVerifications.filter(
            (v) =>
              v.TieuDe.toLowerCase().includes(searchTerm.toLowerCase()) ||
              v.DiaChi.toLowerCase().includes(searchTerm.toLowerCase()) ||
              v.TenNguoiBan.toLowerCase().includes(searchTerm.toLowerCase()) ||
              v.EmailNguoiBan.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        }

        setVerifications(filteredVerifications)
        setTotalPages(response.data.pagination.totalPages)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách xác thực:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVerifications()
  }, [statusFilter, currentPage, searchTerm])

  // Xem chi tiết yêu cầu xác thực
  const handleViewDetail = async (propertyId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_URL}/verification/admin/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSelectedVerification(response.data)
      setShowDetailModal(true)
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết xác thực:", error)
      alert("Không thể tải chi tiết xác thực")
    }
  }

  // Cập nhật trạng thái xác thực
  const handleUpdateStatus = async (propertyId, newStatus, adminData) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `${API_URL}/verification/admin/${propertyId}`,
        {
          trangThai: newStatus,
          ...adminData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      alert("Cập nhật trạng thái thành công!")

      // Refresh danh sách
      const response = await axios.get(`${API_URL}/verification/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter,
          page: currentPage,
          limit: 10,
        },
      })
      setVerifications(response.data.verifications)
      setShowDetailModal(false)
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error)
      alert("Có lỗi xảy ra khi cập nhật")
    }
  }

  // Định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có"
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Định dạng giá
  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ"
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu"
    }
    return price.toLocaleString() + " VNĐ"
  }

  // Lấy badge trạng thái
  const getStatusBadge = (status) => {
    switch (status) {
      case "đã xác thực":
        return (
          <span className="status-badge verified">
            <FaCheckCircle /> Đã xác thực
          </span>
        )
      case "chờ xác thực":
        return (
          <span className="status-badge pending">
            <FaClock /> Chờ xác thực
          </span>
        )
      case "từ chối":
        return (
          <span className="status-badge rejected">
            <FaTimesCircle /> Từ chối
          </span>
        )
      default:
        return <span className="status-badge default">Chưa xác thực</span>
    }
  }

  if (loading) {
    return <div className="loading-container">Đang tải danh sách xác thực...</div>
  }

  return (
    <div className="verification-manager">
      {/* Header với tìm kiếm và bộ lọc */}
      <div className="verification-header">
        <div className="search-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, địa chỉ, tên người bán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="verification-filters">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="status-filter"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Danh sách yêu cầu xác thực */}
      <div className="verification-list">
        {verifications.length > 0 ? (
          verifications.map((verification) => (
            <div key={verification.MaTTND} className="verification-card">
              <div className="verification-image">
                <img
                  src={
                    verification.HinhAnh
                      ? `${SERVER_URL}${verification.HinhAnh}`
                      : "/placeholder.svg?height=120&width=200"
                  }
                  alt={verification.TieuDe}
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=120&width=200"
                  }}
                />
              </div>

              <div className="verification-info">
                <h3 className="verification-title">{verification.TieuDe}</h3>

                <div className="verification-details">
                  <div className="detail-item">
                    <FaMapMarkerAlt className="detail-icon" />
                    <span>{verification.DiaChi}</span>
                  </div>

                  <div className="detail-item">
                    <FaUser className="detail-icon" />
                    <span>
                      {verification.TenNguoiBan} ({verification.EmailNguoiBan})
                    </span>
                  </div>

                  <div className="detail-item">
                    <FaCalendarAlt className="detail-icon" />
                    <span>Gửi: {formatDate(verification.NgayGui)}</span>
                  </div>
                </div>

                <div className="verification-price">{formatPrice(verification.Gia)}</div>

                {getStatusBadge(verification.TrangThaiXacThuc)}
              </div>

              <div className="verification-actions">
                <button className="action-button view" onClick={() => handleViewDetail(verification.MaTTND)}>
                  <FaEye /> Chi tiết
                </button>

                {verification.TrangThaiXacThuc === "chờ xác thực" && (
                  <>
                    <button className="action-button approve" onClick={() => handleViewDetail(verification.MaTTND)}>
                      <FaCheckCircle /> Xem để duyệt
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-verifications">
            <p>Không có yêu cầu xác thực nào</p>
          </div>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            &laquo; Trước
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`pagination-number ${currentPage === page ? "active" : ""}`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Sau &raquo;
          </button>
        </div>
      )}

      {/* Modal chi tiết */}
      {showDetailModal && selectedVerification && (
        <VerificationDetailModal
          verification={selectedVerification}
          onClose={() => setShowDetailModal(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  )
}

// Component Modal chi tiết xác thực với checkbox cho admin
const VerificationDetailModal = ({ verification, onClose, onUpdateStatus }) => {
  const [adminNote, setAdminNote] = useState(verification.GhiChuAdmin || "")
  const [selectedStatus, setSelectedStatus] = useState(verification.TrangThaiXacThuc)
  const [adminChecks, setAdminChecks] = useState({
    coSoDoSoHong: verification.CoSoDoSoHong || false,
    daCungCapBanChup: verification.DaCungCapBanChup || false,
    dungDiaChi: verification.DungDiaChi || false,
    bdsTonTaiDungDiaChi: verification.BDSTonTaiDungDiaChi || false,
    dungHinhAnhDacDiem: verification.DungHinhAnhDacDiem || false,
    daDoiChieuVoiSoDo: verification.DaDoiChieuVoiSoDo || false,
    coGiayXacNhanKhongTraanhChap: verification.CoGiayXacNhanKhongTraanhChap || false,
    daKiemTraQuyHoach: verification.DaKiemTraQuyHoach || false,
  })

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setAdminChecks((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = () => {
    onUpdateStatus(verification.MaTTND, selectedStatus, {
      ghiChuAdmin: adminNote,
      ...adminChecks,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="verification-detail-modal">
        <div className="modal-header">
          <h2>Chi tiết yêu cầu xác thực</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="property-info-section">
            <h3>Thông tin bất động sản</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Tiêu đề:</strong> {verification.TieuDe}
              </div>
              <div className="info-item">
                <strong>Địa chỉ:</strong> {verification.DiaChi}
              </div>
              <div className="info-item">
                <strong>Giá:</strong> {verification.Gia?.toLocaleString()} VNĐ
              </div>
              <div className="info-item">
                <strong>Người bán:</strong> {verification.TenNguoiBan}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {verification.EmailNguoiBan}
              </div>
              <div className="info-item">
                <strong>SĐT:</strong> {verification.SDTNguoiBan}
              </div>
            </div>
          </div>

          <div className="verification-info-section">
            <h3>Tài liệu đã gửi</h3>

            {verification.GhiChuNguoiBan && (
              <div className="note-section">
                <strong>Ghi chú từ người bán:</strong>
                <p>{verification.GhiChuNguoiBan}</p>
              </div>
            )}

            {verification.FileSoDo && (
              <div className="files-section">
                <strong>File sổ đỏ:</strong>
                <div className="file-links">
                  {verification.FileSoDo.split(",").map((file, index) => (
                    <a
                      key={index}
                      href={`${SERVER_URL}${file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      Xem file {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {verification.VideoXacThuc && (
              <div className="files-section">
                <strong>Video xác thực:</strong>
                <a
                  href={`${SERVER_URL}${verification.VideoXacThuc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link"
                >
                  Xem video
                </a>
              </div>
            )}

            {verification.FileGiayXacNhan && (
              <div className="files-section">
                <strong>Giấy xác nhận không tranh chấp:</strong>
                <div className="file-links">
                  {verification.FileGiayXacNhan.split(",").map((file, index) => (
                    <a
                      key={index}
                      href={`${SERVER_URL}${file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      Xem file {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {verification.FileQuyHoach && (
              <div className="files-section">
                <strong>Thông tin quy hoạch:</strong>
                <div className="file-links">
                  {verification.FileQuyHoach.split(",").map((file, index) => (
                    <a
                      key={index}
                      href={`${SERVER_URL}${file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      Xem file {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="user-commitment">
              <strong>Cam kết từ người đăng:</strong>
              <div className={`check-item ${verification.CamKetCapNhatDinhKy ? "checked" : ""}`}>
                {verification.CamKetCapNhatDinhKy ? <FaCheckCircle /> : <FaTimesCircle />}
                Cam kết cập nhật trạng thái định kỳ
              </div>
            </div>
          </div>

          <div className="admin-action-section">
            <h3>Xác thực của admin</h3>

            <div className="admin-checklist">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="coSoDoSoHong"
                  checked={adminChecks.coSoDoSoHong}
                  onChange={handleCheckboxChange}
                />
                Có sổ đỏ/sổ hồng
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="daCungCapBanChup"
                  checked={adminChecks.daCungCapBanChup}
                  onChange={handleCheckboxChange}
                />
                Đã cung cấp bản chụp sổ đỏ/sổ hồng
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="dungDiaChi"
                  checked={adminChecks.dungDiaChi}
                  onChange={handleCheckboxChange}
                />
                Đúng địa chỉ
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="bdsTonTaiDungDiaChi"
                  checked={adminChecks.bdsTonTaiDungDiaChi}
                  onChange={handleCheckboxChange}
                />
                BĐS tồn tại đúng địa chỉ trên tin đăng và sổ đỏ/sổ hồng
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="dungHinhAnhDacDiem"
                  checked={adminChecks.dungHinhAnhDacDiem}
                  onChange={handleCheckboxChange}
                />
                Đúng hình ảnh và đặc điểm
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="daDoiChieuVoiSoDo"
                  checked={adminChecks.daDoiChieuVoiSoDo}
                  onChange={handleCheckboxChange}
                />
                Đã đối chiếu hình ảnh với sổ đỏ và video
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="coGiayXacNhanKhongTraanhChap"
                  checked={adminChecks.coGiayXacNhanKhongTraanhChap}
                  onChange={handleCheckboxChange}
                />
                Có giấy xác nhận không tranh chấp
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="daKiemTraQuyHoach"
                  checked={adminChecks.daKiemTraQuyHoach}
                  onChange={handleCheckboxChange}
                />
                Đã kiểm tra thông tin quy hoạch
              </label>
            </div>

            <div className="status-select">
              <label>Trạng thái:</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="chờ xác thực">Chờ xác thực</option>
                <option value="đã xác thực">Đã xác thực</option>
                <option value="từ chối">Từ chối</option>
              </select>
            </div>

            <div className="admin-note">
              <label>Ghi chú của admin:</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows="4"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Hủy
          </button>
          <button className="submit-button" onClick={handleSubmit}>
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerificationManager
