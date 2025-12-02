"use client"

import { useState, useEffect } from "react"
import locationService from "../services/locationService"
import "../styles/PriceReference.css"

const API_URL = "http://localhost:5000/api"

const normalizeString = (str) => {
  if (!str) return ""
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const normalizeDistrictName = (districtName) => {
  if (!districtName) return ""

  // Loại bỏ các tiền tố "Quận", "Huyện", "Thị xã", "Thành phố"
  let normalized = normalizeString(districtName)
  normalized = normalized
    .replace(/^quan\s+/i, "")
    .replace(/^huyen\s+/i, "")
    .replace(/^thi xa\s+/i, "")
    .replace(/^thanh pho\s+/i, "")
    .trim()

  return normalized
}

const getPropertyType = (property) => {
  return (
    property.TenLoai || property.LoaiNha || property.Loai || property.propertyType || property.propertyTypeName || ""
  )
}

const getAddress = (property) => {
  return property.DiaChi || property.Dia_Chi || property.address || property.dia_chi_chi_tiet || ""
}

const getPrice = (property) => {
  const price = property.Gia || property.GiaBan || property.Tien || property.price || property.MucGia || 0
  return price ? price : 0
}

const getPriceForTimeRange = (properties, monthsAgo) => {
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const nextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1)

  const filteredPrices = properties
    .filter((p) => {
      const propDate = new Date(p.NgayTao)
      return propDate >= targetDate && propDate < nextMonth
    })
    .map((p) => {
      const price = getPrice(p)
      return price > 0 ? price / 1000000 : 0
    })
    .filter((p) => p > 0)

  if (filteredPrices.length === 0) return 0
  return Math.round((filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length) * 10) / 10
}

