"use client"

import { useState } from "react"
import "../styles/PriceReference.css"

function PriceSearchForm({ onSearch }) {
  const [propertyType, setPropertyType] = useState("Căn hộ")
  const [location, setLocation] = useState("Phường Bình Hưng Hòa, Quận Bình Tân")
  const [street, setStreet] = useState("")

  const handleSearch = () => {
    onSearch({ propertyType, location, street })
  }

  return (
    <div className="search-form-wrapper">
      <div className="search-form-header">
        <h2>Xem giá Bất động sản</h2>
        <p>Chọn khu vực và loại bất động sản mà bạn muốn xem giá</p>
      </div>

      <div className="search-form-grid">
        {/* Property Type */}
        <div className="form-group">
          <label>Loại hình (Nhà ở, Căn hộ...)</label>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="form-select">
            <option>Nhà ở</option>
            <option>Căn hộ</option>
            <option>Đất nền</option>
            <option>Biệt thự</option>
          </select>
        </div>

        {/* Location */}
        <div className="form-group">
          <label>Khu vực (Tỉnh/thành, quận...)</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)} className="form-select">
            <option>Phường Bình Hưng Hòa, Quận Bình Tân</option>
            <option>Quận 1, Tp Hồ Chí Minh</option>
            <option>Huyện Bình Chánh, Tp Hồ Chí Minh</option>
            <option>Thủ Đức, Tp Hồ Chí Minh</option>
            <option>Quận 7, Tp Hồ Chí Minh</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="form-group">
          <label>Nhập tên đường ban muốn</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Ví dụ: Nguyễn Hữu Cảnh..."
            className="form-input"
          />
        </div>

        {/* Search Button */}
        <div className="form-group form-group-button">
          <button onClick={handleSearch} className="search-button">
            🔍 Xem giá ngay
          </button>
        </div>
      </div>
    </div>
  )
}

export default PriceSearchForm
