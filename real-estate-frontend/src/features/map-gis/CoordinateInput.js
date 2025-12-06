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
    <div className="p-5 space-y-4 bg-white rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-gray-800">
            <span className="text-lg">🗺️</span> Tọa độ VN2000
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Nhập tọa độ các điểm góc từ sổ đỏ hoặc trích lục địa chính
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer"
        >
          <FaInfoCircle /> {showGuide ? "Đóng hướng dẫn" : "Hướng dẫn"}
        </button>
      </div>

      {/* Hướng dẫn - Collapsible */}
      {showGuide && (
        <div className="p-4 space-y-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800">
              Hướng dẫn nhập tọa độ VN2000:
            </h4>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={14} />
            </button>
          </div>
          <ol className="pl-4 space-y-1 text-gray-600 list-decimal">
            <li>
              <strong>Tìm tọa độ từ giấy tờ:</strong> Sổ đỏ, trích đo địa chính, phiếu xác nhận đo đạc thửa đất.
            </li>
            <li>
              <strong>Nhập tọa độ các điểm góc:</strong> Nhập tọa độ X và Y của từng điểm góc theo thứ tự khép góc.
            </li>
            <li>
              <strong>Chọn múi chiếu:</strong> Múi chiếu tự động áp dụng theo Tỉnh/TP bạn chọn ở phần Địa chỉ.
            </li>
            <li>
              <strong>Tính toán:</strong> Bấm "Tính toán & Chuyển đổi" để tính diện tích và vẽ ranh giới thửa đất lên bản đồ.
            </li>
          </ol>
          <p className="p-2 text-slate-700 bg-slate-200/60 rounded border border-slate-300/50">
            <strong>Ví dụ định dạng:</strong> X = 1198542.35, Y = 604123.80 (đơn vị: mét).
          </p>
        </div>
      )}

      {/* Múi chiếu */}
      <div>
        <label className="block mb-1.5 text-xs font-semibold text-gray-700">
          Múi chiếu (Kinh tuyến trục) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={muiChieu}
          readOnly
          className="w-full px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed focus:outline-none"
          placeholder="Sẽ tự động điền khi chọn tỉnh"
        />
        {provinceName && muiChieu ? (
          <div className="flex items-center gap-2 p-2.5 mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="font-bold">✓</span>
            Múi chiếu 3 độ cho {provinceName}: <strong className="font-semibold">{muiChieu}</strong>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 mt-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="font-bold">⚠</span>
            Vui lòng chọn Tỉnh/Thành phố ở phần địa chỉ để tự động điền múi chiếu
          </div>
        )}
      </div>

      {/* Danh sách điểm */}
      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          {/* Table Header */}
          <div className="grid grid-cols-[44px_1fr_1fr_48px] gap-2 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg border border-gray-200">
            <span className="text-center">Điểm</span>
            <span className="pl-1">Tọa độ X (m)</span>
            <span className="pl-1">Tọa độ Y (m)</span>
            <span className="text-center">Xóa</span>
          </div>

          {/* Table Rows */}
          <div className="mt-2 space-y-2">
            {coordinates.map((point, index) => (
              <div
                key={index}
                className="grid grid-cols-[44px_1fr_1fr_48px] gap-2 items-center"
              >
                <span className="flex items-center justify-center w-8 h-8 mx-auto text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-full">
                  {index + 1}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="VD: 1234567.89"
                  value={point.x}
                  onChange={(e) => updatePoint(index, "x", e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-gray-400"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="VD: 567890.12"
                  value={point.y}
                  onChange={(e) => updatePoint(index, "y", e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-gray-400"
                />
                <button
                  type="button"
                  onClick={() => removePoint(index)}
                  className="flex items-center justify-center w-8 h-8 mx-auto text-gray-400 transition-colors border border-gray-200 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 active:bg-red-100 cursor-pointer"
                  title="Xóa điểm"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))}
          </div>

          {coordinates.length === 0 && (
            <div className="py-6 text-xs text-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200 mt-2">
              <FaInfoCircle className="mx-auto mb-1.5 text-2xl text-gray-300" />
              <p>Chưa có điểm nào. Nhấn <strong>"Thêm điểm"</strong> bên dưới để bắt đầu nhập.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={addPoint}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm cursor-pointer"
        >
          <FaPlus size={11} /> Thêm điểm
        </button>
        <button
          type="button"
          onClick={calculateAndConvert}
          disabled={coordinates.length < 3 || !muiChieu}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white transition-colors rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <FaCalculator size={11} /> Tính toán & Chuyển đổi
        </button>
      </div>

      {/* Kết quả */}
      {calculatedArea && (
        <div className="p-3.5 space-y-2 border border-emerald-200 bg-emerald-50/60 rounded-lg animate-scaleIn">
          <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <span>✓</span> Kết quả tính toán thửa đất:
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-white rounded-md border border-emerald-100 shadow-2xs">
              <p className="text-[11px] text-gray-500 font-medium">Diện tích</p>
              <p className="text-sm font-bold text-emerald-700">
                {calculatedArea.toFixed(2)} m²
              </p>
            </div>
            <div className="p-2.5 bg-white rounded-md border border-emerald-100 shadow-2xs">
              <p className="text-[11px] text-gray-500 font-medium">Số điểm</p>
              <p className="text-sm font-bold text-blue-700">
                {wgs84Coordinates.length} điểm
              </p>
            </div>
            <div className="p-2.5 bg-white rounded-md border border-emerald-100 shadow-2xs">
              <p className="text-[11px] text-gray-500 font-medium">Múi chiếu</p>
              <p className="text-sm font-bold text-gray-700">{muiChieu}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinateInput;