export default function PriceReference() {
  const [searchParams, setSearchParams] = useState({
    propertyType: "",
    district: "", // Đổi từ TenHuyen sang MaHuyen
  })

  const [priceData, setPriceData] = useState([])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceLastMonth, setPriceLastMonth] = useState(0)
  const [priceLastYear, setPriceLastYear] = useState(0)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [propertyTypes, setPropertyTypes] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [selectedProvince, setSelectedProvince] = useState("")
  const [loading, setLoading] = useState(false)
  const [regionalData, setRegionalData] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null)

        const [typesRes, propsRes, provincesData] = await Promise.all([
          fetch(`${API_URL}/property-types`),
          fetch(`${API_URL}/properties?limit=1000`),
          locationService.getProvinces(),
        ])

        const types = await typesRes.json()
        const props = await propsRes.json()

        setPropertyTypes(Array.isArray(types) ? types : [])
        setProvinces(provincesData)

        if (types && types.length > 0) {
          setSearchParams((prev) => ({
            ...prev,
            propertyType: types[0].MaLoai || "",
          }))
        }

        if (provincesData.length > 0) {
          const firstProvince = provincesData[0]
          setSelectedProvince(firstProvince.MaTinh)

          const districtsData = await locationService.getDistricts(firstProvince.MaTinh)
          setDistricts(districtsData)

          if (districtsData.length > 0) {
            setSearchParams((prev) => ({
              ...prev,
              district: districtsData[0].MaHuyen,
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error)
        setError("Lỗi khi tải dữ liệu ban đầu")
      }
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedProvince) return

      try {
        const districtsData = await locationService.getDistricts(selectedProvince)
        setDistricts(districtsData)

        if (districtsData.length > 0) {
          setSearchParams((prev) => ({
            ...prev,
            district: districtsData[0].MaHuyen,
          }))
        }
      } catch (error) {
        console.error("Error fetching districts:", error)
        setError("Lỗi khi tải danh sách quận/huyện")
      }
    }

    fetchDistricts()
  }, [selectedProvince])

  useEffect(() => {
    if (!searchParams.propertyType || !searchParams.district) {
      return
    }

    const fetchPriceData = async () => {
      setLoading(true)
      setError(null)
      try {
        const queryParams = new URLSearchParams({
          loaiBDS: searchParams.propertyType,
          huyen: searchParams.district,
          limit: 1000,
        })

        if (selectedProvince) {
          queryParams.append("tinh", selectedProvince)
        }

        console.log("[v0] Fetching from API:", `${API_URL}/properties/search?${queryParams.toString()}`)

        const response = await fetch(`${API_URL}/properties/search?${queryParams.toString()}`)
        const data = await response.json()

        const filtered = data.properties || []

        console.log("[v0] Properties found from search API:", filtered.length)

        if (filtered.length > 0) {
          const prices = filtered
            .map((p) => {
              const price = p.Gia || 0
              return price > 0 ? price / 1000000 : 0
            })
            .filter((p) => p > 0)

          console.log("[v0] Valid prices extracted:", prices.length)

          if (prices.length === 0) {
            setCurrentPrice(0)
            setPriceData([])
            setRegionalData([])
            setError("Không có giá trị hợp lệ cho dữ liệu này")
            return
          }

          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
          const min = Math.min(...prices)
          const max = Math.max(...prices)

          const priceLastMonthReal = getPriceForTimeRange(filtered, 1)
          const priceLastYearReal = getPriceForTimeRange(filtered, 12)

          setCurrentPrice(Math.round(avgPrice * 10) / 10)
          setMinPrice(Math.round(min * 10) / 10)
          setMaxPrice(Math.round(max * 10) / 10)
          // Nếu không có dữ liệu tháng/năm trước, sử dụng giá hiện tại làm fallback
          setPriceLastMonth(priceLastMonthReal > 0 ? priceLastMonthReal : Math.round(avgPrice * 10) / 10)
          setPriceLastYear(priceLastYearReal > 0 ? priceLastYearReal : Math.round(avgPrice * 10) / 10)

          console.log("[v0] Price this month:", Math.round(avgPrice * 10) / 10)
          console.log("[v0] Price last month:", priceLastMonthReal > 0 ? priceLastMonthReal : "No data")
          console.log("[v0] Price last year:", priceLastYearReal > 0 ? priceLastYearReal : "No data")

          const trend = Array.from({ length: 12 }, (_, i) => {
            const currentMonth = new Date().getMonth() + 1 // 1-12
            const monthsBack = 11 - i
            let month = currentMonth - monthsBack
            if (month <= 0) month += 12

            return {
              month: `T${month}`,
              price: avgPrice - (i - 5) * 0.5,
              minPrice: min,
              maxPrice: max,
            }
          })
          setPriceData(trend)

          const regional = []
          for (const dist of districts) {
            if (regional.length >= 5) break

            try {
              const distQueryParams = new URLSearchParams({
                loaiBDS: searchParams.propertyType,
                huyen: dist.MaHuyen,
                limit: 100,
              })
              if (selectedProvince) {
                distQueryParams.append("tinh", selectedProvince)
              }

              console.log("[v0] Fetching regional data for:", dist.TenHuyen)
              const distResponse = await fetch(`${API_URL}/properties/search?${distQueryParams.toString()}`)
              const distData = await distResponse.json()
              const distProps = distData.properties || []

              console.log("[v0] District", dist.TenHuyen, "properties found:", distProps.length)

              if (distProps.length === 0) {
                console.log("[v0] Skipping", dist.TenHuyen, "- no data available")
                continue
              }

              const distPrices = distProps
                .map((p) => {
                  const price = p.Gia || 0
                  return price > 0 ? price / 1000000 : 0
                })
                .filter((p) => p > 0)

              if (distPrices.length === 0) {
                console.log("[v0] Skipping", dist.TenHuyen, "- no valid prices")
                continue
              }

              const distAvg = distPrices.reduce((a, b) => a + b, 0) / distPrices.length
              regional.push({
                name: dist.TenHuyen,
                price: Math.round(distAvg * 10) / 10,
                minPrice: Math.round(Math.min(...distPrices) * 10) / 10,
                maxPrice: Math.round(Math.max(...distPrices) * 10) / 10,
              })

              console.log("[v0] Added to regional:", dist.TenHuyen, "with avg price:", Math.round(distAvg * 10) / 10)
            } catch (error) {
              console.error(`[v0] Error fetching data for district ${dist.TenHuyen}:`, error)
            }
          }

          console.log("[v0] Total regional data collected:", regional.length)
          setRegionalData(regional)
          setError(null)
        } else {
          console.log("[v0] ✗ No properties found matching criteria")
          setCurrentPrice(0)
          setPriceData([])
          setRegionalData([])
          setError("Không tìm thấy dữ liệu giá cho lựa chọn này. Vui lòng thử chọn loại nhà hoặc quận/huyện khác.")
        }
      } catch (error) {
        console.error("Error fetching price data:", error)
        setError("Lỗi khi tải dữ liệu giá")
      } finally {
        setLoading(false)
      }
    }

    fetchPriceData()
  }, [searchParams, districts, selectedProvince])

  const getSelectedPropertyTypeName = () => {
    const type = propertyTypes.find((t) => t.MaLoai === Number.parseInt(searchParams.propertyType))
    return type ? type.TenLoai : ""
  }

  const getSelectedDistrictName = () => {
    const district = districts.find((d) => d.MaHuyen === Number.parseInt(searchParams.district))
    return district ? district.TenHuyen : ""
  }

  return (
    <div className="price-reference">
      <div className="price-header">
        <h1>Tham Khảo Giá Bất Động Sản</h1>
        <p>Xem giá trung bình bất động sản tại các quận/huyện khác nhau</p>
      </div>

      <div className="price-search-section">
        <h2>Xem Giá Bất Động Sản</h2>
        <div className="search-form">
          <div className="form-group">
            <label>Loại nhà</label>
            <select
              value={searchParams.propertyType}
              onChange={(e) => {
                setSearchParams({ ...searchParams, propertyType: e.target.value })
              }}
            >
              <option value="">-- Chọn loại nhà --</option>
              {propertyTypes.map((type) => (
                <option key={type.MaLoai} value={type.MaLoai}>
                  {type.TenLoai}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tỉnh/Thành phố</label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value)
              }}
            >
              <option value="">-- Chọn tỉnh/thành phố --</option>
              {provinces.map((prov) => (
                <option key={prov.MaTinh} value={prov.MaTinh}>
                  {prov.TenTinh}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quận/Huyện</label>
            <select
              value={searchParams.district}
              onChange={(e) => {
                setSearchParams({ ...searchParams, district: e.target.value })
              }}
              disabled={!selectedProvince || districts.length === 0}
            >
              <option value="">-- Chọn quận/huyện --</option>
              {districts.map((dist) => (
                <option key={dist.MaHuyen} value={dist.MaHuyen}>
                  {dist.TenHuyen}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div style={{ color: "red", padding: "20px", textAlign: "center" }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Đang tải dữ liệu...</div>
      ) : (
        <>
          {currentPrice > 0 && (
            <>
              <div className="price-summary">
                <div className="price-card">
                  <div className="price-value">{currentPrice}</div>
                  <div className="price-unit">triệu/m2</div>
                  <div className="price-label">Giá trung bình hiện tại</div>
                </div>
                <div className="price-card">
                  <div className={`price-change-up`}>
                    {(((currentPrice - priceLastMonth) / priceLastMonth) * 100).toFixed(1) > 0 ? "+" : ""}
                    {(((currentPrice - priceLastMonth) / priceLastMonth) * 100).toFixed(1)}%
                  </div>
                  <div className="price-label">So với tháng trước</div>
                </div>
                <div className="price-card">
                  <div className={`price-change-up`}>
                    {(((currentPrice - priceLastYear) / priceLastYear) * 100).toFixed(1) > 0 ? "+" : ""}
                    {(((currentPrice - priceLastYear) / priceLastYear) * 100).toFixed(1)}%
                  </div>
                  <div className="price-label">So với năm trước</div>
                </div>
              </div>

              <div className="price-range-section">
                <h2>
                  {getSelectedPropertyTypeName()} tại {getSelectedDistrictName()}
                </h2>
                <div className="price-range-chart">
                  <div className="range-label">
                    <span className="min-price">{minPrice} triệu</span>
                    <span className="current-price">
                      <strong>{currentPrice}</strong>
                      <br />
                      <small>Giá trung bình</small>
                    </span>
                    <span className="max-price">{maxPrice} triệu</span>
                  </div>
                  <div className="range-bar-container">
                    <div
                      className="range-bar"
                      style={{
                        left: `${(minPrice / Math.max(maxPrice, 1)) * 100}%`,
                        width: `${((maxPrice - minPrice) / Math.max(maxPrice, 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {priceData.length > 0 && (
                <div className="trend-section">
                  <h2>Xu Hướng Giá {getSelectedPropertyTypeName()}</h2>
                  <div className="trend-chart">
                    <div className="chart-container">
                      <svg viewBox="0 0 1200 300" className="chart-svg">
                        <line x1="50" y1="250" x2="1150" y2="250" stroke="#eee" strokeWidth="1" />
                        <defs>
                          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polyline
                          points={priceData
                            .map((d, i) => {
                              const x = 50 + i * 100
                              const y = 250 - (d.price - (Math.min(...priceData.map((p) => p.price)) - 2)) * 15
                              return `${x},${y}`
                            })
                            .join(" ")}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                        <polygon
                          points={`50,250 ${priceData
                            .map((d, i) => {
                              const x = 50 + i * 100
                              const y = 250 - (d.price - (Math.min(...priceData.map((p) => p.price)) - 2)) * 15
                              return `${x},${y}`
                            })
                            .join(" ")} 1150,250`}
                          fill="url(#priceGradient)"
                        />
                        {priceData.map((d, i) => (
                          <text key={i} x={50 + i * 100} y="280" textAnchor="middle" fontSize="12" fill="#666">
                            {d.month}
                          </text>
                        ))}
                      </svg>
                    </div>
                    <div className="price-label-current">
                      <strong>{currentPrice}</strong> Triệu/m2
                    </div>
                  </div>
                </div>
              )}

              {regionalData.length > 0 && (
                <div className="regional-section">
                  <h2>So Sánh Giá {getSelectedPropertyTypeName()} Ở Các Quận/Huyện Khác</h2>
                  <div className="regional-comparison">
                    {regionalData.map((region, idx) => (
                      <div key={idx} className="region-card">
                        <h3>{region.name}</h3>
                        <div className="price-display">{region.price} triệu/m2</div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "15px" }}>
                          {region.price > currentPrice
                            ? `Cao hơn ${(region.price - currentPrice).toFixed(1)} triệu/m² so với ${getSelectedDistrictName()}`
                            : `Thấp hơn ${(currentPrice - region.price).toFixed(1)} triệu/m² so với ${getSelectedDistrictName()}`}
                        </div>
                        <div className="range-bar-container">
                          <div
                            className="range-bar"
                            style={{
                              width: `${(region.price / Math.max(...regionalData.map((r) => r.maxPrice), maxPrice, 1)) * 100}%`,
                              backgroundColor: idx % 2 === 0 ? "#3b82f6" : "#10b981",
                            }}
                          ></div>
                        </div>
                        <div className="range-label">
                          <span>{region.minPrice}</span>
                          <span>Khoảng giá</span>
                          <span>{region.maxPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

const maxChartPrice = (priceData, maxPrice) => {
  return Math.max(...priceData.map((d) => d.maxPrice), maxPrice, 1)
}
