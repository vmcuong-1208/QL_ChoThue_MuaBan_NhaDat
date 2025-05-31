"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { FaTimes, FaUpload } from "react-icons/fa"
import "../styles/VerificationModal.css"

const API_URL = "http://localhost:5000/api"

const VerificationModal = ({ propertyId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    camKetCapNhatDinhKy: false,
    ghiChuNguoiBan: "",
  })

  const [files, setFiles] = useState({
    fileSoDo: [],
    videoXacThuc: null,
    fileGiayXacNhan: [],
    fileQuyHoach: [],
  })

  const [loading, setLoading] = useState(false)
  const [existingData, setExistingData] = useState(null)

  // Lấy thông tin xác thực hiện tại (nếu có)
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/verification/${propertyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data.thongTinXacThuc) {
          const data = response.data.thongTinXacThuc
          setFormData({
            camKetCapNhatDinhKy: data.CamKetCapNhatDinhKy,
            ghiChuNguoiBan: data.GhiChuNguoiBan || "",
          })
          setExistingData(data)
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin xác thực:", error)
      }
    }

    fetchExistingData()
  }, [propertyId])

  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target

    if (name === "fileSoDo" || name === "fileGiayXacNhan" || name === "fileQuyHoach") {
      setFiles((prev) => ({
        ...prev,
        [name]: Array.from(selectedFiles),
      }))
    } else if (name === "videoXacThuc") {
      setFiles((prev) => ({
        ...prev,
        videoXacThuc: selectedFiles[0],
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const submitData = new FormData()

      // Thêm dữ liệu form
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key])
      })

      // Thêm files
      files.fileSoDo.forEach((file) => {
        submitData.append("fileSoDo", file)
      })

      files.fileGiayXacNhan.forEach((file) => {
        submitData.append("fileGiayXacNhan", file)
      })

      files.fileQuyHoach.forEach((file) => {
        submitData.append("fileQuyHoach", file)
      })

      if (files.videoXacThuc) {
        submitData.append("videoXacThuc", files.videoXacThuc)
      }

      await axios.post(`${API_URL}/verification/${propertyId}`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      alert("Gửi yêu cầu xác thực thành công!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu xác thực:", error)
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="verification-modal-overlay">
      <div className="verification-modal">
        <div className="verification-modal-header">
          <h2>Xác thực bất động sản</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="verification-section">
            <h3>Tài liệu cần thiết</h3>
            <p className="section-description">
              Vui lòng cung cấp đầy đủ tài liệu để xác thực tính chính xác của bất động sản
            </p>

            <div className="file-upload-group">
              <label className="file-upload-label">
                <FaUpload /> Bản chụp sổ đỏ/sổ hồng <span className="required">*</span>
                <input
                  type="file"
                  name="fileSoDo"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  required
                />
              </label>
              <small className="file-hint">Tải lên tối đa 5 file ảnh</small>
              {files.fileSoDo.length > 0 && (
                <div className="file-list">
                  {files.fileSoDo.map((file, index) => (
                    <span key={index} className="file-item">
                      {file.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="file-upload-group">
              <label className="file-upload-label">
                <FaUpload /> Video xác thực bất động sản <span className="required">*</span>
                <input
                  type="file"
                  name="videoXacThuc"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="file-input"
                  required
                />
              </label>
              <small className="file-hint">
                Video quay toàn bộ bất động sản cùng giọng đọc mô tả, ảnh GPS, quay mặt tiền, đường đi
              </small>
              {files.videoXacThuc && (
                <div className="file-list">
                  <span className="file-item">{files.videoXacThuc.name}</span>
                </div>
              )}
            </div>

            <div className="file-upload-group">
              <label className="file-upload-label">
                <FaUpload /> Giấy xác nhận không tranh chấp (nếu có) hoặc cam kết từ người sở hữu
                <input
                  type="file"
                  name="fileGiayXacNhan"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </label>
              <small className="file-hint">Tải lên tối đa 3 file (ảnh hoặc PDF)</small>
              {files.fileGiayXacNhan.length > 0 && (
                <div className="file-list">
                  {files.fileGiayXacNhan.map((file, index) => (
                    <span key={index} className="file-item">
                      {file.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="file-upload-group">
              <label className="file-upload-label">
                <FaUpload /> Trích lục thông tin quy hoạch từ địa phương / kiểm tra qua bản đồ quy hoạch
                <input
                  type="file"
                  name="fileQuyHoach"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </label>
              <small className="file-hint">Tải lên tối đa 3 file (ảnh hoặc PDF)</small>
              {files.fileQuyHoach.length > 0 && (
                <div className="file-list">
                  {files.fileQuyHoach.map((file, index) => (
                    <span key={index} className="file-item">
                      {file.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="verification-section">
            <h3>Cam kết</h3>

            <label className="checkbox-item">
              <input
                type="checkbox"
                name="camKetCapNhatDinhKy"
                checked={formData.camKetCapNhatDinhKy}
                onChange={handleInputChange}
                required
              />
              <span className="checkmark"></span>
              Cam kết từ người đăng + cập nhật trạng thái định kỳ <span className="required">*</span>
            </label>
          </div>

          <div className="verification-section">
            <h3>Ghi chú</h3>
            <textarea
              name="ghiChuNguoiBan"
              value={formData.ghiChuNguoiBan}
              onChange={handleInputChange}
              placeholder="Thêm ghi chú hoặc thông tin bổ sung..."
              className="note-textarea"
              rows="4"
            />
          </div>

          {existingData && (
            <div className="existing-status">
              <p>
                <strong>Trạng thái hiện tại:</strong> {existingData.TrangThaiXacThuc}
              </p>
              {existingData.GhiChuAdmin && (
                <p>
                  <strong>Ghi chú từ admin:</strong> {existingData.GhiChuAdmin}
                </p>
              )}
            </div>
          )}

          <div className="verification-modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? "Đang gửi..." : "Gửi yêu cầu xác thực"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VerificationModal
