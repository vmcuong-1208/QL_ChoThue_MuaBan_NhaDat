"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { FaUpload, FaTrash, FaArrowLeft, FaInfoCircle } from "react-icons/fa"
import "../styles/PostForm.css"
import locationService from "../services/locationService"
import CoordinateInput from "./CoordinateInput"
import GoogleMapComponent from "./GoogleMapComponent"
import GPSLocationPicker from "./GPSLocationPicker"

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
    MaLoaiND: "",
    MaTinh: "",
    MaHuyen: "",
    MaXa: "",
    TrangThai: "đang bán",
    ToaDoVN2000: null,
    GPS_Lat: "",
    GPS_Lng: "",
    VideoThuaDat: "",
    HinhAnh: [],
    HinhAnhGiayTo: [],
  })

  const [imageFiles, setImageFiles] = useState([])
  const [imagePreview, setImagePreview] = useState([])
  const [documentImageFiles, setDocumentImageFiles] = useState([])
  const [documentImagePreview, setDocumentImagePreview] = useState([])
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // State cho danh sách loại nhà đất và địa điểm
  const [propertyTypes, setPropertyTypes] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [loadingLocations, setLoadingLocations] = useState(false)

  const [selectedProvinceName, setSelectedProvinceName] = useState(null)

  // Thêm state để hiển thị hướng dẫn
  const [showMapGuide, setShowMapGuide] = useState(false)

  // Lấy danh sách loại nhà đất từ API
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/property-types`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setPropertyTypes(response.data)

        // Nếu không phải đang chỉnh sửa, thiết lập loại nhà đất mặc định
        if (!isEditing && response.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            MaLoaiND: response.data[0].MaLoai,
          }))
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại nhà đất:", error)
      }
    }

    fetchPropertyTypes()
  }, [isEditing])

  // Lấy danh sách tỉnh/thành phố
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingLocations(true)
        const data = await locationService.getProvinces()
        setProvinces(data)
        setLoadingLocations(false)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error)
        setLoadingLocations(false)
      }
    }

    fetchProvinces()
  }, [])

  // Lấy danh sách quận/huyện khi chọn tỉnh/thành phố
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.MaTinh) {
        setDistricts([])
        return
      }

      try {
        setLoadingLocations(true)
        const data = await locationService.getDistricts(formData.MaTinh)
        setDistricts(data)
        setLoadingLocations(false)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách quận/huyện:", error)
        setLoadingLocations(false)
      }
    }

    fetchDistricts()
  }, [formData.MaTinh])

  // Lấy danh sách phường/xã khi chọn quận/huyện
  useEffect(() => {
    const fetchWards = async () => {
      if (!formData.MaHuyen) {
        setWards([])
        return
      }

      try {
        setLoadingLocations(true)
        const data = await locationService.getWards(formData.MaHuyen)
        setWards(data)
        setLoadingLocations(false)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách phường/xã:", error)
        setLoadingLocations(false)
      }
    }

    fetchWards()
  }, [formData.MaHuyen])

  // Lấy dữ liệu bài đăng nếu đang chỉnh sửa
  // Trong useEffect khi lấy dữ liệu bài đăng để chỉnh sửa
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
            MaLoaiND: property.MaLoaiND || "",
            MaTinh: property.MaTinh || "",
            MaHuyen: property.MaHuyen || "",
            MaXa: property.MaXa || "",
            TrangThai: property.TrangThai || "đang bán",
            ToaDoVN2000: property.ToaDoVN2000 ? JSON.parse(property.ToaDoVN2000) : null,
            GPS_Lat: property.GPS_Lat || "",
            GPS_Lng: property.GPS_Lng || "",
            VideoThuaDat: property.VideoThuaDat || "",
            HinhAnh: property.HinhAnh || [],
            HinhAnhGiayTo: property.HinhAnhGiayTo || [],
          })

          // Hiển thị preview ảnh đã có
          if (property.HinhAnh && property.HinhAnh.length > 0) {
            setImagePreview(property.HinhAnh)
          }
          if (property.HinhAnhGiayTo && property.HinhAnhGiayTo.length > 0) {
            setDocumentImagePreview(property.HinhAnhGiayTo)
          }
          if (property.VideoThuaDat) {
            setVideoPreview(property.VideoThuaDat)
          }

          // Set selected province name for CoordinateInput
          if (property.MaTinh) {
            const province = provinces.find((p) => p.MaTinh === property.MaTinh)
            setSelectedProvinceName(province?.TenTinh || null)
          }
        } catch (error) {
          console.error("Lỗi khi lấy dữ liệu bài đăng:", error)
          setError("Không thể tải dữ liệu bài đăng. Vui lòng thử lại sau.")
        }
      }

      fetchPropertyData()
    }
  }, [id, isEditing, provinces]) // Added provinces to dependency array

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target

    // Xử lý đặc biệt cho trường số
    if (name === "Gia" || name === "DienTich" || name === "GPS_Lat" || name === "GPS_Lng") {
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

    // Reset các trường phụ thuộc khi thay đổi tỉnh/quận
    if (name === "MaTinh") {
      setFormData((prev) => ({
        ...prev,
        MaHuyen: "",
        MaXa: "",
        [name]: value,
      }))
      const province = provinces.find((p) => p.MaTinh === Number(value))
      setSelectedProvinceName(province?.TenTinh || null)
      console.log("[v0] Selected Province:", province) // Debug log
    } else if (name === "MaHuyen") {
      setFormData((prev) => ({
        ...prev,
        MaXa: "",
        [name]: value,
      }))
    }
  }

  const handleCoordinateChange = (coordinateData) => {
    setFormData({
      ...formData,
      ToaDoVN2000: coordinateData,
      // Tự động cập nhật diện tích nếu có
      DienTich: coordinateData.area ? coordinateData.area.toFixed(2) : formData.DienTich,
    })
  }

  // Xử lý upload ảnh BĐS
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setImageFiles([...imageFiles, ...files])

    // Tạo preview cho ảnh mới
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setImagePreview([...imagePreview, ...newPreviews])
  }

  const handleDocumentImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setDocumentImageFiles([...documentImageFiles, ...files])

    // Tạo preview cho ảnh mới
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setDocumentImagePreview([...documentImagePreview, ...newPreviews])
  }

  const handleVideoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Kiểm tra kích thước file (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("Video không được vượt quá 50MB")
        return
      }
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  // Xử lý xóa ảnh BĐS
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

  const handleRemoveDocumentImage = (index) => {
    const newDocumentImageFiles = [...documentImageFiles]
    const newDocumentImagePreview = [...documentImagePreview]

    if (index >= documentImageFiles.length) {
      const serverImageIndex = index - documentImageFiles.length
      const newHinhAnhGiayTo = formData.HinhAnhGiayTo.filter((_, i) => i !== serverImageIndex)
      setFormData({
        ...formData,
        HinhAnhGiayTo: newHinhAnhGiayTo,
      })
      newDocumentImagePreview.splice(index, 1)
    } else {
      newDocumentImageFiles.splice(index, 1)
      newDocumentImagePreview.splice(index, 1)
    }

    setDocumentImageFiles(newDocumentImageFiles)
    setDocumentImagePreview(newDocumentImagePreview)
  }

  const handleRemoveVideo = () => {
    setVideoFile(null)
    setVideoPreview(null)
    setFormData({
      ...formData,
      VideoThuaDat: "",
    })
  }

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check post limit for regular users
      const currentUser = JSON.parse(localStorage.getItem("user"))
      if (currentUser?.LoaiTaiKhoan?.toLowerCase() === "thường" && !isEditing) {
        try {
          const token = localStorage.getItem("token")
          const response = await axios.get(`${API_URL}/properties/user`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (response.data.length >= 1) {
            setError("Tài khoản thường chỉ được đăng tối đa 1 tin. Vui lòng nâng cấp tài khoản để đăng thêm tin.")
            setLoading(false)
            return
          }
        } catch (error) {
          console.error("Error checking post limit:", error)
        }
      }

      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/auth")
        return
      }

      // Tạo FormData để gửi cả file ảnh và video
      const postData = new FormData()

      // Thêm các trường dữ liệu
      Object.keys(formData).forEach((key) => {
        if (key !== "HinhAnh" && key !== "HinhAnhGiayTo" && key !== "ToaDoVN2000") {
          postData.append(key, formData[key])
        }
      })

      if (formData.ToaDoVN2000) {
        postData.append("ToaDoVN2000", JSON.stringify(formData.ToaDoVN2000))
      }

      // Thêm ảnh đã có (nếu đang chỉnh sửa)
      if (formData.HinhAnh && formData.HinhAnh.length > 0) {
        postData.append("HinhAnhCu", JSON.stringify(formData.HinhAnh))
      }
      if (formData.HinhAnhGiayTo && formData.HinhAnhGiayTo.length > 0) {
        postData.append("HinhAnhGiaytoCu", JSON.stringify(formData.HinhAnhGiayTo))
      }

      // Thêm các file ảnh BĐS mới
      imageFiles.forEach((file) => {
        postData.append("HinhAnh", file)
      })

      documentImageFiles.forEach((file) => {
        postData.append("HinhAnhGiayTo", file)
      })

      if (videoFile) {
        postData.append("VideoThuaDat", videoFile)
      }

      let response
      if (isEditing) {
        // Cập nhật bài đăng
        await axios.put(`${API_URL}/properties/${id}`, postData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
      } else {
        // Tạo bài đăng mới
        await axios.post(`${API_URL}/properties`, postData, {
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

  // Danh sách trạng thái
  const statuses = ["đang bán", "cho thuê", "đã bán", "đã cho thuê"]

  const handleGPSLocationChange = (location) => {
    setFormData({
      ...formData,
      GPS_Lat: location.lat,
      GPS_Lng: location.lng,
    })
  }

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
              <label htmlFor="MaLoaiND">
                Loại bất động sản <span className="required">*</span>
              </label>
              <select id="MaLoaiND" name="MaLoaiND" value={formData.MaLoaiND} onChange={handleChange} required>
                <option value="">Chọn loại bất động sản</option>
                {propertyTypes.map((type) => (
                  <option key={type.MaLoai} value={type.MaLoai}>
                    {type.TenLoai}
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
                    {status.charAt(0).toUpperCase() + status.slice(1)}
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
              <div className="form-hint">Diện tích sẽ tự động tính từ tọa độ VN2000 nếu bạn nhập đầy đủ</div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Địa chỉ</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="MaTinh">
                Tỉnh/Thành phố <span className="required">*</span>
              </label>
              <select
                id="MaTinh"
                name="MaTinh"
                value={formData.MaTinh}
                onChange={handleChange}
                required
                disabled={loadingLocations}
              >
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinces.map((province) => (
                  <option key={province.MaTinh} value={province.MaTinh}>
                    {province.TenTinh}
                  </option>
                ))}
              </select>
              {loadingLocations && formData.MaTinh && !formData.MaHuyen && (
                <div className="loading-indicator">Đang tải quận/huyện...</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="MaHuyen">
                Quận/Huyện <span className="required">*</span>
              </label>
              <select
                id="MaHuyen"
                name="MaHuyen"
                value={formData.MaHuyen}
                onChange={handleChange}
                required
                disabled={!formData.MaTinh || loadingLocations}
              >
                <option value="">Chọn Quận/Huyện</option>
                {districts.map((district) => (
                  <option key={district.MaHuyen} value={district.MaHuyen}>
                    {district.TenHuyen}
                  </option>
                ))}
              </select>
              {loadingLocations && formData.MaHuyen && !formData.MaXa && (
                <div className="loading-indicator">Đang tải phường/xã...</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="MaXa">
                Phường/Xã <span className="required">*</span>
              </label>
              <select
                id="MaXa"
                name="MaXa"
                value={formData.MaXa}
                onChange={handleChange}
                required
                disabled={!formData.MaHuyen || loadingLocations}
              >
                <option value="">Chọn Phường/Xã</option>
                {wards.map((ward) => (
                  <option key={ward.MaXa} value={ward.MaXa}>
                    {ward.TenXa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="DiaChi">
              Địa chỉ chi tiết <span className="required">*</span>
            </label>
            <input
              type="text"
              id="DiaChi"
              name="DiaChi"
              value={formData.DiaChi}
              onChange={handleChange}
              placeholder="Số nhà, tên đường, khu vực..."
              required
            />
          </div>

          <GPSLocationPicker
            onLocationChange={handleGPSLocationChange}
            initialLat={formData.GPS_Lat}
            initialLng={formData.GPS_Lng}
          />
        </div>

        <div className="form-section">
          <h2>Tọa độ VN2000 (Khung viền thửa đất)</h2>
          <div className="section-description">
            <FaInfoCircle /> Nhập tọa độ các điểm góc từ giấy tờ pháp lý (sổ đỏ, trích đo địa chính, phiếu xác nhận đo
            đạc hiện trạng thửa đất, v.v.)
          </div>

          <CoordinateInput
            value={formData.ToaDoVN2000?.coordinates || []}
            onChange={handleCoordinateChange}
            provinceName={selectedProvinceName}
          />

          {/* Xem trước bản đồ nếu đã có tọa độ */}
          {formData.ToaDoVN2000?.wgs84Coordinates && formData.ToaDoVN2000.wgs84Coordinates.length >= 3 && (
            <div className="map-preview-section">
              <h4>Xem trước khung viền thửa đất:</h4>
              <GoogleMapComponent
                center={formData.ToaDoVN2000.wgs84Coordinates[0]}
                zoom={18}
                propertyBoundary={formData.ToaDoVN2000.wgs84Coordinates}
                propertyArea={formData.ToaDoVN2000.area}
                height="400px"
                showControls={true}
              />
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Hình ảnh giấy tờ pháp lý</h2>
          <p className="image-hint">
            Tải lên ảnh chụp các giấy tờ: Sổ đỏ, Trích đo địa chính, Phiếu xác nhận đo đạc, v.v. (Tối đa 10 ảnh, định
            dạng JPG, PNG, tối đa 5MB/ảnh)
          </p>

          <div className="image-upload-container">
            <label htmlFor="document-image-upload" className="image-upload-label">
              <FaUpload /> Chọn ảnh giấy tờ
              <input
                type="file"
                id="document-image-upload"
                accept="image/*"
                multiple
                onChange={handleDocumentImageUpload}
                style={{ display: "none" }}
                disabled={documentImagePreview.length >= 10}
              />
            </label>

            <div className="image-preview-container">
              {documentImagePreview.length > 0 ? (
                documentImagePreview.map((src, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={src || "/placeholder.svg"} alt={`Giấy tờ ${index + 1}`} />
                    <button type="button" className="remove-image" onClick={() => handleRemoveDocumentImage(index)}>
                      <FaTrash />
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-images">Chưa có hình ảnh giấy tờ nào được chọn</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Hình ảnh & Video bất động sản</h2>
          <p className="image-hint">
            Tải lên ảnh chụp thực tế nhà/đất (Tối đa 10 hình ảnh, định dạng JPG, PNG, tối đa 5MB/ảnh)
          </p>

          <div className="image-upload-container">
            <label htmlFor="image-upload" className="image-upload-label">
              <FaUpload /> Chọn ảnh BĐS
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

          <div className="video-upload-section">
            <h3>Video thửa đất (tùy chọn)</h3>
            <p className="video-hint">Tải lên video quay thực tế thửa đất (Tối đa 50MB, định dạng MP4, MOV, AVI)</p>

            {!videoPreview ? (
              <label htmlFor="video-upload" className="video-upload-label">
                <FaUpload /> Chọn video
                <input
                  type="file"
                  id="video-upload"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  style={{ display: "none" }}
                />
              </label>
            ) : (
              <div className="video-preview-container">
                <video controls width="100%" height="300">
                  <source src={videoPreview} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
                <button type="button" className="remove-video" onClick={handleRemoveVideo}>
                  <FaTrash /> Xóa video
                </button>
              </div>
            )}
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
