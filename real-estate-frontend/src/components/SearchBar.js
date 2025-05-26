"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaSearch, FaMapMarkerAlt, FaHome } from "react-icons/fa"
import axios from "axios"
import locationService from "../services/locationService"
import "../styles/SearchBar.css"

const API_URL = "http://localhost:5000/api"

const SearchBar = () => {
  const navigate = useNavigate()
  const [searchData, setSearchData] = useState({
    keyword: "",
    loaiBDS: "",
    tinh: "",
    huyen: "",
    giaMin: "",
    giaMax: "",
    dienTichMin: "",
    dienTichMax: "",
  })

  const [propertyTypes, setPropertyTypes] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Lấy danh sách loại BDS
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await axios.get(`${API_URL}/property-types`)
        setPropertyTypes(response.data)
      } catch (error) {
        console.error("Lỗi khi lấy loại BDS:", error)
      }
    }
    fetchPropertyTypes()
  }, [])

  // Lấy danh sách tỉnh/thành
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data = await locationService.getProvinces()
        setProvinces(data)
      } catch (error) {
        console.error("Lỗi khi lấy tỉnh/thành:", error)
      }
    }
    fetchProvinces()
  }, [])

  // Lấy danh sách quận/huyện khi chọn tỉnh
  useEffect(() => {
    const fetchDistricts = async () => {
      if (searchData.tinh) {
        try {
          const data = await locationService.getDistricts(searchData.tinh)
          setDistricts(data)
        } catch (error) {
          console.error("Lỗi khi lấy quận/huyện:", error)
        }
      } else {
        setDistricts([])
      }
    }
    fetchDistricts()
  }, [searchData.tinh])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Reset quận/huyện khi thay đổi tỉnh
    if (name === "tinh") {
      setSearchData((prev) => ({
        ...prev,
        huyen: "",
      }))
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()

    // Tạo query string từ dữ liệu tìm kiếm
    const queryParams = new URLSearchParams()

    Object.keys(searchData).forEach((key) => {
      if (searchData[key]) {
        queryParams.append(key, searchData[key])
      }
    })

    // Chuyển đến trang kết quả tìm kiếm
    navigate(`/tim-kiem?${queryParams.toString()}`)
  }

  const formatPrice = (value) => {
    if (!value) return ""
    const num = Number.parseInt(value)
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + " tỷ"
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(0) + " triệu"
    }
    return num.toLocaleString() + " VNĐ"
  }

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-main">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              name="keyword"
              value={searchData.keyword}
              onChange={handleInputChange}
              placeholder="Tìm kiếm theo từ khóa, địa điểm..."
              className="search-input"
            />
          </div>

          <div className="search-select-group">
            <FaHome className="search-icon" />
            <select name="loaiBDS" value={searchData.loaiBDS} onChange={handleInputChange} className="search-select">
              <option value="">Tất cả loại BDS</option>
              {propertyTypes.map((type) => (
                <option key={type.MaLoai} value={type.MaLoai}>
                  {type.TenLoai}
                </option>
              ))}
            </select>
          </div>

          <div className="search-select-group">
            <FaMapMarkerAlt className="search-icon" />
            <select name="tinh" value={searchData.tinh} onChange={handleInputChange} className="search-select">
              <option value="">Tất cả tỉnh/thành</option>
              {provinces.map((province) => (
                <option key={province.MaTinh} value={province.MaTinh}>
                  {province.TenTinh}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="search-button">
            <FaSearch /> Tìm kiếm
          </button>
        </div>

        <div className="search-advanced-toggle">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="advanced-toggle-btn">
            {showAdvanced ? "Ẩn bộ lọc nâng cao" : "Hiện bộ lọc nâng cao"}
          </button>
        </div>

        {showAdvanced && (
          <div className="search-advanced">
            <div className="advanced-row">
              <div className="advanced-group">
                <label>Quận/Huyện</label>
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
              </div>

              <div className="advanced-group">
                <label>Khoảng giá</label>
                <div className="price-range">
                  <input
                    type="number"
                    name="giaMin"
                    value={searchData.giaMin}
                    onChange={handleInputChange}
                    placeholder="Giá từ"
                    className="price-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    name="giaMax"
                    value={searchData.giaMax}
                    onChange={handleInputChange}
                    placeholder="Giá đến"
                    className="price-input"
                  />
                </div>
                {(searchData.giaMin || searchData.giaMax) && (
                  <div className="price-display">
                    {formatPrice(searchData.giaMin)} - {formatPrice(searchData.giaMax)}
                  </div>
                )}
              </div>

              <div className="advanced-group">
                <label>Diện tích (m²)</label>
                <div className="area-range">
                  <input
                    type="number"
                    name="dienTichMin"
                    value={searchData.dienTichMin}
                    onChange={handleInputChange}
                    placeholder="Từ"
                    className="area-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    name="dienTichMax"
                    value={searchData.dienTichMax}
                    onChange={handleInputChange}
                    placeholder="Đến"
                    className="area-input"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default SearchBar
