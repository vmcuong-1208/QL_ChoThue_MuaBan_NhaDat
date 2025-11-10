"use client"

import { useState, useEffect } from "react"
import { FaTimes, FaSearch, FaSpinner } from "react-icons/fa"
import { normalizeVietnamese } from "../utils/textNormalizer"
import "../styles/SearchPanel.css"

const SearchPanel = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [selectedChips, setSelectedChips] = useState([])
  const [sortedData, setSortedData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadSortedData = async () => {
      try {
        setLoading(true)
        const response = await fetch("/data/sorted.json")
        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu tìm kiếm")
        }
        const data = await response.json()
        setSortedData(data)
        setError(null)
      } catch (err) {
        console.error("[v0] Error loading sorted.json:", err)
        setError("Lỗi khi tải dữ liệu")
        setSortedData(null)
      } finally {
        setLoading(false)
      }
    }
    loadSortedData()
  }, [])

  const parseQueryForBoundaries = (q) => {
    if (!sortedData || !q.trim()) return []

    const normalizedQuery = normalizeVietnamese(q)
    const results = []
    const seen = new Set() 

    // Duyệt qua dữ liệu: sortedData = [ [Level 1 Item], [Level 1 Item], ... ]
    sortedData.forEach((level1Item) => {
        // Cấu trúc: [level1Id, level1Name, level1Type, level1Romanized, level2s[]]
        const [level1Id, level1Name, level1Type, level1Romanized, level2s] = level1Item
        
        // **********************************************
        // 1. TÌM KIẾM LEVEL 1 (TỈNH/THÀNH PHỐ)
        // **********************************************
        const normalizedLevel1Name = normalizeVietnamese(level1Name)
        if (normalizedLevel1Name.includes(normalizedQuery)) {
            const key = `level1-${level1Id}`
            if (!seen.has(key)) {
                seen.add(key)
                results.push({
                    id: level1Id, 
                    name: level1Name,
                    type: level1Type,
                    level: "level1",
                    level1_id: level1Id,
                    level2_id: null, // Bắt buộc phải là null khi là Level 1
                })
            }
        }
        
        // **********************************************
        // 2. DUYỆT LEVEL 2 VÀ LEVEL 3
        // **********************************************
        if (Array.isArray(level2s)) {
            level2s.forEach((level2Item) => {
                // Cấu trúc: [level2InternalId, level2Name, level2Type, level2Romanized, level3s[]]
                const [level2InternalId, level2Name, level2Type, level2Romanized, level3s] = level2Item
                
                // **TÌM KIẾM LEVEL 2 (HUYỆN/QUẬN)**
                const normalizedLevel2Name = normalizeVietnamese(level2Name)
                if (normalizedLevel2Name.includes(normalizedQuery)) {
                    // ID key sử dụng ID nội bộ của Level 2 (ví dụ: '760')
                    const key = `level2-${level2InternalId}` 
                    if (!seen.has(key)) {
                        seen.add(key)
                        results.push({
                            id: level2InternalId, // ID nội bộ: '760'
                            name: level2Name,
                            type: level2Type,
                            level: "level2",
                            level1_id: level1Id, // 79
                            level2_id: level2InternalId, // 760
                        })
                    }
                }

                // **TÌM KIẾM LEVEL 3 (XÃ/PHƯỜNG)**
                if (Array.isArray(level3s)) {
                    level3s.forEach((level3) => {
                        // Cấu trúc level3 là: [level3Id, level3Name, level3Type]
                        const [level3Id, level3Name, level3Type] = level3
                        const normalizedLevel3Name = normalizeVietnamese(level3Name)
                        
                        if (normalizedLevel3Name.includes(normalizedQuery)) {
                            // Tạo key duy nhất
                            const key = `level3-${level1Id}-${level2InternalId}-${level3Name}` 
                            if (!seen.has(key)) {
                                seen.add(key)
                                results.push({
                                    id: key, 
                                    name: level3Name,
                                    type: level3Type,
                                    level: "level3",
                                    level1_id: level1Id,           // Tỉnh: 79 (để tải file)
                                    level2_id: level2InternalId,   // Huyện/Quận: 760 (để tìm ranh)
                                    level3Name: level3Name,        // Tên xã/phường (để lọc GeoJSON)
                                })
                            }
                        }
                    })
                }
            })
        }
    })

    return results.slice(0, 10)
  }

  const handleInputChange = (value) => {
    setQuery(value)
    setError(null)

    if (!value.trim() || !sortedData) {
      setSuggestions([])
      return
    }

    const boundaries = parseQueryForBoundaries(value)
    setSuggestions(boundaries)
  }

  const handleSuggestionClick = (suggestion) => {
    if (!selectedChips.find((c) => c.id === suggestion.id)) {
      setSelectedChips([...selectedChips, suggestion])
    }

    setQuery("")
    setSuggestions([])
  }

  const handleRemoveChip = (chipId) => {
    const updatedChips = selectedChips.filter((c) => c.id !== chipId)
    setSelectedChips(updatedChips)

    // Callback để xóa ranh từ map
    if (updatedChips.length === 0) {
      console.log("[v0] All chips removed")
    }
  }

  const handleEnter = () => {
    if (selectedChips.length === 0 && !query.trim()) {
      setError("Chọn ít nhất 1 ranh giới hoặc gõ tên")
      return
    }

    // Gửi tất cả chips
    selectedChips.forEach((chip) => {
        if (onSelect) {
            // Truyền đầy đủ Level 1 ID và Level 2 ID
            onSelect({
                id: chip.id,
                name: chip.name,
                type: chip.type,
                level: chip.level,
                
                // **THÔNG TIN QUAN TRỌNG CHO GoogleMapComponent.js**
                level1_id: chip.level1_id,
                level2_id: chip.level2_id || null, // Có thể là null nếu là Level 1 (nếu có)
                
                // Nếu là Level 3, GoogleMapComponent sẽ cần chip.name để lọc GeoJSON
            })
        }
    })

    setSelectedChips([])
    setQuery("")
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleEnter()
    }
  }

  return (
    <div className="search-panel">
      <div className="panel-header">
        <h3>Tìm kiếm ranh giới</h3>
      </div>

      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="VD: Hồ Chí Minh, Lái Thiêu..."
          className="search-input"
          disabled={loading}
        />
      </div>

      {/* Chips */}
      {selectedChips.length > 0 && (
        <div className="chips-container">
          {selectedChips.map((chip) => (
            <div key={chip.id} className="chip">
              <span>{chip.name}</span>
              <button className="chip-close" onClick={() => handleRemoveChip(chip.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-message">⚠️ {error}</div>}
      {loading && (
        <div className="loading-message">
          <FaSpinner className="spin-icon" /> Đang tải...
        </div>
      )}

      {suggestions.length > 0 && !loading && (
        <div className="suggestions">
          {suggestions.map((sug, idx) => (
            <div key={idx} className="suggestion-item" onClick={() => handleSuggestionClick(sug)}>
              <FaSearch className="suggestion-icon" />
              <div className="suggestion-text">
                <strong>{sug.name}</strong>
                <span className="suggestion-type">({sug.type})</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedChips.length > 0 && (
        <button className="search-button" onClick={handleEnter}>
          Tìm kiếm ({selectedChips.length})
        </button>
      )}
    </div>
  )
}

export default SearchPanel
