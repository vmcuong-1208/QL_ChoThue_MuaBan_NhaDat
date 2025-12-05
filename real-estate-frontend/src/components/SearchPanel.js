"use client"

import { useState } from "react"
import { FaTimes, FaSearch, FaMapMarkerAlt } from "react-icons/fa"
import "../styles/SearchPanel.css"

// Debounce helper
const debounce = (func, delay) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), delay)
  }
}

// Retry helper for fetch
const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return response
    } catch (err) {
      console.warn("[v0] Fetch retry attempt", i + 1, "failed:", err)
    }
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  throw new Error("Max retries reached")
}

const SearchPanel = ({ onClose, onSearchCommit, onToggleClickMode, isClickModeActive, onBoundaryAdd }) => {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const debouncedSearch = debounce(async (value) => {
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&countrycodes=vn&limit=5&addressdetails=1`
      const response = await fetchWithRetry(url)
      const data = await response.json()
      setSuggestions(data)
    } catch (err) {
      console.error("[v0] Nominatim search error:", err)
      // Don't set error visible for autocomplete failure to avoid annoyance
      setSuggestions([])
    }
  }, 700)

  const handleInputChange = (value) => {
    setQuery(value)
    setError(null)
    debouncedSearch(value)
  }

  const handleCommit = () => {
    if (!query.trim()) {
      setError("Nhập địa chỉ để tìm")
      return
    }
    onSearchCommit(query)
    setSuggestions([]) // Clear suggestions on commit
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCommit()
    }
  }

  const handleSuggestionClick = (sug) => {
    setQuery(sug.display_name)
    setSuggestions([])
    onSearchCommit(sug.display_name)
  }

  return (
    <div className="search-panel">
      <div className="panel-header">
        <h3>Tìm kiếm</h3>
        <button onClick={onClose} className="close-btn">
          <FaTimes />
        </button>
      </div>

      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập địa chỉ, tọa độ..."
          className="search-input"
        />

        <button
          className={`icon-button ${isClickModeActive ? "active" : ""}`}
          onClick={onToggleClickMode}
          title="Click trên map để chọn vị trí"
          style={{ marginLeft: "8px", padding: "8px" }}
        >
          <FaMapMarkerAlt />
        </button>

        <FaSearch className="search-icon" onClick={handleCommit} style={{ cursor: "pointer", marginLeft: "8px" }} />
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((sug, idx) => (
            <div key={idx} className="suggestion-item" onClick={() => handleSuggestionClick(sug)}>
              <FaSearch className="suggestion-icon" />
              <div className="suggestion-text">
                <strong>{sug.display_name}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchPanel
