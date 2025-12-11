"use client";

import { useMemo } from "react";
import {
  FaRuler,
  FaDrawPolygon,
  FaUndo,
  FaTrashAlt,
  FaTimes,
  FaInfoCircle,
  FaVectorSquare,
  FaRoute,
} from "react-icons/fa";
import {
  calculatePolylineDistance,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  calculateGeodesicDistance,
  formatMeasureDistance,
  formatMeasureArea,
} from "./measurementUtils";

const MeasurementPanel = ({
  measureType = "distance", // "distance" | "area"
  setMeasureType,
  measurementPoints = [],
  onUndo,
  onClear,
  onClose,
}) => {
  // 1. Tính toán số liệu theo thời gian thực
  const totalDistance = useMemo(() => {
    return calculatePolylineDistance(measurementPoints);
  }, [measurementPoints]);

  const polygonArea = useMemo(() => {
    if (measureType !== "area" || measurementPoints.length < 3) return 0;
    return calculatePolygonArea(measurementPoints);
  }, [measureType, measurementPoints]);

  const polygonPerimeter = useMemo(() => {
    if (measurementPoints.length < 2) return 0;
    return calculatePolygonPerimeter(measurementPoints);
  }, [measurementPoints]);

  // 2. Chi tiết từng cạnh
  const segments = useMemo(() => {
    if (!measurementPoints || measurementPoints.length < 2) return [];
    const list = [];
    const count =
      measureType === "area" && measurementPoints.length >= 3
        ? measurementPoints.length
        : measurementPoints.length - 1;

    for (let i = 0; i < count; i++) {
      const p1 = measurementPoints[i];
      const p2 = measurementPoints[(i + 1) % measurementPoints.length];
      const dist = calculateGeodesicDistance(p1, p2);
      const isClosing = i === measurementPoints.length - 1 && measureType === "area";
      list.push({
        id: i,
        label: isClosing
          ? `Cạnh khép góc: Điểm ${i + 1} ➡️ Điểm 1`
          : `Đoạn ${i + 1}: Điểm ${i + 1} ➡️ Điểm ${i + 2}`,
        distance: dist,
        formatted: formatMeasureDistance(dist),
      });
    }
    return list;
  }, [measurementPoints, measureType]);

  const areaInfo = useMemo(() => {
    return formatMeasureArea(polygonArea);
  }, [polygonArea]);

  return (
    <div
      className="fixed top-20 right-4 z-40 w-full max-w-sm transition-all duration-300 animate-slideInRight"
      style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
    >
      <div className="overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-200">
        {/* Header */}
        <div className="relative px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full shadow-inner">
                {measureType === "area" ? (
                  <FaDrawPolygon className="text-sm text-white" />
                ) : (
                  <FaRuler className="text-sm text-white" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black flex items-center gap-1.5">
                  <span>Thước Đo Bản Đồ</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-extrabold uppercase">
                    GIS
                  </span>
                </h3>
                <p className="text-[10.5px] text-amber-100 font-medium">
                  {measureType === "area"
                    ? "Đo diện tích & chu vi đa giác"
                    : "Đo chiều dài đường gấp khúc"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 text-white transition-all duration-200 rounded-full hover:bg-white/20 hover:rotate-90 active:scale-95"
              title="Đóng thước đo"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* Tab chuyển đổi chế độ */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setMeasureType("distance")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                measureType === "distance"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaRoute className="text-[11px]" />
              <span>Đo Khoảng Cách</span>
            </button>

            <button
              type="button"
              onClick={() => setMeasureType("area")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                measureType === "area"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FaVectorSquare className="text-[11px]" />
              <span>Đo Diện Tích</span>
            </button>
          </div>
        </div>

        {/* Bảng kết quả chính */}
        <div className="p-3 space-y-3 bg-white max-h-[calc(100vh-230px)] overflow-y-auto">
          {measureType === "distance" ? (
            <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-1">
                <span>Tổng khoảng cách</span>
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-black">
                  {measurementPoints.length} điểm
                </span>
              </div>
              <div className="text-2xl font-black text-orange-600 tracking-tight">
                {formatMeasureDistance(totalDistance)}
              </div>
              <div className="text-[10.5px] text-slate-500 mt-1">
                {measurementPoints.length < 2
                  ? "👉 Chấm thêm ít nhất 1 điểm nữa trên bản đồ để tính độ dài."
                  : `Đoạn gấp khúc gồm ${measurementPoints.length - 1} đoạn thẳng.`}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-300 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                  <span>Diện tích đa giác</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black">
                    {measurementPoints.length} góc ranh
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-600 tracking-tight">
                  {areaInfo.primary}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-amber-200/70 text-[11px] text-amber-900 font-semibold">
                  {areaInfo.ha && (
                    <span className="bg-amber-100 px-2 py-0.5 rounded">
                      Hecta: <strong>{areaInfo.ha}</strong>
                    </span>
                  )}
                  {areaInfo.sao && (
                    <span className="bg-amber-100 px-2 py-0.5 rounded">
                      Quy đổi: <strong>{areaInfo.sao}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Chu vi */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                <span className="text-slate-500">Chu vi đa giác:</span>
                <span className="text-slate-900 font-black">
                  {formatMeasureDistance(polygonPerimeter)}
                </span>
              </div>
            </div>
          )}

          {/* Hướng dẫn nhanh khi chưa chấm điểm */}
          {measurementPoints.length === 0 && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-blue-800">
              <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Hướng dẫn đo:</strong> Nhấp chuột lên bản đồ tại các vị trí bạn muốn đo. Hệ số trắc địa sẽ tự động cập nhật liên tục theo từng cú click.
              </div>
            </div>
          )}

          {/* Danh sách từng đoạn thẳng (Segments Breakdown) */}
          {segments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Chi tiết các đoạn thẳng ({segments.length})
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {segments.map((seg) => (
                  <div
                    key={seg.id}
                    className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 rounded-lg text-xs transition-colors"
                  >
                    <span className="text-slate-700 font-medium truncate max-w-[190px]">
                      {seg.label}
                    </span>
                    <span className="font-extrabold text-orange-600">
                      {seg.formatted}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nút tác vụ (Undo, Clear) */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onUndo}
              disabled={measurementPoints.length === 0}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                measurementPoints.length === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95"
              }`}
            >
              <FaUndo className="text-[11px]" />
              <span>Hoàn tác (Undo)</span>
            </button>

            <button
              type="button"
              onClick={onClear}
              disabled={measurementPoints.length === 0}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                measurementPoints.length === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 active:scale-95"
              }`}
            >
              <FaTrashAlt className="text-[11px]" />
              <span>Xóa tất cả</span>
            </button>
          </div>
        </div>

        {/* Footer tip */}
        <div className="px-3 py-1.5 bg-slate-100 text-[10.5px] text-slate-500 text-center font-medium border-t border-slate-200">
          Chế độ con trỏ chữ thập (Crosshair) đang bật trên bản đồ
        </div>
      </div>
    </div>
  );
};

export default MeasurementPanel;
