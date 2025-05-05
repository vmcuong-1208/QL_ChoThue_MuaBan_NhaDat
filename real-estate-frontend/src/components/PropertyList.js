"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { FaHeart, FaRegHeart, FaEye, FaMapMarkerAlt, FaRulerCombined, FaFilter, FaSort } from "react-icons/fa"
import "../styles/PropertyList.css"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import locationService from "../services/locationService"
const API_URL = "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000"
const PropertyList = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [properties, setProperties] = useState([])
  const [favorites, setFavorites] = useState([])
  const [filterType, setFilterType] = useState("Tất cả")
  const [sortOption, setSortOption] = useState("default")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [propertyTypes, setPropertyTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [locationNames, setLocationNames] = useState({})
  const propertiesPerPage = 8
  
  // Lấy danh sách loại nhà đất từ API
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/property-types`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        setPropertyTypes(response.data)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại nhà đất:", error)
      }
    }
  
    fetchPropertyTypes()
  }, [])
  
  // Lấy danh sách bất động sản
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        
        setLoading(true)
        const response = await axios.get(`${API_URL}/properties`)
        console.log("Properties data:", response.data.properties)
        // Lấy thông tin địa điểm cho mỗi bài đăng
        const propertiesWithLocations = [...response.data.properties]
        const locationNamesObj = {}

        // Lấy thông tin tỉnh/thành phố
        const provinces = await locationService.getProvinces()

        for (const property of propertiesWithLocations) {
          if (property.MaTinh) {
            // Tìm tên tỉnh
            const province = provinces.find((p) => p.MaTinh === Number.parseInt(property.MaTinh))
            if (province) {
              locationNamesObj[`province_${property.MaTinh}`] = province.TenTinh

              // Lấy thông tin quận/huyện
              if (property.MaHuyen) {
                try {
                  const districts = await locationService.getDistricts(property.MaTinh)
                  const district = districts.find((d) => d.MaHuyen === Number.parseInt(property.MaHuyen))
                  if (district) {
                    locationNamesObj[`district_${property.MaHuyen}`] = district.TenHuyen

                    // Lấy thông tin phường/xã
                    if (property.MaXa) {
                      try {
                        const wards = await locationService.getWards(property.MaHuyen)
                        const ward = wards.find((w) => w.MaXa === Number.parseInt(property.MaXa))
                        if (ward) {
                          locationNamesObj[`ward_${property.MaXa}`] = ward.TenXa
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
        setProperties(response.data.properties)
      } catch (err) {
        console.error("Lỗi lấy BĐS:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProperties()
  }, [])
  // Lấy danh sách yêu thích từ localStorage khi component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("propertyFavorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  // Lưu danh sách yêu thích vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem("propertyFavorites", JSON.stringify(favorites))
  }, [favorites])

  // Xử lý toggle yêu thích
  const toggleFavorite = (id) => {
    if (!currentUser) {
      navigate("/auth")
      return
    }
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id))
    } else {
      setFavorites([...favorites, id])
    }
  }

  // Lọc theo loại bất động sản
  const handleFilterChange = (type) => {
    setFilterType(type)
    setCurrentPage(1)
  }

  // Sắp xếp bất động sản
  const handleSortChange = (option) => {
    setSortOption(option)
    setCurrentPage(1)
  }

  // Lấy địa chỉ đầy đủ
  const getFullAddress = (property) => {
    const addressParts = []

    // Thêm địa chỉ chi tiết
    if (property.DiaChi) {
      addressParts.push(property.DiaChi)
    }

    // Thêm phường/xã
    if (property.MaXa && locationNames[`ward_${property.MaXa}`]) {
      addressParts.push(locationNames[`ward_${property.MaXa}`])
    }

    // Thêm quận/huyện
    if (property.MaHuyen && locationNames[`district_${property.MaHuyen}`]) {
      addressParts.push(locationNames[`district_${property.MaHuyen}`])
    }

    // Thêm tỉnh/thành phố
    if (property.MaTinh && locationNames[`province_${property.MaTinh}`]) {
      addressParts.push(locationNames[`province_${property.MaTinh}`])
    }

    return addressParts.join(", ")
  }

  // Xử lý tăng lượt xem và chuyển đến trang chi tiết
  const handleViewDetails = async (id) => {
    try {
      // Gọi API tăng lượt xem
      await axios.post(`${API_URL}/properties/${id}/view`)

      // Chuyển đến trang chi tiết
      navigate(`/bat-dong-san/${id}`)
    } catch (error) {
      console.error("Lỗi khi tăng lượt xem:", error)
      // Vẫn chuyển đến trang chi tiết ngay cả khi có lỗi
      navigate(`/bat-dong-san/${id}`)
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
  // Lọc và sắp xếp bất động sản
  const filteredAndSortedProperties = React.useMemo(() => {
    let result = [...properties]
    if (filterType !== "Tất cả") {
      result = result.filter((p) => {
        const type = propertyTypes.find((t) => t.MaLoai === p.MaLoaiND)
        return type?.TenLoai === filterType
      })
    }

    // Sắp xếp
    switch (sortOption) {
      case "price-asc":
        return result.sort((a, b) => a.Gia - b.Gia)
      case "price-desc":
        return result.sort((a, b) => b.Gia - a.Gia)
      case "area-asc":
        return result.sort((a, b) => a.DienTich - b.DienTich)
      case "area-desc":
        return result.sort((a, b) => b.DienTich - a.DienTich)
      case "views-desc":
        return result.sort((a, b) => b.SoLuotXem - a.SoLuotXem)
      default:
        return result
    }
  }, [properties, filterType, sortOption, propertyTypes])

  // Phân trang
  const indexOfLastProperty = currentPage * propertiesPerPage
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage
  const currentProperties = filteredAndSortedProperties.slice(indexOfFirstProperty, indexOfLastProperty)
  const totalPages = Math.ceil(filteredAndSortedProperties.length / propertiesPerPage)

  
  // Lấy tên loại bất động sản
  const getPropertyTypeName = (maLoaiND) => {
    const type = propertyTypes.find((t) => t.MaLoai === maLoaiND)
    return type ? type.TenLoai : "Không xác định"
  }
  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>
  }

  return (
    <div className="property-list-container">
      <div className="property-list-header">
        <h2>Bất động sản nổi bật</h2>
        <div className="property-list-actions">
          <button className="filter-button" onClick={() => setShowFilters(!showFilters)}>
            <FaFilter /> Bộ lọc
          </button>
          <div className="sort-dropdown">
            <FaSort />
            <select value={sortOption} onChange={(e) => handleSortChange(e.target.value)}>
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="area-asc">Diện tích: Nhỏ đến lớn</option>
              <option value="area-desc">Diện tích: Lớn đến nhỏ</option>
              <option value="views-desc">Lượt xem: Cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="property-filters">
          <div className="filter-chips">
          <button
              className={`filter-chip ${filterType === "Tất cả" ? "active" : ""}`}
              onClick={() => handleFilterChange("Tất cả")}
            >
              Tất cả
            </button>
            {propertyTypes.map((type) => (
              <button
                key={type.MaLoai}
                className={`filter-chip ${filterType === type.TenLoai ? "active" : ""}`}
                onClick={() => handleFilterChange(type.TenLoai)}
              >
                {type.TenLoai}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="property-list">
        {currentProperties.length > 0 ? (
          currentProperties.map((property) => {
            // Debug log để kiểm tra dữ liệu hình ảnh
            console.log(`Property ${property.MaTTND} image:`, property.HinhAnh)

            return (
            <div key={property.MaTTND} className={`property-card ${property.isFeatured ? "featured" : ""}`}>
              <div className="property-image-container">
              <img
                  src={
                    property.HinhAnh && property.HinhAnh.length > 0
                    ? `${SERVER_URL}${property.HinhAnh[0]}`
                      : "/placeholder.svg?height=200&width=400"
                  }
                  alt={property.TieuDe}
                  className="property-image"
                  onError={(e) => {
                    console.error(`Error loading image for property ${property.MaTTND}`)
                    e.target.src = "/placeholder.svg?height=200&width=400"
                  }}
                />
                <button
                  className="favorite-button"
                  onClick={() => toggleFavorite(property.MaTTND)}
                  aria-label={favorites.includes(property.MaTTND) ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                >
                  {favorites.includes(property.MaTTND) ? (
                    <FaHeart className="favorite-icon active" />
                  ) : (
                    <FaRegHeart className="favorite-icon" />
                  )}
                </button>
                {property.isFeatured && <span className="featured-badge">Nổi bật</span>}
                <span className="property-status">{property.TrangThai}</span>
              </div>
              <div className="property-info">
                <h3 className="property-title">{property.TieuDe}</h3>
                <p className="property-address">
                  <FaMapMarkerAlt className="icon" /> {getFullAddress(property)}
                </p>
                <div className="property-details">
                  <div className="property-price">{formatPrice(property.Gia)}</div>
                  <div className="property-area">
                    <FaRulerCombined className="icon" /> {property.DienTich} m²
                  </div>
                </div>
                <div className="property-meta">
                  <span className="property-type">{getPropertyTypeName(property.MaLoaiND)}</span>
                  <span className="property-views">
                    <FaEye className="icon" /> {property.SoLuotXem || 0}
                  </span>
                </div>
                <button className="view-details-button" onClick={() => handleViewDetails(property.MaTTND)}>
                  Xem chi tiết
                </button>
              </div>
            </div>
          )
        })
        ) : (
          <div className="no-results">
            <p>Không tìm thấy bất động sản phù hợp với bộ lọc.</p>
          </div>
        )}
      </div>

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
    </div>
  )
}

export default PropertyList
