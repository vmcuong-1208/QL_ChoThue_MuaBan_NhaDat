"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { FaUpload, FaTrash, FaArrowLeft } from "react-icons/fa"
import "../styles/PostForm.css"

const API_URL = "http://localhost:5000/api"

const PostForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  // State cho form
  const [formData, setFormData] = useState({
    TieuDe: "",
    MoTa: "",
    Gia: "",
    DienTich: "",
    DiaChi: "",
    LoaiBDS: "Nhà phố",
    SoPhongNgu: 1,
    SoPhongTam: 1,
    HuongNha: "",
    TrangThai: "Đang bán",
    HinhAnh: [],
  })

  const [imageFiles, setImageFiles] = useState([])
  const [imagePreview, setImagePreview] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Lấy dữ liệu bài đăng nếu đang chỉnh sửa
  useEffect(() => {
    if (isEditing) {
      const fetchPropertyData = async () => {
        try {
          const token = localStorage.getItem("token")
          const response = await axios.get(`${API_URL}/properties/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          const property = response.data
          setFormData({
            TieuDe: property.TieuDe || "",
            MoTa: property.MoTa || "",
            Gia: property.Gia || "",
            DienTich: property.DienTich || "",
            DiaChi: property.DiaChi || "",
            LoaiBDS: property.LoaiBDS || "Nhà phố",
            SoPhongNgu: property.SoPhongNgu || 1,
            SoPhongTam: property.SoPhongTam || 1,
            HuongNha: property.HuongNha || "",
            TrangThai: property.TrangThai || "Đang bán",
            HinhAnh: property.HinhAnh || [],
          })

          // Hiển thị preview ảnh đã có
          if (property.HinhAnh && property.HinhAnh.length > 0) {
            setImagePreview(property.HinhAnh)
          }
        } catch (error) {
          console.error("Lỗi khi lấy dữ liệu bài đăng:", error)
          setError("Không thể tải dữ liệu bài đăng. Vui lòng thử lại sau.")
        }
      }

      fetchPropertyData()
    }
  }, [id, isEditing])

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target

    // Xử lý đặc biệt cho trường số
    if (name === "Gia" || name === "DienTich" || name === "SoPhongNgu" || name === "SoPhongTam") {
      const numValue = value === "" ? "" : Number(value)
      setFormData({
        ...formData,
        [name]: numValue,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  // Xử lý upload ảnh
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setImageFiles([...imageFiles, ...files])

    // Tạo preview cho ảnh mới
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setImagePreview([...imagePreview, ...newPreviews])
  }

  // Xử lý xóa ảnh
  const handleRemoveImage = (index) => {
    const newImageFiles = [...imageFiles]
    const newImagePreview = [...imagePreview]

    // Nếu là ảnh từ server (không có trong imageFiles)
    if (index >= imageFiles.length) {
      const serverImageIndex = index - imageFiles.length
      const newHinhAnh = formData.HinhAnh.filter((_, i) => i !== serverImageIndex)
      setFormData({
        ...formData,
        HinhAnh: newHinhAnh,
      })
      newImagePreview.splice(index, 1)
    } else {
      // Nếu là ảnh mới upload
      newImageFiles.splice(index, 1)
      newImagePreview.splice(index, 1)
    }

    setImageFiles(newImageFiles)
    setImagePreview(newImagePreview)
  }

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/auth")
        return
      }

      // Tạo FormData để gửi cả file ảnh
      const postData = new FormData()

      // Thêm các trường dữ liệu
      Object.keys(formData).forEach((key) => {
        if (key !== "HinhAnh") {
          postData.append(key, formData[key])
        }
      })

      // Thêm ảnh đã có (nếu đang chỉnh sửa)
      if (formData.HinhAnh && formData.HinhAnh.length > 0) {
        postData.append("HinhAnhCu", JSON.stringify(formData.HinhAnh))
      }

      // Thêm các file ảnh mới
      imageFiles.forEach((file) => {
        postData.append("HinhAnh", file)
      })

      let response
      if (isEditing) {
        // Cập nhật bài đăng
        response = await axios.put(`${API_URL}/properties/${id}`, postData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
      } else {
        // Tạo bài đăng mới
        response = await axios.post(`${API_URL}/properties`, postData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
      }

      setSuccess(true)
      

      // Chuyển hướng sau khi thành công
      setTimeout(() => {
        navigate("/quan-ly-bai-dang")
      }, 2000)
    } catch (error) {
      console.error("Lỗi khi lưu bài đăng:", error)
      setError(error.response?.data?.message || "Có lỗi xảy ra khi lưu bài đăng. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  // Danh sách loại bất động sản
  const propertyTypes = ["Nhà phố", "Biệt thự", "Căn hộ", "Shophouse", "Đất nền", "Văn phòng", "Khác"]

  // Danh sách hướng nhà
  const directions = ["Đông", "Tây", "Nam", "Bắc", "Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam"]

  // Danh sách trạng thái
  const statuses = ["Đang bán", "Đang cho thuê", "Đã bán", "Đã cho thuê", "Tạm ngưng"]

  return (
    <div className="post-form-container">
      <div className="post-form-header">
        <button className="back-button" onClick={() => navigate("/quan-ly-bai-dang")}>
          <FaArrowLeft /> Quay lại
        </button>
        <h1>{isEditing ? "Chỉnh sửa bài đăng" : "Đăng tin mới"}</h1>
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && (
        <div className="form-success">{isEditing ? "Cập nhật bài đăng thành công!" : "Đăng tin thành công!"}</div>
      )}

      <form onSubmit={handleSubmit} className="property-form">
        <div className="form-section">
          <h2>Thông tin cơ bản</h2>

          <div className="form-group">
            <label htmlFor="TieuDe">
              Tiêu đề <span className="required">*</span>
            </label>
            <input
              type="text"
              id="TieuDe"
              name="TieuDe"
              value={formData.TieuDe}
              onChange={handleChange}
              placeholder="Nhập tiêu đề bài đăng"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="MoTa">
              Mô tả <span className="required">*</span>
            </label>
            <textarea
              id="MoTa"
              name="MoTa"
              value={formData.MoTa}
              onChange={handleChange}
              placeholder="Mô tả chi tiết về bất động sản"
              rows="6"
              required
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="LoaiBDS">
                Loại bất động sản <span className="required">*</span>
              </label>
              <select id="LoaiBDS" name="LoaiBDS" value={formData.LoaiBDS} onChange={handleChange} required>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="TrangThai">
                Trạng thái <span className="required">*</span>
              </label>
              <select id="TrangThai" name="TrangThai" value={formData.TrangThai} onChange={handleChange} required>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Thông tin chi tiết</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="Gia">
                Giá (VNĐ) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="Gia"
                name="Gia"
                value={formData.Gia}
                onChange={handleChange}
                placeholder="Nhập giá"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="DienTich">
                Diện tích (m²) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="DienTich"
                name="DienTich"
                value={formData.DienTich}
                onChange={handleChange}
                placeholder="Nhập diện tích"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="SoPhongNgu">Số phòng ngủ</label>
              <input
                type="number"
                id="SoPhongNgu"
                name="SoPhongNgu"
                value={formData.SoPhongNgu}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="SoPhongTam">Số phòng tắm</label>
              <input
                type="number"
                id="SoPhongTam"
                name="SoPhongTam"
                value={formData.SoPhongTam}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="HuongNha">Hướng nhà</label>
              <select id="HuongNha" name="HuongNha" value={formData.HuongNha} onChange={handleChange}>
                <option value="">Chọn hướng</option>
                {directions.map((direction) => (
                  <option key={direction} value={direction}>
                    {direction}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="DiaChi">
              Địa chỉ <span className="required">*</span>
            </label>
            <input
              type="text"
              id="DiaChi"
              name="DiaChi"
              value={formData.DiaChi}
              onChange={handleChange}
              placeholder="Nhập địa chỉ đầy đủ"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Hình ảnh</h2>
          <p className="image-hint">Tối đa 10 hình ảnh, định dạng JPG, PNG (tối đa 5MB/ảnh)</p>

          <div className="image-upload-container">
            <label htmlFor="image-upload" className="image-upload-label">
              <FaUpload /> Chọn ảnh
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: "none" }}
                disabled={imagePreview.length >= 10}
              />
            </label>

            <div className="image-preview-container">
              {imagePreview.length > 0 ? (
                imagePreview.map((src, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={src || "/placeholder.svg"} alt={`Preview ${index + 1}`} />
                    <button type="button" className="remove-image" onClick={() => handleRemoveImage(index)}>
                      <FaTrash />
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-images">Chưa có hình ảnh nào được chọn</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate("/quan-ly-bai-dang")}
            disabled={loading}
          >
            Hủy
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Đang xử lý..." : isEditing ? "Cập nhật" : "Đăng tin"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PostForm
