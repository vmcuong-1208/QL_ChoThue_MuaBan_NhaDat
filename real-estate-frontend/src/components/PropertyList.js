"use client"

import React, { useState, useEffect } from "react"
import { FaHeart, FaRegHeart, FaEye, FaMapMarkerAlt, FaRulerCombined, FaFilter, FaSort } from "react-icons/fa"
import "../styles/PropertyList.css"
import { useAuth } from "../context/AuthContext" // Corrected import path
import { useNavigate } from "react-router-dom"

// Dữ liệu mẫu với thêm thông tin
const initialProperties = [
  {
    id: 1,
    title: "Nhà phố Quận 1",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    price: 5000000000,
    formattedPrice: "5 tỷ",
    area: 120,
    views: 1542,
    type: "Nhà phố",
    status: "Đang bán",
    image: "https://i.ex-cdn.com/vietnamfinance.vn/files/f1/news/bichnga/2020/11/17/%C4%90%C3%B4ng%20TPHCM-1.jpg",
    isFeatured: true,
  },
  {
    id: 2,
    title: "Biệt thự Quận 1",
    address: "45 Lê Lợi, Quận 1, TP.HCM",
    price: 200000000000,
    formattedPrice: "200 tỷ",
    area: 500,
    views: 3210,
    type: "Biệt thự",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
    isFeatured: true,
  },
  {
    id: 3,
    title: "Biệt thự Quận 2",
    address: "78 Thảo Điền, Quận 2, TP.HCM",
    price: 100000000000,
    formattedPrice: "100 tỷ",
    area: 450,
    views: 2156,
    type: "Biệt thự",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
  },
  {
    id: 4,
    title: "Biệt thự Quận 3",
    address: "56 Võ Thị Sáu, Quận 3, TP.HCM",
    price: 40000000000,
    formattedPrice: "40 tỷ",
    area: 320,
    views: 1876,
    type: "Biệt thự",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
  },
  {
    id: 5,
    title: "Biệt thự Quận 4",
    address: "34 Nguyễn Tất Thành, Quận 4, TP.HCM",
    price: 30000000000,
    formattedPrice: "30 tỷ",
    area: 280,
    views: 1245,
    type: "Biệt thự",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
  },
  {
    id: 6,
    title: "Biệt thự Quận 5",
    address: "89 Trần Hưng Đạo, Quận 5, TP.HCM",
    price: 110000000000,
    formattedPrice: "110 tỷ",
    area: 420,
    views: 2345,
    type: "Biệt thự",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
  },
  {
    id: 7,
    title: "Biệt thự Quận 10",
    address: "67 Lý Thường Kiệt, Quận 10, TP.HCM",
    price: 99000000000,
    formattedPrice: "99 tỷ",
    area: 380,
    views: 1987,
    type: "Biệt thự",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
  },
  {
    id: 8,
    title: "Căn hộ chung cư Quận 2",
    address: "123 Mai Chí Thọ, Quận 2, TP.HCM",
    price: 3000000000,
    formattedPrice: "3 tỷ",
    area: 75,
    views: 2456,
    type: "Căn hộ",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
  },
  {
    id: 9,
    title: "Căn hộ cao cấp Quận 7",
    address: "45 Nguyễn Lương Bằng, Quận 7, TP.HCM",
    price: 6000000000,
    formattedPrice: "6 tỷ",
    area: 90,
    views: 1876,
    type: "Căn hộ",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
    isFeatured: true,
  },
  {
    id: 10,
    title: "Shophouse Quận 9",
    address: "78 Lê Văn Việt, Quận 9, TP.HCM",
    price: 15000000000,
    formattedPrice: "15 tỷ",
    area: 150,
    views: 1432,
    type: "Shophouse",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
  },
  {
    id: 11,
    title: "Nhà phố Quận Bình Thạnh",
    address: "56 Điện Biên Phủ, Bình Thạnh, TP.HCM",
    price: 7000000000,
    formattedPrice: "7 tỷ",
    area: 100,
    views: 1765,
    type: "Nhà phố",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
  },
  {
    id: 12,
    title: "Villa Quận 2",
    address: "34 Xuân Thủy, Quận 2, TP.HCM",
    price: 120000000000,
    formattedPrice: "120 tỷ",
    area: 480,
    views: 2876,
    type: "Biệt thự",
    status: "Đang bán",
    image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png",
    isFeatured: true,
  },
]

const PropertyList = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [favorites, setFavorites] = useState([])
  const [filterType, setFilterType] = useState("Tất cả")
  const [sortOption, setSortOption] = useState("default")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const propertiesPerPage = 8

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
    // Lọc theo loại
    const result = filterType === "Tất cả" ? initialProperties : initialProperties.filter((property) => property.type === filterType)

    // Sắp xếp
    switch (sortOption) {
      case "price-asc":
        return [...result].sort((a, b) => a.price - b.price)
      case "price-desc":
        return [...result].sort((a, b) => b.price - a.price)
      case "area-asc":
        return [...result].sort((a, b) => a.area - b.area)
      case "area-desc":
        return [...result].sort((a, b) => b.area - a.area)
      case "views-desc":
        return [...result].sort((a, b) => b.views - a.views)
      default:
        // Mặc định: Hiển thị featured trước
        return [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
    }
  }, [filterType, sortOption])

  // Phân trang
  const indexOfLastProperty = currentPage * propertiesPerPage
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage
  const currentProperties = filteredAndSortedProperties.slice(indexOfFirstProperty, indexOfLastProperty)
  const totalPages = Math.ceil(filteredAndSortedProperties.length / propertiesPerPage)

  // Danh sách các loại bất động sản
  const propertyTypes = ["Tất cả", "Nhà phố", "Biệt thự", "Căn hộ", "Shophouse"]

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
            {propertyTypes.map((type) => (
              <button
                key={type}
                className={`filter-chip ${filterType === type ? "active" : ""}`}
                onClick={() => handleFilterChange(type)}
              >
                {type}
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
