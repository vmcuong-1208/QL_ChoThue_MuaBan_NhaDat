"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { FaRegHeart, FaEye, FaMapMarkerAlt, FaRulerCombined, FaTrash, FaEdit, FaStickyNote } from "react-icons/fa"
import { useAuth } from "../context/AuthContext"
import locationService from "../services/locationService"
import "../styles/Favorites.css"

const API_URL = "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000"

const Favorites = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [locationNames, setLocationNames] = useState({})
  const [editingNote, setEditingNote] = useState(null)
  const [noteText, setNoteText] = useState("")
  const favoritesPerPage = 12

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!currentUser) {
      navigate("/auth")
    }
  }, [currentUser, navigate])

  // Lấy danh sách yêu thích
  const fetchFavorites = async (page = 1) => {
    if (!currentUser) return

    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const response = await axios.get(`${API_URL}/favorites?page=${page}&limit=${favoritesPerPage}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Favorites response:", response.data)

      setFavorites(response.data.favorites)
      setTotalPages(response.data.pagination.totalPages)
      setCurrentPage(response.data.pagination.page)

      // Lấy thông tin địa điểm
      await fetchLocationNames(response.data.favorites)

      setLoading(false)
    } catch (error) {
      console.error("Lỗi khi lấy danh sách yêu thích:", error)
      setError("Không thể tải danh sách yêu thích. Vui lòng thử lại sau.")
      setLoading(false)
    }
  }

  // Lấy thông tin địa điểm
  const fetchLocationNames = async (favoritesList) => {
    try {
      const locationNamesObj = {}
      const provinces = await locationService.getProvinces()

      for (const favorite of favoritesList) {
        if (favorite.MaTinh) {
          const province = provinces.find((p) => p.MaTinh === Number.parseInt(favorite.MaTinh))
          if (province) {
            locationNamesObj[`province_${favorite.MaTinh}`] = province.TenTinh

            if (favorite.MaHuyen) {
              try {
                const districts = await locationService.getDistricts(favorite.MaTinh)
                const district = districts.find((d) => d.MaHuyen === Number.parseInt(favorite.MaHuyen))
                if (district) {
                  locationNamesObj[`district_${favorite.MaHuyen}`] = district.TenHuyen

                  if (favorite.MaXa) {
                    try {
                      const wards = await locationService.getWards(favorite.MaHuyen)
                      const ward = wards.find((w) => w.MaXa === Number.parseInt(favorite.MaXa))
                      if (ward) {
                        locationNamesObj[`ward_${favorite.MaXa}`] = ward.TenXa
                      }
                    } catch (error) {
                      console.error("Lỗi khi lấy thông tin phường/xã:", error)
                    }
                  }
                }
              } catch (error) {
                console.error("Lỗi khi lấy thông tin quận/huyện:", error)
              }
            }
          }
        }
      }

      setLocationNames(locationNamesObj)
    } catch (error) {
      console.error("Lỗi khi lấy thông tin địa điểm:", error)
    }
  }

  useEffect(() => {
    fetchFavorites(currentPage)
  }, [currentUser, currentPage])

  // Xóa khỏi yêu thích
  const handleRemoveFavorite = async (propertyId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bất động sản này khỏi danh sách yêu thích?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${API_URL}/favorites/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Cập nhật danh sách
      setFavorites(favorites.filter((fav) => fav.MaTTND !== propertyId))

      // Nếu trang hiện tại không còn item nào, chuyển về trang trước
      if (favorites.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        fetchFavorites(currentPage)
      }
    } catch (error) {
      console.error("Lỗi khi xóa khỏi yêu thích:", error)
      alert("Không thể xóa khỏi danh sách yêu thích. Vui lòng thử lại.")
    }
  }

  // Cập nhật ghi chú
  const handleUpdateNote = async (propertyId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `${API_URL}/favorites/${propertyId}`,
        { GhiChu: noteText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Cập nhật state
      setFavorites(favorites.map((fav) => (fav.MaTTND === propertyId ? { ...fav, GhiChu: noteText } : fav)))

      setEditingNote(null)
      setNoteText("")
    } catch (error) {
      console.error("Lỗi khi cập nhật ghi chú:", error)
      alert("Không thể cập nhật ghi chú. Vui lòng thử lại.")
    }
  }

  // Bắt đầu chỉnh sửa ghi chú
  const startEditingNote = (favorite) => {
    setEditingNote(favorite.MaTTND)
    setNoteText(favorite.GhiChu || "")
  }

  // Hủy chỉnh sửa ghi chú
  const cancelEditingNote = () => {
    setEditingNote(null)
    setNoteText("")
  }

  // Xem chi tiết bất động sản
  const handleViewDetails = async (propertyId) => {
    try {
      // Tăng lượt xem
      await axios.post(`${API_URL}/properties/${propertyId}/view`, {
        viewerId: currentUser?.MaNgDung,
      })
      navigate(`/bat-dong-san/${propertyId}`)
    } catch (error) {
      console.error("Lỗi khi tăng lượt xem:", error)
      navigate(`/bat-dong-san/${propertyId}`)
    }
  }

  // Định dạng giá tiền
  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ"
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu"
    }
    return price.toLocaleString() + " VNĐ"
  }

  // Lấy địa chỉ đầy đủ
  const getFullAddress = (property) => {
    const addressParts = []

    if (property.DiaChi) {
      addressParts.push(property.DiaChi)
    }

    if (property.MaXa && locationNames[`ward_${property.MaXa}`]) {
      addressParts.push(locationNames[`ward_${property.MaXa}`])
    }

    if (property.MaHuyen && locationNames[`district_${property.MaHuyen}`]) {
      addressParts.push(locationNames[`district_${property.MaHuyen}`])
    }

    if (property.MaTinh && locationNames[`province_${property.MaTinh}`]) {
      addressParts.push(locationNames[`province_${property.MaTinh}`])
    }

    return addressParts.join(", ")
  }

  // Định dạng ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return <div className="favorites-loading">Đang tải danh sách yêu thích...</div>
  }

  if (error) {
    return (
      <div className="favorites-error">
        <p>{error}</p>
        <button onClick={() => fetchFavorites(currentPage)} className="retry-button">
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h1>Bất động sản yêu thích</h1>
        <p>Bạn đã lưu {favorites.length} bất động sản</p>
      </div>

      {favorites.length === 0 ? (
        <div className="no-favorites">
          <FaRegHeart className="no-favorites-icon" />
          <h3>Chưa có bất động sản yêu thích</h3>
          <p>Hãy khám phá và thêm những bất động sản bạn quan tâm vào danh sách yêu thích</p>
          <button onClick={() => navigate("/")} className="browse-button">
            Khám phá bất động sản
          </button>
        </div>
      ) : (
        <>
          <div className="favorites-list">
            {favorites.map((favorite) => (
              <div key={favorite.MaTTND} className="favorite-card">
                <div className="favorite-image-container">
                  <img
                    src={
                      favorite.HinhAnh && favorite.HinhAnh.length > 0
                        ? `${SERVER_URL}${favorite.HinhAnh[0]}`
                        : "/placeholder.svg?height=200&width=400"
                    }
                    alt={favorite.TieuDe}
                    className="favorite-image"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=200&width=400"
                    }}
                  />
                  <div className="favorite-actions">
                    <button
                      className="remove-favorite-btn"
                      onClick={() => handleRemoveFavorite(favorite.MaTTND)}
                      title="Xóa khỏi yêu thích"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <span className="property-status">{favorite.TrangThai}</span>
                </div>

                <div className="favorite-info">
                  <h3 className="favorite-title">{favorite.TieuDe}</h3>

                  <p className="favorite-address">
                    <FaMapMarkerAlt className="icon" /> {getFullAddress(favorite)}
                  </p>

                  <div className="favorite-details">
                    <div className="favorite-price">{formatPrice(favorite.Gia)}</div>
                    <div className="favorite-area">
                      <FaRulerCombined className="icon" /> {favorite.DienTich} m²
                    </div>
                  </div>

                  <div className="favorite-meta">
                    <span className="property-type">{favorite.LoaiBDS || "Không xác định"}</span>
                    <span className="property-views">
                      <FaEye className="icon" /> {favorite.SoLuotXem || 0}
                    </span>
                  </div>

                  <div className="favorite-date">
                    <small>Đã thêm: {formatDate(favorite.NgayYeuThich)}</small>
                  </div>

                  {/* Ghi chú */}
                  <div className="favorite-note">
                    {editingNote === favorite.MaTTND ? (
                      <div className="note-edit">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Thêm ghi chú..."
                          rows="2"
                        />
                        <div className="note-actions">
                          <button onClick={() => handleUpdateNote(favorite.MaTTND)} className="save-note-btn">
                            Lưu
                          </button>
                          <button onClick={cancelEditingNote} className="cancel-note-btn">
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="note-display">
                        {favorite.GhiChu ? (
                          <p className="note-text">
                            <FaStickyNote className="icon" />
                            {favorite.GhiChu}
                          </p>
                        ) : (
                          <p className="no-note">Chưa có ghi chú</p>
                        )}
                        <button
                          onClick={() => startEditingNote(favorite)}
                          className="edit-note-btn"
                          title="Chỉnh sửa ghi chú"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    )}
                  </div>

                  <button className="view-details-button" onClick={() => handleViewDetails(favorite.MaTTND)}>
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="favorites-pagination">
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
        </>
      )}
    </div>
  )
}

export default Favorites
