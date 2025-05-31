"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { FaSearch, FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa"
import "../styles/global.css"
import PropertyList from "./PropertyList"
import { useAuth } from "../context/AuthContext"
import locationService from "../services/locationService"

const API_URL = "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000"

const Home = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [searchData, setSearchData] = useState({
    keyword: "",
    loaiBDS: "",
    tinhThanh: "",
    quanHuyen: "",
    phuongXa: "",
  })

  const [recommendations, setRecommendations] = useState([])
  const [propertyTypes, setPropertyTypes] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  // Lấy danh sách loại nhà đất
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await axios.get(`${API_URL}/property-types`)
        setPropertyTypes(response.data)
      } catch (error) {
        console.error("Lỗi khi lấy loại nhà đất:", error)
      }
    }

    fetchPropertyTypes()
  }, [])

  // Lấy danh sách tỉnh/thành phố
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const provincesData = await locationService.getProvinces()
        setProvinces(provincesData)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error)
      }
    }

    fetchProvinces()
  }, [])

  // Lấy danh sách quận/huyện khi chọn tỉnh
  useEffect(() => {
    const fetchDistricts = async () => {
      if (searchData.tinhThanh) {
        try {
          const districtsData = await locationService.getDistricts(searchData.tinhThanh)
          setDistricts(districtsData)
        } catch (error) {
          console.error("Lỗi khi lấy danh sách quận/huyện:", error)
          setDistricts([])
        }
      } else {
        setDistricts([])
        setSearchData((prev) => ({ ...prev, quanHuyen: "", phuongXa: "" }))
      }
    }

    fetchDistricts()
  }, [searchData.tinhThanh])

  // Lấy danh sách phường/xã khi chọn quận/huyện
  useEffect(() => {
    const fetchWards = async () => {
      if (searchData.quanHuyen) {
        try {
          const wardsData = await locationService.getWards(searchData.quanHuyen)
          setWards(wardsData)
        } catch (error) {
          console.error("Lỗi khi lấy danh sách phường/xã:", error)
          setWards([])
        }
      } else {
        setWards([])
        setSearchData((prev) => ({ ...prev, phuongXa: "" }))
      }
    }

    fetchWards()
  }, [searchData.quanHuyen])

  // Lấy gợi ý bất động sản
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (currentUser) {
          // Nếu đã đăng nhập, lấy gợi ý cá nhân hóa
          const token = localStorage.getItem("token")
          const response = await axios.get(`${API_URL}/recommendations`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 6 },
          })
          setRecommendations(response.data.recommendations || [])
        } else {
          // Nếu chưa đăng nhập, lấy bài đăng phổ biến
          const response = await axios.get(`${API_URL}/properties`, {
            params: { limit: 6, sort: "views-desc" },
          })
          setRecommendations(response.data.properties || [])
        }
      } catch (error) {
        console.error("Lỗi khi lấy gợi ý:", error)
        // Fallback: lấy bài đăng phổ biến nếu có lỗi
        try {
          const response = await axios.get(`${API_URL}/properties`, {
            params: { limit: 6, sort: "views-desc" },
          })
          setRecommendations(response.data.properties || [])
        } catch (fallbackError) {
          console.error("Lỗi fallback:", fallbackError)
        }
      }
    }

    fetchRecommendations()
  }, [currentUser])

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault()
    const queryParams = new URLSearchParams()

    if (searchData.keyword) queryParams.append("keyword", searchData.keyword)
    if (searchData.loaiBDS) queryParams.append("loaiBDS", searchData.loaiBDS)
    if (searchData.tinhThanh) queryParams.append("tinh", searchData.tinhThanh)
    if (searchData.quanHuyen) queryParams.append("huyen", searchData.quanHuyen)
    if (searchData.phuongXa) queryParams.append("xa", searchData.phuongXa)

    navigate(`/tim-kiem?${queryParams.toString()}`)
  }

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }))
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

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Chào mừng đến với website bất động sản!</h1>
            <p className="hero-subtitle">Tìm kiếm ngôi nhà mơ ước của bạn với hàng nghìn lựa chọn đa dạng</p>
          </div>

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

                <select
                  name="loaiBDS"
                  value={searchData.loaiBDS}
                  onChange={handleInputChange}
                  className="search-select"
                >
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
                <select
                  name="tinhThanh"
                  value={searchData.tinhThanh}
                  onChange={handleInputChange}
                  className="search-select"
                >
                  <option value="">Tất cả tỉnh/thành</option>
                  {provinces.map((province) => (
                    <option key={province.MaTinh} value={province.MaTinh}>
                      {province.TenTinh}
                    </option>
                  ))}
                </select>

                <select
                  name="quanHuyen"
                  value={searchData.quanHuyen}
                  onChange={handleInputChange}
                  className="search-select"
                  disabled={!searchData.tinhThanh}
                >
                  <option value="">Tất cả quận/huyện</option>
                  {districts.map((district) => (
                    <option key={district.MaHuyen} value={district.MaHuyen}>
                      {district.TenHuyen}
                    </option>
                  ))}
                </select>

                <select
                  name="phuongXa"
                  value={searchData.phuongXa}
                  onChange={handleInputChange}
                  className="search-select"
                  disabled={!searchData.quanHuyen}
                >
                  <option value="">Tất cả phường/xã</option>
                  {wards.map((ward) => (
                    <option key={ward.MaXa} value={ward.MaXa}>
                      {ward.TenXa}
                    </option>
                  ))}
                </select>

                <Link to="/tim-kiem" className="advanced-search-link">
                  Tìm kiếm nâng cao
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <section className="recommendations-section">
          <div className="container">
            <div className="section-header">
              <h2>💡 {currentUser ? "Bất động sản được gợi ý" : "Bất động sản nổi bật"}</h2>
              <p>{currentUser ? "Dựa trên sở thích của bạn" : "Bất động sản phổ biến nhất"}</p>
            </div>

            <div className="recommendations-grid">
              {recommendations.map((property) => (
                <div key={property.MaTTND} className="recommendation-card">
                  <div className="property-image-container">
                    <img
                      src={
                        property.HinhAnh && property.HinhAnh.length > 0
                          ? `${SERVER_URL}${property.HinhAnh[0]}`
                          : "/placeholder.svg?height=200&width=300"
                      }
                      alt={property.TieuDe}
                      className="property-image"
                    />
                    {property.TrangThaiXacThuc === "đã xác thực" && (
                      <div className="verified-icon">
                        <FaCheckCircle />
                      </div>
                    )}
                    <span className="property-status">{property.TrangThai}</span>
                  </div>

                  <div className="property-info">
                    <h3 className="property-title">{property.TieuDe}</h3>
                    <p className="property-address">
                      <FaMapMarkerAlt /> {property.DiaChi}
                    </p>
                    <div className="property-details">
                      <span className="property-price">{formatPrice(property.Gia)}</span>
                      <span className="property-area">{property.DienTich} m²</span>
                    </div>
                    <Link to={`/bat-dong-san/${property.MaTTND}`} className="view-details-btn">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Properties Section */}
      <section className="all-properties-section">
        <div className="container">
          <div className="section-header">
            <h2>🏠 Tất cả bất động sản</h2>
            <p>Khám phá toàn bộ danh sách bất động sản</p>
          </div>

          <PropertyList />
        </div>
      </section>
    </div>
  )
}

export default Home
