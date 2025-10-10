"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { FaHeart, FaRegHeart, FaEye, FaMapMarkerAlt, FaRulerCombined, FaSort, FaSearch, FaCheckCircle} from "react-icons/fa"
import { useAuth } from "../context/AuthContext"
import locationService from "../services/locationService"
import "../styles/SearchResults.css"

const API_URL = "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000"

const SearchResults = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [properties, setProperties] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [locationNames, setLocationNames] = useState({})
  const [propertyTypes, setPropertyTypes] = useState([])
  const [sortOption, setSortOption] = useState("default")

  // Search form states
  const [searchData, setSearchData] = useState({
    keyword: "",
    loaiBDS: "",
    tinh: "",
    huyen: "",
    xa: "",
    giaMin: "",
    giaMax: "",
    dienTichMin: "",
    dienTichMax: "",
  })

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  const propertiesPerPage = 12
  

  // Lấy parameters từ URL và set vào form
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    setSearchData({
      keyword: searchParams.get("keyword") || "",
      loaiBDS: searchParams.get("loaiBDS") || "",
      tinh: searchParams.get("tinh") || "",
      huyen: searchParams.get("huyen") || "",
      xa: searchParams.get("xa") || "",
      giaMin: searchParams.get("giaMin") || "",
      giaMax: searchParams.get("giaMax") || "",
      dienTichMin: searchParams.get("dienTichMin") || "",
      dienTichMax: searchParams.get("dienTichMax") || "",
    })
  }, [location.search])

  // Lấy danh sách loại BDS và địa điểm
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertyTypesRes, provincesData] = await Promise.all([
          axios.get(`${API_URL}/property-types`),
          locationService.getProvinces(),
        ])
        setPropertyTypes(propertyTypesRes.data)
        setProvinces(provincesData)
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error)
      }
    }
    fetchData()
  }, [])

  // Lấy quận/huyện khi chọn tỉnh
  useEffect(() => {
    const fetchDistricts = async () => {
      if (searchData.tinh) {
        try {
          const data = await locationService.getDistricts(searchData.tinh)
          setDistricts(data)
        } catch (error) {
          console.error("Lỗi khi lấy quận/huyện:", error)
          setDistricts([])
        }
      } else {
        setDistricts([])
      }
    }
    fetchDistricts()
  }, [searchData.tinh])

  // Lấy phường/xã khi chọn quận/huyện
  useEffect(() => {
    const fetchWards = async () => {
      if (searchData.huyen) {
        try {
          const data = await locationService.getWards(searchData.huyen)
          setWards(data)
        } catch (error) {
          console.error("Lỗi khi lấy phường/xã:", error)
          setWards([])
        }
      } else {
        setWards([])
      }
    }
    fetchWards()
  }, [searchData.huyen])

  // Tìm kiếm bất động sản
  useEffect(() => {
    const searchProperties = async () => {
      try {
        setLoading(true)

        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: propertiesPerPage,
          ...Object.fromEntries(Object.entries(searchData).filter(([_, v]) => v !== "")),
        })

        if (sortOption !== "default") {
          queryParams.append("sort", sortOption)
        }

        const response = await axios.get(`${API_URL}/properties/search?${queryParams}`)

        setProperties(response.data.properties || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
        setTotalResults(response.data.pagination?.total || 0)

        await fetchLocationNames(response.data.properties || [])
      } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    searchProperties()
  }, [searchData, currentPage, sortOption])

  // Lấy thông tin địa điểm
  const fetchLocationNames = async (properties) => {
    try {
      const locationNamesObj = {}
      const provinces = await locationService.getProvinces()

      for (const property of properties) {
        if (property.MaTinh) {
          const province = provinces.find((p) => p.MaTinh === Number.parseInt(property.MaTinh))
          if (province) {
            locationNamesObj[`province_${property.MaTinh}`] = province.TenTinh

            if (property.MaHuyen) {
              try {
                const districts = await locationService.getDistricts(property.MaTinh)
                const district = districts.find((d) => d.MaHuyen === Number.parseInt(property.MaHuyen))
                if (district) {
                  locationNamesObj[`district_${property.MaHuyen}`] = district.TenHuyen
                }
              } catch (error) {
                console.error("Lỗi khi lấy quận/huyện:", error)
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

  // Lấy trạng thái yêu thích
  useEffect(() => {
    const checkFavorites = async () => {
      if (!currentUser || properties.length === 0) return

      const token = localStorage.getItem("token")
      const favoriteStatuses = {}

      for (const property of properties) {
        try {
          const response = await axios.get(`${API_URL}/favorites/check/${property.MaTTND}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          favoriteStatuses[property.MaTTND] = response.data.isFavorite
        } catch (error) {
          console.error("Error checking favorite status:", error)
        }
      }

      setFavorites(
        Object.keys(favoriteStatuses)
          .filter((id) => favoriteStatuses[id])
          .map(Number),
      )
    }

    checkFavorites()
  }, [properties, currentUser])

  // Toggle yêu thích
  const toggleFavorite = async (id) => {
    if (!currentUser) {
      navigate("/auth")
      return
    }

    try {
      const token = localStorage.getItem("token")

      if (favorites.includes(id)) {
        await axios.delete(`${API_URL}/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setFavorites(favorites.filter((favId) => favId !== id))
      } else {
        await axios.post(
          `${API_URL}/favorites/${id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        setFavorites([...favorites, id])
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      alert("Có lỗi xảy ra khi cập nhật yêu thích")
    }
  }

  // Xem chi tiết
  const handleViewDetails = async (id) => {
    try {
      await axios.post(`${API_URL}/properties/${id}/view`, {
        viewerId: currentUser?.MaNgDung,
      })
      navigate(`/bat-dong-san/${id}`)
    } catch (error) {
      console.error("Lỗi khi tăng lượt xem:", error)
      navigate(`/bat-dong-san/${id}`)
    }
  }

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault()
    const queryParams = new URLSearchParams()

    Object.entries(searchData).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })

    navigate(`/tim-kiem?${queryParams.toString()}`)
    setCurrentPage(1)
  }

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Reset các trường phụ thuộc
    if (name === "tinh") {
      setSearchData((prev) => ({ ...prev, huyen: "", xa: "" }))
    } else if (name === "huyen") {
      setSearchData((prev) => ({ ...prev, xa: "" }))
    }
  }

  // Utility functions
  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ"
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu"
    }
    return price.toLocaleString() + " VNĐ"
  }

  const getFullAddress = (property) => {
    const addressParts = []
    if (property.DiaChi) addressParts.push(property.DiaChi)
    if (property.MaHuyen && locationNames[`district_${property.MaHuyen}`]) {
      addressParts.push(locationNames[`district_${property.MaHuyen}`])
    }
    if (property.MaTinh && locationNames[`province_${property.MaTinh}`]) {
      addressParts.push(locationNames[`province_${property.MaTinh}`])
    }
    return addressParts.join(", ")
  }

  const getPropertyTypeName = (maLoaiND) => {
    const type = propertyTypes.find((t) => t.MaLoai === maLoaiND)
    return type ? type.TenLoai : "Không xác định"
  }

  return (
    <div className="search-results-container">
      {/* Search Form */}
      <div className="search-container">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-row">
            <div className="search-input-wrapper">
              <input
                type="text"
                name="keyword"
                placeholder="Tìm theo từ khóa, địa điểm..."
                value={searchData.keyword}
                onChange={handleInputChange}
                className="search-input"
              />
              <FaSearch className="search-input-icon" />
            </div>

            <select name="loaiBDS" value={searchData.loaiBDS} onChange={handleInputChange} className="search-select">
              <option value="">Tất cả loại BĐS</option>
              {propertyTypes.map((type) => (
                <option key={type.MaLoai} value={type.MaLoai}>
                  {type.TenLoai}
                </option>
              ))}
            </select>

            <button type="submit" className="search-button">
              <FaSearch /> Tìm kiếm
            </button>
          </div>

          <div className="search-row">
            <select name="tinh" value={searchData.tinh} onChange={handleInputChange} className="search-select">
              <option value="">Tất cả tỉnh/thành</option>
              {provinces.map((province) => (
                <option key={province.MaTinh} value={province.MaTinh}>
                  {province.TenTinh}
                </option>
              ))}
            </select>

            <select
              name="huyen"
              value={searchData.huyen}
              onChange={handleInputChange}
              className="search-select"
              disabled={!searchData.tinh}
            >
              <option value="">Tất cả quận/huyện</option>
              {districts.map((district) => (
                <option key={district.MaHuyen} value={district.MaHuyen}>
                  {district.TenHuyen}
                </option>
              ))}
            </select>

            <select
              name="xa"
              value={searchData.xa}
              onChange={handleInputChange}
              className="search-select"
              disabled={!searchData.huyen}
            >
              <option value="">Tất cả phường/xã</option>
              {wards.map((ward) => (
                <option key={ward.MaXa} value={ward.MaXa}>
                  {ward.TenXa}
                </option>
              ))}
            </select>
          </div>

          <div className="search-row">
            <input
              type="number"
              name="giaMin"
              placeholder="Giá từ (VNĐ)"
              value={searchData.giaMin}
              onChange={handleInputChange}
              className="search-input"
            />
            <input
              type="number"
              name="giaMax"
              placeholder="Giá đến (VNĐ)"
              value={searchData.giaMax}
              onChange={handleInputChange}
              className="search-input"
            />
            <input
              type="number"
              name="dienTichMin"
              placeholder="Diện tích từ (m²)"
              value={searchData.dienTichMin}
              onChange={handleInputChange}
              className="search-input"
            />
            <input
              type="number"
              name="dienTichMax"
              placeholder="Diện tích đến (m²)"
              value={searchData.dienTichMax}
              onChange={handleInputChange}
              className="search-input"
            />
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="search-results-header">
        <h1>Kết quả tìm kiếm</h1>

        <div className="results-actions">
          <div className="sort-dropdown">
            <FaSort />
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="area-asc">Diện tích: Nhỏ đến lớn</option>
              <option value="area-desc">Diện tích: Lớn đến nhỏ</option>
              <option value="views-desc">Lượt xem: Cao nhất</option>
              <option value="newest">Mới nhất</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">Đang tìm kiếm...</div>
      ) : properties.length > 0 ? (
        <>
          <div className="search-results-grid">
            {properties.map((property) => (
              <div key={property.MaTTND} className="property-card">
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
                      e.target.src = "/placeholder.svg?height=200&width=400"
                    }}
                  />
                  {property.TrangThaiXacThuc === "đã xác thực" && (
                    <div className="verified-icon">
                      <FaCheckCircle />
                    </div>
                  )}
                  <button className="favorite-button" onClick={() => toggleFavorite(property.MaTTND)}>
                    {favorites.includes(property.MaTTND) ? (
                      <FaHeart className="favorite-icon active" />
                    ) : (
                      <FaRegHeart className="favorite-icon" />
                    )}
                  </button>
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
            ))}
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPage <= 3) {
                    page = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`pagination-number ${currentPage === page ? "active" : ""}`}
                    >
                      {page}
                    </button>
                  )
                })}
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
      ) : (
        <div className="no-results">
          <h3>Không tìm thấy kết quả phù hợp</h3>
          <p>Hãy thử điều chỉnh bộ lọc tìm kiếm của bạn</p>
          <button onClick={() => navigate("/")} className="back-home-button">
            Về trang chủ
          </button>
        </div>
      )}
    </div>
  )
}

export default SearchResults
