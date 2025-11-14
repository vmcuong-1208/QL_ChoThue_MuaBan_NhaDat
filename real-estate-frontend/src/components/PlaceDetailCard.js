"use client"

import { useState } from "react"
import "../styles/PlaceDetailCard.css"

export default function PlaceDetailCard({ place, boundaries = [], onClose, onBoundaryClick }) {
  const [activeTab, setActiveTab] = useState("summary")

  if (!place) return null

  const { name = 'Unknown', display_name = 'No display name', address = {}, type = 'Unknown', lat = 0, lng = 0 } = place  // Default values to avoid empty

  return (
    <div className="place-detail-card">
      <div className="detail-header">
        <h3>{name}</h3>
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
            <div className="info-group">
              <div className="info-row">
                <span className="label">Địa chỉ:</span>
                <span className="value">{display_name}</span>
              </div>
              <div className="info-row">
                <span className="label">Loại:</span>
                <span className="value">{type}</span>
              </div>
              <div className="info-row">
                <span className="label">Tọa độ:</span>
                <span className="value">
                  {typeof lat === 'number' ? lat.toFixed(6) : lat}, {typeof lng === 'number' ? lng.toFixed(6) : lng}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "boundaries" && (
          <div className="boundaries-tab">
            {boundaries.length > 0 ? (
              <div className="boundaries-list">
                {boundaries.map((boundary) => (
                  <div key={boundary.id} className="boundary-item">
                    <div className="boundary-info">
                      <div className="boundary-name">{boundary.name}</div>
                      <div className="boundary-type">{boundary.type}</div>
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