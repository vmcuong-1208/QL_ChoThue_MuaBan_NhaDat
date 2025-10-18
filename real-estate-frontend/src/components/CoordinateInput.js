"use client"

// Component nhập tọa độ VN2000
import { useState, useEffect } from "react"
import { FaPlus, FaTrash, FaInfoCircle, FaCalculator } from "react-icons/fa"
import { vn2000ToWGS84, calculatePolygonArea, getMeridianFromProvinceName } from "../utils/coordinateConverter"
import "../styles/CoordinateInput.css"

const CoordinateInput = ({ value = [], onChange, provinceName = null }) => {
  // State cho các điểm tọa độ
  const [coordinates, setCoordinates] = useState(value || [])
  const [muiChieu, setMuiChieu] = useState("")
  const [showGuide, setShowGuide] = useState(false)
  const [calculatedArea, setCalculatedArea] = useState(null)
  const [wgs84Coordinates, setWgs84Coordinates] = useState([])

  useEffect(() => {
    if (provinceName) {
      const meridian = getMeridianFromProvinceName(provinceName)
      if (meridian) {
        setMuiChieu(meridian)
        console.log("[v0] Đã set múi chiếu:", meridian, "cho tỉnh:", provinceName)
      } else {
        console.warn("[v0] Không tìm thấy múi chiếu cho tỉnh:", provinceName)
      }
    }
  }, [provinceName])

  // Cập nhật parent component khi có thay đổi
  useEffect(() => {
    if (onChange) {
      onChange({
        coordinates,
        muiChieu,
        wgs84Coordinates,
        area: calculatedArea,
      })
    }
  }, [coordinates, muiChieu, wgs84Coordinates, calculatedArea])

  // Thêm điểm mới
  const addPoint = () => {
    setCoordinates([...coordinates, { x: "", y: "" }])
  }

  // Xóa điểm
  const removePoint = (index) => {
    const newCoordinates = coordinates.filter((_, i) => i !== index)
    setCoordinates(newCoordinates)
  }

  // Cập nhật tọa độ điểm
  const updatePoint = (index, field, value) => {
    const newCoordinates = [...coordinates]
    newCoordinates[index][field] = value
    setCoordinates(newCoordinates)
  }

  // Tính toán và chuyển đổi sang WGS84
  const calculateAndConvert = () => {
    if (!muiChieu) {
      alert("Vui lòng chọn múi chiếu!")
      return
    }

    // Kiểm tra tất cả các điểm đã nhập đầy đủ
    const validCoordinates = coordinates.filter((point) => point.x && point.y)

    if (validCoordinates.length < 3) {
      alert("Cần ít nhất 3 điểm để tính diện tích!")
      return
    }

    try {
      // Chuyển đổi sang WGS84
      const wgs84Points = validCoordinates.map((point) => {
        const x = Number.parseFloat(point.x)
        const y = Number.parseFloat(point.y)
        return vn2000ToWGS84(x, y, muiChieu)
      })

      setWgs84Coordinates(wgs84Points)

      // Tính diện tích
      const area = calculatePolygonArea(wgs84Points)
      setCalculatedArea(area)

      alert(`Chuyển đổi thành công!\nĐiện tích: ${area.toFixed(2)} m²`)
    } catch (error) {
      console.error("Lỗi khi chuyển đổi tọa độ:", error)
      alert("Lỗi khi chuyển đổi tọa độ. Vui lòng kiểm tra lại dữ liệu nhập.")
    }
  }

  return (
    <div className="coordinate-input-container">
      <div className="coordinate-header">
        <h3>Tọa độ VN2000</h3>
        <button type="button" className="guide-button" onClick={() => setShowGuide(!showGuide)}>
          <FaInfoCircle /> Hướng dẫn
        </button>
      </div>

      {/* Hướng dẫn */}
      {showGuide && (
        <div className="coordinate-guide">
          <h4>Hướng dẫn nhập tọa độ VN2000:</h4>
          <ol>
            <li>
              <strong>Tìm tọa độ từ giấy tờ:</strong>
              <ul>
                <li>Sổ đỏ (Giấy chứng nhận quyền sử dụng đất)</li>
                <li>Trích đo địa chính</li>
                <li>Phiếu xác nhận đo đạc hiện trạng thửa đất</li>
              </ul>
            </li>
            <li>
              <strong>Nhập tọa độ các điểm góc:</strong> Nhập tọa độ X và Y của từng điểm góc theo thứ tự (theo chiều
              kim đồng hồ hoặc ngược chiều kim đồng hồ)
            </li>
            <li>
              <strong>Chọn múi chiếu:</strong> Múi chiếu sẽ tự động được chọn dựa trên tỉnh/thành phố. Nếu không đúng,
              vui lòng chọn lại theo giấy tờ.
            </li>
            <li>
              <strong>Tính toán:</strong> Click "Tính toán & Chuyển đổi" để chuyển sang tọa độ WGS84 và tính diện tích.
            </li>
          </ol>
          <p className="note">
            <strong>Lưu ý:</strong> Tọa độ VN2000 thường có dạng: X = 1234567.89, Y = 567890.12 (đơn vị: mét)
          </p>
        </div>
      )}

      {/* Chọn múi chiếu */}
      <div className="form-group">
        <label htmlFor="muiChieu">
          Múi chiếu (Kinh tuyến trục) <span className="required">*</span>
        </label>
        <input
          type="text"
          id="muiChieu"
          value={muiChieu}
          readOnly
          className="readonly-input"
          placeholder="Sẽ tự động điền khi chọn tỉnh"
        />
        {provinceName && muiChieu && (
          <div className="form-hint success">
            ✓ Múi chiếu 3 độ cho {provinceName}: {muiChieu}
          </div>
        )}
        {!provinceName && (
          <div className="form-hint warning">
            ⚠ Vui lòng chọn Tỉnh/Thành phố ở phần địa chỉ bên trên để tự động điền múi chiếu
          </div>
        )}
      </div>

      {/* Danh sách các điểm */}
      <div className="coordinates-list">
        <div className="list-header">
          <span>Điểm</span>
          <span>Tọa độ X (m)</span>
          <span>Tọa độ Y (m)</span>
          <span>Thao tác</span>
        </div>

        {coordinates.map((point, index) => (
          <div key={index} className="coordinate-row">
            <span className="point-number">{index + 1}</span>
            <input
              type="number"
              step="0.01"
              placeholder="VD: 1234567.89"
              value={point.x}
              onChange={(e) => updatePoint(index, "x", e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              placeholder="VD: 567890.12"
              value={point.y}
              onChange={(e) => updatePoint(index, "y", e.target.value)}
            />
            <button type="button" className="remove-button" onClick={() => removePoint(index)} title="Xóa điểm">
              <FaTrash />
            </button>
          </div>
        ))}

        {coordinates.length === 0 && (
          <div className="empty-state">
            <p>Chưa có điểm nào. Click "Thêm điểm" để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="coordinate-actions">
        <button type="button" className="add-button" onClick={addPoint}>
          <FaPlus /> Thêm điểm
        </button>
        <button
          type="button"
          className="calculate-button"
          onClick={calculateAndConvert}
          disabled={coordinates.length < 3 || !muiChieu}
        >
          <FaCalculator /> Tính toán & Chuyển đổi
        </button>
      </div>

      {/* Kết quả */}
      {calculatedArea && (
        <div className="calculation-result">
          <h4>Kết quả:</h4>
          <div className="result-item">
            <span>Diện tích:</span>
            <strong>{calculatedArea.toFixed(2)} m²</strong>
          </div>
          <div className="result-item">
            <span>Số điểm:</span>
            <strong>{wgs84Coordinates.length} điểm</strong>
          </div>
          <div className="result-item">
            <span>Múi chiếu:</span>
            <strong>{muiChieu}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoordinateInput
