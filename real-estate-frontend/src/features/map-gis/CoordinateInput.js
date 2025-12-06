"use client";

import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaInfoCircle,
  FaCalculator,
  FaTimes,
} from "react-icons/fa";
import {
  vn2000ToWGS84,
  calculatePolygonArea,
  getMeridianFromProvinceName,
} from "../../utils/coordinateConverter";

const CoordinateInput = ({ value = [], onChange, provinceName = null }) => {
  const [coordinates, setCoordinates] = useState(value || []);
  const [muiChieu, setMuiChieu] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [calculatedArea, setCalculatedArea] = useState(null);
  const [wgs84Coordinates, setWgs84Coordinates] = useState([]);

  useEffect(() => {
    if (provinceName) {
      const meridian = getMeridianFromProvinceName(provinceName);
      if (meridian) {
        setMuiChieu(meridian);
        console.log(
          "[CoordinateInput] Set múi chiếu:",
          meridian,
          "cho tỉnh:",
          provinceName
        );
      } else {
        console.warn(
          "[CoordinateInput] Không tìm thấy múi chiếu cho tỉnh:",
          provinceName
        );
      }
    }
  }, [provinceName]);

  useEffect(() => {
    if (onChange) {
      onChange({
        coordinates,
        muiChieu,
        wgs84Coordinates,
        area: calculatedArea,
      });
    }
  }, [coordinates, muiChieu, wgs84Coordinates, calculatedArea]);

  const addPoint = () => {
    setCoordinates([...coordinates, { x: "", y: "" }]);
  };

  const removePoint = (index) => {
    const newCoordinates = coordinates.filter((_, i) => i !== index);
    setCoordinates(newCoordinates);
  };

  const updatePoint = (index, field, value) => {
    const newCoordinates = [...coordinates];
    newCoordinates[index][field] = value;
    setCoordinates(newCoordinates);
  };

  const calculateAndConvert = () => {
    if (!muiChieu) {
      alert("Vui lòng chọn múi chiếu!");
      return;
    }

    const validCoordinates = coordinates.filter((point) => point.x && point.y);

    if (validCoordinates.length < 3) {
      alert("Cần ít nhất 3 điểm để tính diện tích!");
      return;
    }

    try {
      const wgs84Points = validCoordinates.map((point) => {
        const x = parseFloat(point.x);
        const y = parseFloat(point.y);
        return vn2000ToWGS84(x, y, muiChieu);
      });

      setWgs84Coordinates(wgs84Points);

      const area = calculatePolygonArea(wgs84Points);
      setCalculatedArea(area);

      alert(`Chuyển đổi thành công!\nĐiện tích: ${area.toFixed(2)} m²`);
    } catch (error) {
      console.error("Lỗi khi chuyển đổi tọa độ:", error);
      alert("Lỗi khi chuyển đổi tọa độ. Vui lòng kiểm tra lại dữ liệu nhập.");
    }
  };

  return (
    <div className="p-6 space-y-6 transition-all duration-300 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Tọa độ VN2000</h3>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-purple-600 transition-all border-2 border-purple-300 rounded-lg hover:bg-purple-50 hover:scale-105 active:scale-95"
        >
          <FaInfoCircle /> {showGuide ? "Ẩn hướng dẫn" : "Hướng dẫn"}
        </button>
      </div>

      {/* Hướng dẫn - Collapsible */}
      {showGuide && (
        <div className="p-5 space-y-3 transition-all border-l-4 border-purple-500 bg-purple-50 rounded-r-xl animate-slideInLeft">
          <div className="flex items-start justify-between">
            <h4 className="text-lg font-bold text-purple-800">
              Hướng dẫn nhập tọa độ VN2000:
            </h4>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-purple-600 transition-all hover:text-purple-800 hover:scale-110"
            >
              <FaTimes size={20} />
            </button>
          </div>
          <ol className="pl-5 space-y-2 text-sm text-gray-700 list-decimal">
            <li>
              <strong>Tìm tọa độ từ giấy tờ:</strong>
              <ul className="pl-5 mt-1 space-y-1 list-disc">
                <li>Sổ đỏ (Giấy chứng nhận quyền sử dụng đất)</li>
                <li>Trích đo địa chính</li>
                <li>Phiếu xác nhận đo đạc hiện trạng thửa đất</li>
              </ul>
            </li>
            <li>
              <strong>Nhập tọa độ các điểm góc:</strong> Nhập tọa độ X và Y của
              từng điểm góc theo thứ tự
            </li>
            <li>
              <strong>Chọn múi chiếu:</strong> Múi chiếu sẽ tự động được chọn
              dựa trên tỉnh/thành phố
            </li>
            <li>
              <strong>Tính toán:</strong> Click "Tính toán & Chuyển đổi" để
              chuyển sang WGS84 và tính diện tích
            </li>
          </ol>
          <p className="p-3 text-xs text-yellow-800 bg-yellow-100 border-l-4 border-yellow-500 rounded-r-lg">
            <strong>Lưu ý:</strong> Tọa độ VN2000 thường có dạng: X =
            1234567.89, Y = 567890.12 (đơn vị: mét)
          </p>
        </div>
      )}

      {/* Múi chiếu */}
      <div>
        <label className="block mb-2 text-sm font-bold text-gray-700">
          Múi chiếu (Kinh tuyến trục) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={muiChieu}
          readOnly
          className="w-full px-4 py-3 font-medium text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-lg cursor-not-allowed focus:outline-none"
          placeholder="Sẽ tự động điền khi chọn tỉnh"
        />
        {provinceName && muiChieu && (
          <div className="flex items-center gap-2 p-3 mt-2 text-sm text-green-700 bg-green-100 border-l-4 border-green-500 rounded-r-lg animate-fadeIn">
            <span className="font-bold">✓</span>
            Múi chiếu 3 độ cho {provinceName}: {muiChieu}
          </div>
        )}
        {!provinceName && (
          <div className="flex items-center gap-2 p-3 mt-2 text-sm font-medium text-orange-700 bg-orange-100 border-l-4 border-orange-500 rounded-r-lg">
            <span className="font-bold">⚠</span>
            Vui lòng chọn Tỉnh/Thành phố ở phần địa chỉ để tự động điền múi
            chiếu
          </div>
        )}
      </div>

      {/* Danh sách điểm */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[60px_1fr_1fr_80px] gap-2 p-3 mb-2 text-sm font-bold text-gray-700 bg-purple-100 rounded-lg">
          <span>Điểm</span>
          <span>Tọa độ X (m)</span>
          <span>Tọa độ Y (m)</span>
          <span className="text-center">Thao tác</span>
        </div>

        <div className="space-y-2">
          {coordinates.map((point, index) => (
            <div
              key={index}
              className="grid grid-cols-[60px_1fr_1fr_80px] gap-2 items-center transition-all duration-200 animate-fadeInUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-purple-600 rounded-full">
                {index + 1}
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="VD: 1234567.89"
                value={point.x}
                onChange={(e) => updatePoint(index, "x", e.target.value)}
                className="px-4 py-2 font-medium text-gray-700 transition-all border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-purple-400"
              />
              <input
                type="number"
                step="0.01"
                placeholder="VD: 567890.12"
                value={point.y}
                onChange={(e) => updatePoint(index, "y", e.target.value)}
                className="px-4 py-2 font-medium text-gray-700 transition-all border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-purple-400"
              />
              <button
                type="button"
                onClick={() => removePoint(index)}
                className="flex items-center justify-center px-3 py-2 text-white transition-all bg-red-500 rounded-lg hover:bg-red-600 hover:scale-110 active:scale-95"
                title="Xóa điểm"
              >
                <FaTrash size={14} />
              </button>
            </div>
          ))}
        </div>

        {coordinates.length === 0 && (
          <div className="py-8 font-medium text-center text-gray-400 animate-fadeIn">
            <FaInfoCircle className="mx-auto mb-2 text-4xl" />
            <p>Chưa có điểm nào. Click "Thêm điểm" để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          onClick={addPoint}
          className="flex items-center justify-center flex-1 gap-2 px-6 py-3 text-sm font-bold text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <FaPlus /> Thêm điểm
        </button>
        <button
          type="button"
          onClick={calculateAndConvert}
          disabled={coordinates.length < 3 || !muiChieu}
          className="flex items-center justify-center flex-1 gap-2 px-6 py-3 text-sm font-bold text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <FaCalculator /> Tính toán & Chuyển đổi
        </button>
      </div>

      {/* Kết quả */}
      {calculatedArea && (
        <div className="p-5 space-y-3 transition-all border-l-4 border-green-500 bg-green-50 rounded-r-xl animate-scaleIn">
          <h4 className="text-lg font-bold text-green-800">
            ✓ Kết quả tính toán:
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="p-4 transition-all bg-white rounded-lg shadow-sm hover:shadow-md">
              <p className="text-xs text-gray-600">Diện tích</p>
              <p className="text-2xl font-bold text-green-600">
                {calculatedArea.toFixed(2)} m²
              </p>
            </div>
            <div className="p-4 transition-all bg-white rounded-lg shadow-sm hover:shadow-md">
              <p className="text-xs text-gray-600">Số điểm</p>
              <p className="text-2xl font-bold text-blue-600">
                {wgs84Coordinates.length} điểm
              </p>
            </div>
            <div className="p-4 transition-all bg-white rounded-lg shadow-sm hover:shadow-md">
              <p className="text-xs text-gray-600">Múi chiếu</p>
              <p className="text-2xl font-bold text-purple-600">{muiChieu}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinateInput;
