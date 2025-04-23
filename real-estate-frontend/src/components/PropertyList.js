"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { FaHeart, FaRegHeart, FaEye, FaMapMarkerAlt, FaRulerCombined, FaFilter, FaSort } from "react-icons/fa"
import "../styles/PropertyList.css"
import { useAuth } from "../context/AuthContext" // Corrected import path
import { useNavigate } from "react-router-dom"

const API_URL = "http://localhost:5000/api"

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
  const propertiesPerPage = 8
  
  // Lấy danh sách loại nhà đất từ API
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/property-types`, {
          headers: { Authorization: `Bearer ${token}` }
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

  // Lọc và sắp xếp bất động sản
  const filteredAndSortedProperties = React.useMemo(() => {
    let result = [...properties]
    if (filterType !== "Tất cả") {
      result = result.filter(p => {
        const type = propertyTypes.find(t => t.MaLoai === p.MaLoaiND)
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
          currentProperties.map((property) => (
            <div key={property.id} className={`property-card ${property.isFeatured ? "featured" : ""}`}>
              <div className="property-image-container">
                <img src={property.image || "/placeholder.svg"} alt={property.title} className="property-image" />
                <button
                  className="favorite-button"
                  onClick={() => toggleFavorite(property.id)}
                  aria-label={favorites.includes(property.id) ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                >
                  {favorites.includes(property.id) ? (
                    <FaHeart className="favorite-icon active" />
                  ) : (
                    <FaRegHeart className="favorite-icon" />
                  )}
                </button>
                {property.isFeatured && <span className="featured-badge">Nổi bật</span>}
                <span className="property-status">{property.status}</span>
              </div>
              <div className="property-info">
                <h3 className="property-title">{property.title}</h3>
                <p className="property-address">
                  <FaMapMarkerAlt className="icon" /> {property.address}
                </p>
                <div className="property-details">
                  <div className="property-price">{property.formattedPrice}</div>
                  <div className="property-area">
                    <FaRulerCombined className="icon" /> {property.area} m²
                  </div>
                </div>
                <div className="property-meta">
                  <span className="property-type">{property.type}</span>
                  <span className="property-views">
                    <FaEye className="icon" /> {property.views}
                  </span>
                </div>
                <button className="view-details-button">Xem chi tiết</button>
              </div>
            </div>
          ))
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
