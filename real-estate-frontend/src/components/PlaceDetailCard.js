"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/PlaceDetailCard.css"

export default function PlaceDetailCard({
  place,
  boundaries = [],
  propertySummary,
  relatedProperties = [],
  onClose,
  onBoundaryClick,
  calculatedArea = 0,
}) {
  const [activeTab, setActiveTab] = useState("summary")
  const navigate = useNavigate()

  if (!place && !propertySummary) return null

  const isProperty = !!propertySummary
  const title = isProperty ? propertySummary.TieuDe : place?.name || "Địa điểm đã chọn"
  const address = isProperty ? propertySummary.DiaChi : place?.display_name || ""

  const handleViewDetail = (propertyId) => {
    navigate(`/bat-dong-san/${propertyId}`)
  }

  return (
    <div className="place-detail-card">
      <div className="detail-header">
        <h3>{title}</h3>
        <button className="detail-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="detail-tabs">
        <button
          className={`tab-btn ${activeTab === "summary" ? "active" : ""}`}
          onClick={() => setActiveTab("summary")}
        >
          Tổng quan
        </button>
        <button
          className={`tab-btn ${activeTab === "boundaries" ? "active" : ""}`}
          onClick={() => setActiveTab("boundaries")}
        >
          Ranh giới ({boundaries.length})
        </button>
      </div>

      <div className="detail-content">
        {activeTab === "summary" && (
          <div className="summary-tab">
            {isProperty ? (
              <div className="property-info">
                {propertySummary.HinhAnh && propertySummary.HinhAnh.length > 0 && (
                  <img
                    src={propertySummary.HinhAnh[0] || "/placeholder.svg"}
                    alt={propertySummary.TieuDe}
                    className="property-thumbnail"
                    style={{ width: "100%", height: "150px", objectFit: "cover", marginBottom: "10px" }}
                  />
                )}
                <div className="info-group">
                  <div className="info-row">
                    <span className="label">Giá:</span>
                    <span className="value price">
                      {propertySummary.Gia ? `${propertySummary.Gia.toLocaleString()} VNĐ` : "Thỏa thuận"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Diện tích:</span>
                    <span className="value">{propertySummary.DienTich} m²</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Trạng thái:</span>
                    <span className="value">{propertySummary.TrangThai}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Địa chỉ:</span>
                    <span className="value">{address}</span>
                  </div>
                  <button
                    className="view-detail-btn"
                    style={{
                      marginTop: "10px",
                      width: "100%",
                      padding: "10px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                    onClick={() => handleViewDetail(propertySummary.MaTTND)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ) : (
              <div className="info-group">
                <div className="info-row">
                  <span className="label">Địa chỉ:</span>
                  <span className="value">{address}</span>
                </div>
                <div className="info-row">
                  <span className="label">Loại:</span>
                  <span className="value">{place?.type || "Unknown"}</span>
                </div>
                <div className="info-row">
                  <span className="label">Tọa độ:</span>
                  <span className="value">
                    {place?.lat ? Number(place.lat).toFixed(6) : ""}, {place?.lng ? Number(place.lng).toFixed(6) : ""}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Diện tích vùng:</span>
                  <span className="value">
                    {calculatedArea
                      ? calculatedArea > 1000000
                        ? `${(calculatedArea / 1000000).toFixed(2)} km²`
                        : `${Math.round(calculatedArea).toLocaleString()} m²`
                      : "Đang tính..."}
                  </span>
                </div>
              </div>
            )}

            {relatedProperties.length > 0 && (
              <div
                className="related-properties-section"
                style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "10px" }}
              >
                <h4>Bất động sản liên quan ({relatedProperties.length})</h4>
                <div className="related-list">
                  {relatedProperties.map((prop) => (
                    <div
                      key={prop.MaTTND}
                      className="related-item"
                      style={{
                        marginBottom: "8px",
                        padding: "8px",
                        background: "#f9f9f9",
                        cursor: "pointer",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0",
                      }}
                      onClick={() => onBoundaryClick && onBoundaryClick(prop)}
                    >
                      <div style={{ fontWeight: "bold", fontSize: "0.9em", marginBottom: "4px" }}>{prop.TieuDe}</div>
                      <div style={{ fontSize: "0.8em", color: "#666", marginBottom: "6px" }}>
                        {prop.Gia ? `${Number(prop.Gia).toLocaleString()} VNĐ` : "Thỏa thuận"} - {prop.DienTich} m²
                      </div>
                      <button
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          fontSize: "0.75em",
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetail(prop.MaTTND)
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "boundaries" && (
          <div className="boundaries-tab">
            {boundaries.length > 0 ? (
              <div className="boundaries-list">
                {boundaries.map((boundary, index) => (
                  <div key={boundary.id || index} className="boundary-item">
                    <div className="boundary-info">
                      <div className="boundary-name">{boundary.name}</div>
                      <div className="boundary-type">{boundary.type || `Level ${boundary.level}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-boundaries">Không tìm thấy ranh giới</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
