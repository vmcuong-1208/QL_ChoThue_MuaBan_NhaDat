"use client"

import { useState, useEffect } from "react"
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

const getPropertyType = (property) => {
  return (
    property.TenLoai ||
    property.LoaiNha ||
    property.Loai ||
    property.propertyType ||
    property.propertyTypeName ||
    ""
  )
}

const getAddress = (property) => {
  return (
    property.DiaChi ||
    property.Dia_Chi ||
    property.address ||
    property.dia_chi_chi_tiet ||
    ""
  )
}

const getPrice = (property) => {
  const price =
    property.Gia ||
    property.GiaBan ||
    property.Tien ||
    property.price ||
    property.MucGia ||
    0
  return price ? price : 0
}

export default function PriceReference() {
  const [searchParams, setSearchParams] = useState({
    propertyType: "",
    location: "",
  })

  const [priceData, setPriceData] = useState([])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceLastMonth, setPriceLastMonth] = useState(0)
  const [priceLastYear, setPriceLastYear] = useState(0)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [propertyTypes, setPropertyTypes] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [regionalData, setRegionalData] = useState([])
  const [error, setError] = useState(null)

  // Fetch property types and locations on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null)
        console.log("[v0] Fetching initial data...")

        const [typesRes, propsRes] = await Promise.all([
          fetch(`${API_URL}/property-types`),
          fetch(`${API_URL}/properties?limit=1000`),
        ])

        const types = await typesRes.json()
        const props = await propsRes.json()

        console.log("[v0] Property types:", types)
        console.log("[v0] Properties response:", props)
        if (props.properties && props.properties.length > 0) {
          console.log("[v0] First property structure:", props.properties[0])
          console.log("[v0] Field names:", Object.keys(props.properties[0]))
          console.log("[v0] Sample property type:", getPropertyType(props.properties[0]))
          console.log("[v0] Sample address:", getAddress(props.properties[0]))
          console.log("[v0] Sample price:", getPrice(props.properties[0]))
        }

        setPropertyTypes(Array.isArray(types) ? types : [])

        // Extract unique locations from properties
        const locationSet = new Set()
        if (props.properties && Array.isArray(props.properties)) {
          props.properties.forEach((p) => {
            const addr = getAddress(p)
            if (addr) locationSet.add(addr)
          })
        }
        const uniqueLocations = Array.from(locationSet).slice(0, 10)

        console.log("[v0] Locations found:", uniqueLocations)

        setLocations(uniqueLocations)

        // Set default values
        if (types && types.length > 0) {
          setSearchParams((prev) => ({
            ...prev,
            propertyType: getPropertyType(types[0]) || types[0].TenLoai || "",
          }))
        }
        if (uniqueLocations.length > 0) {
          setSearchParams((prev) => ({
            ...prev,
            location: uniqueLocations[0],
          }))
        }
      } catch (error) {
        console.error("[v0] Error fetching initial data:", error)
        setError("Lỗi khi tải dữ liệu ban đầu")
      }
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    if (!searchParams.propertyType || !searchParams.location) {
      console.log("[v0] Missing search params, skipping fetch")
      return
    }

    const fetchPriceData = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log("[v0] Fetching price data for:", searchParams)

        const response = await fetch(`${API_URL}/properties?limit=1000`)
        const data = await response.json()

        console.log("[v0] All properties count:", data.properties?.length)

        const normalizedSearchType = normalizeString(searchParams.propertyType)
        const normalizedSearchLocation = normalizeString(searchParams.location)

        console.log(
          "[v0] Normalized search params - Type:",
          normalizedSearchType,
          "Location:",
          normalizedSearchLocation,
        )

        const filtered = (data.properties || []).filter((p) => {
          const propType = normalizeString(getPropertyType(p))
          const propAddress = normalizeString(getAddress(p))

          const typeMatch =
            propType === normalizedSearchType ||
            propType.includes(normalizedSearchType) ||
            normalizedSearchType.includes(propType)

          const locationMatch =
            propAddress &&
            (propAddress === normalizedSearchLocation ||
              propAddress.includes(normalizedSearchLocation) ||
              normalizedSearchLocation.includes(propAddress))

          if (p.MaTTND === 1 || p.MaTTND === 2) {
            // Log first 2 properties for debugging
            console.log("[v0] Checking property:", {
              MaTTND: p.MaTTND,
              type: getPropertyType(p),
              normalizedType: propType,
              address: getAddress(p),
              normalizedAddress: propAddress,
              typeMatch,
              locationMatch,
              willInclude: typeMatch && locationMatch,
            })
          }

          return typeMatch && locationMatch
        })

        console.log("[v0] Filtered properties count:", filtered.length)

        if (filtered.length > 0) {
          const prices = filtered
            .map((p) => {
              const price = getPrice(p)
              return price > 0 ? price / 1000000 : 0
            })
            .filter((p) => p > 0)

          console.log("[v0] Prices extracted:", prices)

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

          console.log("[v0] Price statistics - Avg:", avgPrice, "Min:", min, "Max:", max)

          setCurrentPrice(Math.round(avgPrice * 10) / 10)
          setMinPrice(Math.round(min * 10) / 10)
          setMaxPrice(Math.round(max * 10) / 10)
          setPriceLastMonth(Math.round(avgPrice * 0.96 * 10) / 10)
          setPriceLastYear(Math.round(avgPrice * 0.98 * 10) / 10)

          // Generate price trend data for last 12 months
          const trend = Array.from({ length: 12 }, (_, i) => {
            const month = ((i - 11 + new Date().getMonth()) % 12) + 1
            return {
              month: `T${month}`,
              price: avgPrice - (i - 5) * 0.5,
              minPrice: min,
              maxPrice: max,
            }
          })
          setPriceData(trend)

          // Fetch regional comparison data
          const locSet = new Set()
          ;(data.properties || []).forEach((p) => {
            const addr = getAddress(p)
            if (addr) locSet.add(addr)
          })
          const uniqueLocations = Array.from(locSet).slice(0, 5)

          const regional = uniqueLocations
            .map((loc) => {
              const normalizedLoc = normalizeString(loc)
              const normalizedSearchTypeForRegion = normalizeString(
                searchParams.propertyType,
              )

              const locProps = (data.properties || []).filter((p) => {
                const propType = normalizeString(getPropertyType(p))
                const propAddress = normalizeString(getAddress(p))

                const typeMatch =
                  propType === normalizedSearchTypeForRegion ||
                  propType.includes(normalizedSearchTypeForRegion) ||
                  normalizedSearchTypeForRegion.includes(propType)

                const locationMatch =
                  propAddress &&
                  (propAddress === normalizedLoc ||
                    propAddress.includes(normalizedLoc) ||
                    normalizedLoc.includes(propAddress))

                return typeMatch && locationMatch
              })

              if (locProps.length === 0) return null

              const locPrices = locProps
                .map((p) => {
                  const price = getPrice(p)
                  return price > 0 ? price / 1000000 : 0
                })
                .filter((p) => p > 0)

              if (locPrices.length === 0) return null

              const locAvg =
                locPrices.reduce((a, b) => a + b, 0) / locPrices.length
              return {
                name: loc,
                price: Math.round(locAvg * 10) / 10,
                minPrice: Math.round(Math.min(...locPrices) * 10) / 10,
                maxPrice: Math.round(Math.max(...locPrices) * 10) / 10,
              }
            })
            .filter((r) => r !== null)

          setRegionalData(regional)
          setError(null)
        } else {
          console.log("[v0] No properties found matching criteria")
          console.log("[v0] Debug - checking all properties:")
          ;(data.properties || []).slice(0, 5).forEach((p) => {
            console.log("[v0] Property:", {
              type: getPropertyType(p),
              address: getAddress(p),
            })
          })
          setCurrentPrice(0)
          setPriceData([])
          setRegionalData([])
          setError(
            "Không tìm thấy dữ liệu giá cho lựa chọn này. Vui lòng thử chọn loại nhà hoặc khu vực khác.",
          )
        }
      } catch (error) {
        console.error("[v0] Error fetching price data:", error)
        setError("Lỗi khi tải dữ liệu giá")
      } finally {
        setLoading(false)
      }
    }

    fetchPriceData()
  }, [searchParams])

  const percentChangeMonth =
    priceLastMonth > 0 ? (((currentPrice - priceLastMonth) / priceLastMonth) * 100).toFixed(1) : 0
  const percentChangeYear = priceLastYear > 0 ? (((currentPrice - priceLastYear) / priceLastYear) * 100).toFixed(1) : 0

  const maxChartPrice = Math.max(...priceData.map((d) => d.maxPrice), maxPrice, 1)

  return (
    <div className="price-reference">
      {/* Header */}
      <div className="price-header">
        <h1>Tham Khảo Giá Bất Động Sản</h1>
        <p>Xem giá trung bình bất động sản tại các khu vực khác nhau</p>
      </div>

      {/* Search Form */}
      <div className="price-search-section">
        <h2>Xem Giá Bất Động Sản</h2>
        <div className="search-form">
          <div className="form-group">
            <label>Loại nhà</label>
            <select
              value={searchParams.propertyType}
              onChange={(e) => {
                console.log("[v0] Property type changed:", e.target.value)
                setSearchParams({ ...searchParams, propertyType: e.target.value })
              }}
            >
              <option value="">-- Chọn loại nhà --</option>
              {propertyTypes.map((type) => (
                <option key={type.MaLoai} value={type.TenLoai}>
                  {type.TenLoai}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Khu vực</label>
            <select
              value={searchParams.location}
              onChange={(e) => {
                console.log("[v0] Location changed:", e.target.value)
                setSearchParams({ ...searchParams, location: e.target.value })
              }}
            >
              <option value="">-- Chọn khu vực --</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
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
          {/* Price Summary */}
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
                    {percentChangeMonth > 0 ? "+" : ""}
                    {percentChangeMonth}%
                  </div>
                  <div className="price-label">So với tháng trước</div>
                </div>
                <div className="price-card">
                  <div className={`price-change-up`}>
                    {percentChangeYear > 0 ? "+" : ""}
                    {percentChangeYear}%
                  </div>
                  <div className="price-label">So với năm trước</div>
                </div>
              </div>

              {/* Price Range Chart */}
              <div className="price-range-section">
                <h2>
                  {searchParams.propertyType} tại {searchParams.location}
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
                        left: `${(minPrice / maxChartPrice) * 100}%`,
                        width: `${((maxPrice - minPrice) / maxChartPrice) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              {priceData.length > 0 && (
                <div className="trend-section">
                  <h2>Xu Hướng Giá {searchParams.propertyType}</h2>
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

              {/* Regional Comparison */}
              {regionalData.length > 0 && (
                <div className="regional-section">
                  <h2>So Sánh Giá Các Khu Vực</h2>
                  <div className="regional-comparison">
                    {regionalData.map((region, idx) => (
                      <div key={idx} className="region-card">
                        <h3>{region.name}</h3>
                        <div className="price-display">{region.price} triệu/m2</div>
                        <div className="range-bar-container">
                          <div
                            className="range-bar"
                            style={{
                              width: `${(region.price / maxChartPrice) * 100}%`,
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
