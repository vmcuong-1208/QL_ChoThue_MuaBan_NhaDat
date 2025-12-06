"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaTimes,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaLayerGroup,
  FaCrosshairs,
  FaCity,
  FaBuilding,
  FaHome,
  FaCopy,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronLeft,
  FaMoneyBillWave,
  FaRulerCombined,
  FaTag,
  FaImage,
} from "react-icons/fa";

export default function PlaceDetailCard({
  place,
  boundaries = [],
  propertySummary,
  relatedProperties = [],
  onClose,
  onBoundaryClick,
  calculatedArea = 0,
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra dữ liệu đầu vào
  if (!place && !propertySummary) return null;

  const isProperty = !!propertySummary;

  // ✅ Kiểm tra nếu đang ở PropertyDetail page → Không render
  const isPropertyDetailPage = location.pathname.includes("/bat-dong-san/");

  if (isPropertyDetailPage) {
    console.log("🚫 [PlaceDetailCard] Hidden on PropertyDetail page");
    return null; // ✅ Không render trên PropertyDetail page
  }

  // Chuẩn hóa dữ liệu hiển thị (Ưu tiên Property nếu có, nếu không thì dùng Place)
  const displayData = {
    name: isProperty
      ? propertySummary.TieuDe
      : place?.name || "Địa điểm đã chọn",
    displayName: isProperty
      ? propertySummary.DiaChi
      : place?.display_name || place?.name || "",
    type: isProperty ? "Bất động sản" : place?.type || "Địa điểm",
    lat: isProperty
      ? Number(propertySummary.GPS_Lat)
      : place?.lat
      ? Number(place.lat)
      : 0,
    lng: isProperty
      ? Number(propertySummary.GPS_Lng)
      : place?.lng
      ? Number(place.lng)
      : 0,
  };

  // Hàm điều hướng
  const handleViewDetail = (propertyId) => {
    navigate(`/bat-dong-san/${propertyId}`);
  };

  // Copy coordinates
  const handleCopyCoordinates = () => {
    const coords = `${displayData.lat.toFixed(6)}, ${displayData.lng.toFixed(
      6
    )}`;
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get icon by boundary type
  const getBoundaryIcon = (boundaryType) => {
    const typeStr = boundaryType?.toLowerCase() || "";
    if (typeStr.includes("tỉnh") || typeStr.includes("thành phố")) {
      return <FaCity className="text-blue-500" />;
    } else if (typeStr.includes("quận") || typeStr.includes("huyện")) {
      return <FaBuilding className="text-green-500" />;
    } else if (typeStr.includes("phường") || typeStr.includes("xã")) {
      return <FaHome className="text-orange-500" />;
    }
    return <FaMapMarkerAlt className="text-gray-500" />;
  };

  // Get badge color
  const getBoundaryBadgeColor = (boundaryType) => {
    const typeStr = boundaryType?.toLowerCase() || "";
    if (typeStr.includes("tỉnh") || typeStr.includes("thành phố")) {
      return "bg-blue-100 text-blue-700";
    } else if (typeStr.includes("quận") || typeStr.includes("huyện")) {
      return "bg-green-100 text-green-700";
    } else if (typeStr.includes("phường") || typeStr.includes("xã")) {
      return "bg-orange-100 text-orange-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  // Card Content Component
  const CardContent = () => (
    <>
      {/* MOBILE: Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[9999] transition-all duration-300 bg-white shadow-2xl md:hidden rounded-t-3xl animate-slideInBottom">
        {/* Header Mobile */}
        <div className="relative px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center flex-1 min-w-0 gap-2">
              <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-white rounded-full shadow-md">
                {isProperty ? (
                  <FaHome className="text-sm text-blue-600" />
                ) : (
                  <FaMapMarkerAlt className="text-sm text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-white truncate">
                  {displayData.name}
                </h3>
                <span className="text-[10px] font-semibold text-blue-100 truncate block">
                  {displayData.type}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex items-center justify-center flex-shrink-0 text-white transition-all duration-300 rounded-full w-7 h-7 hover:bg-red-500 active:scale-95"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* Tabs Mobile */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold transition-all duration-300 ${
              activeTab === "summary"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 active:bg-white"
            }`}
          >
            <FaInfoCircle className="text-sm" />
            <span>Tổng quan</span>
          </button>

          <button
            onClick={() => setActiveTab("boundaries")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold transition-all duration-300 ${
              activeTab === "boundaries"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 active:bg-white"
            }`}
          >
            <FaLayerGroup className="text-sm" />
            <span>Ranh giới</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-blue-600 rounded-full">
              {boundaries.length}
            </span>
          </button>
        </div>

        {/* Content Mobile */}
        <div className="overflow-y-auto max-h-[50vh]">
          {activeTab === "summary" && <SummaryContent isMobile={true} />}
          {activeTab === "boundaries" && <BoundariesContent />}
        </div>
      </div>

      {/* DESKTOP: Sidebar */}
      <div
        className={`hidden md:block fixed z-[9999] transition-all duration-300 bg-white shadow-xl backdrop-blur-sm bg-opacity-95 rounded-xl animate-slideInLeft ${
          isCollapsed
            ? "top-[120px] left-[260px] w-14"
            : "top-[120px] left-[260px] w-80"
        }`}
      >
        {isCollapsed ? (
          <div className="p-2">
            <button
              onClick={() => setIsCollapsed(false)}
              className="flex items-center justify-center w-10 h-10 text-blue-600 transition-all duration-300 rounded-lg hover:bg-blue-100"
              title="Mở rộng"
            >
              <FaMapMarkerAlt className="text-xl animate-pulse" />
            </button>
          </div>
        ) : (
          <>
            {/* Header Desktop */}
            <div className="relative p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center flex-1 min-w-0 gap-2">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-white rounded-full shadow-md">
                    {isProperty ? (
                      <FaHome className="text-sm text-blue-600" />
                    ) : (
                      <FaMapMarkerAlt className="text-sm text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">
                      {displayData.name}
                    </h3>
                    <span className="text-[10px] font-semibold text-blue-100 truncate block">
                      {displayData.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="flex items-center justify-center w-6 h-6 text-white transition-all duration-300 rounded-full hover:bg-white/20"
                    title="Thu gọn"
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>

                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-6 h-6 text-white transition-all duration-300 rounded-full hover:bg-red-500"
                    title="Đóng"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs Desktop */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab("summary")}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold transition-all duration-300 ${
                  activeTab === "summary"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <FaInfoCircle className="text-xs" />
                <span>Tổng quan</span>
              </button>

              <button
                onClick={() => setActiveTab("boundaries")}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold transition-all duration-300 ${
                  activeTab === "boundaries"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <FaLayerGroup className="text-xs" />
                <span>Ranh giới</span>
                <span className="px-1 py-0.5 text-[9px] font-bold text-white bg-blue-600 rounded-full">
                  {boundaries.length}
                </span>
              </button>
            </div>

            {/* Content Desktop */}
            <div className="overflow-y-auto max-h-[60vh]">
              {activeTab === "summary" && <SummaryContent isMobile={false} />}
              {activeTab === "boundaries" && <BoundariesContent />}
            </div>
          </>
        )}
      </div>
    </>
  );

  // --- Sub-components cho nội dung ---

  const SummaryContent = ({ isMobile }) => (
    <div
      className={`${
        isMobile ? "p-3 space-y-2" : "p-2 space-y-1.5"
      } animate-fadeIn`}
    >
      {/* 1. Nếu là Property: Hiển thị chi tiết BĐS */}
      {isProperty && (
        <div className="mb-2 space-y-2">
          {propertySummary.HinhAnh && propertySummary.HinhAnh.length > 0 && (
            <div className="relative w-full h-32 overflow-hidden rounded-lg">
              <img
                src={propertySummary.HinhAnh[0]}
                alt={propertySummary.TieuDe}
                className="object-cover w-full h-full transition-transform hover:scale-105"
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                {propertySummary.LoaiHinh || "BĐS"}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 border border-gray-100 rounded bg-gray-50">
              <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                <FaMoneyBillWave className="text-green-600" /> Giá
              </div>
              <div className="text-sm font-bold text-red-600 truncate">
                {propertySummary.Gia
                  ? `${propertySummary.Gia.toLocaleString()} VNĐ`
                  : "Thỏa thuận"}
              </div>
            </div>
            <div className="p-2 border border-gray-100 rounded bg-gray-50">
              <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                <FaRulerCombined className="text-blue-600" /> Diện tích
              </div>
              <div className="text-sm font-bold text-gray-800">
                {propertySummary.DienTich} m²
              </div>
            </div>
          </div>

          <div className="p-2 border border-gray-100 rounded bg-gray-50">
            <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
              <FaTag className="text-purple-600" /> Trạng thái
            </div>
            <div className="text-xs font-bold text-gray-800">
              {propertySummary.TrangThai || "Đang giao dịch"}
            </div>
          </div>

          <button
            onClick={() => handleViewDetail(propertySummary.MaTTND)}
            className="w-full py-2 text-xs font-bold text-white transition-all bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95"
          >
            Xem chi tiết BĐS
          </button>
        </div>
      )}

      {/* 2. Thông tin chung (Địa chỉ, Tọa độ) - Luôn hiển thị */}
      <div className="p-2 text-xs border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-1.5 mb-1">
          <FaMapMarkerAlt className="text-xs text-blue-600" />
          <span className="font-bold text-gray-600">Địa chỉ</span>
        </div>
        <p className="text-xs text-gray-800 line-clamp-2">
          {displayData.displayName || "Đang cập nhật"}
        </p>
      </div>

      <div className="p-2 text-xs border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-1.5 mb-1">
          <FaCrosshairs className="text-xs text-purple-600" />
          <span className="font-bold text-gray-600">Tọa độ</span>
        </div>
        <div className="flex items-center gap-2">
          {/* SỬA LỖI 1: Chỉnh sửa lại thẻ div bị sai cú pháp */}
          <div className="flex-1 text-[10px] font-semibold text-gray-800 truncate">
            {displayData.lat.toFixed(6)}, {displayData.lng.toFixed(6)}
          </div>
          <button
            onClick={handleCopyCoordinates}
            className="px-2 py-1 text-[10px] font-bold text-white transition-all duration-300 rounded bg-purple-600 active:scale-95"
          >
            {copied ? "✓" : <FaCopy />}
          </button>
        </div>
      </div>

      {/* 3. Diện tích tính toán (nếu có và không phải là BĐS đã có diện tích sẵn) */}
      {!isProperty && calculatedArea > 0 && (
        <div className="p-2 text-xs border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-1.5 mb-1">
            <FaLayerGroup className="text-xs text-orange-600" />
            <span className="font-bold text-gray-600">
              Diện tích vùng (ước tính)
            </span>
          </div>
          <div className="text-xs font-bold text-gray-800">
            {calculatedArea > 1000000
              ? `${(calculatedArea / 1000000).toFixed(2)} km²`
              : `${Math.round(calculatedArea).toLocaleString()} m²`}
          </div>
        </div>
      )}

      {/* SỬA LỖI 2: Sửa link Google Maps */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${displayData.lat},${displayData.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-full gap-1.5 px-3 py-2 text-xs font-bold text-white transition-all duration-300 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg active:scale-95 hover:shadow-md"
      >
        <FaExternalLinkAlt className="text-[10px]" />
        Xem trên Google Maps
      </a>

      {/* 4. ✅ DANH SÁCH BĐS LIÊN QUAN */}
      {relatedProperties.length > 0 && (
        <div className="pt-3 mt-3 space-y-2 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-700 uppercase">
              Bất động sản lân cận
            </h4>
            <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-blue-600 rounded-full">
              {relatedProperties.length}
            </span>
          </div>

          <div className="space-y-2">
            {relatedProperties.slice(0, 5).map((prop) => (
              <div
                key={prop.MaTTND}
                onClick={() => {
                  if (onBoundaryClick) onBoundaryClick(prop); // Focus map
                }}
                className="flex flex-col gap-2 p-2 transition-all duration-300 border border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
              >
                {/* Property Info */}
                <div className="flex items-start gap-2">
                  {/* Thumbnail (if available) */}
                  {prop.HinhAnh && prop.HinhAnh.length > 0 && (
                    <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-md">
                      <img
                        src={prop.HinhAnh[0]}
                        alt={prop.TieuDe}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 text-xs font-bold text-gray-800 truncate">
                      {prop.TieuDe}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span className="font-semibold text-red-600">
                        {prop.Gia
                          ? `${Number(prop.Gia).toLocaleString()} VNĐ`
                          : "Thỏa thuận"}
                      </span>
                      <span>•</span>
                      <span>{prop.DienTich} m²</span>
                    </div>
                  </div>
                </div>

                {/* ✅ NEW: Individual "Xem chi tiết" Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ Ngăn click vào parent card
                    handleViewDetail(prop.MaTTND);
                  }}
                  className="w-full px-3 py-1.5 text-[10px] font-bold text-white bg-green-600 rounded-md hover:bg-green-700 active:scale-95 transition-all duration-300 flex items-center justify-center gap-1"
                >
                  <FaExternalLinkAlt className="text-[9px]" />
                  Xem chi tiết
                </button>
              </div>
            ))}

            {relatedProperties.length > 5 && (
              <div className="py-1 text-center text-[10px] text-blue-600 italic font-semibold">
                Và {relatedProperties.length - 5} BĐS khác trong khu vực...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const BoundariesContent = () => (
    <div className="p-3 animate-fadeIn">
      {boundaries.length > 0 ? (
        <div className="space-y-1.5">
          {boundaries.map((boundary, index) => (
            <div
              key={boundary.id || index}
              onClick={() => onBoundaryClick && onBoundaryClick(boundary)}
              className="flex items-center gap-2 p-2 text-xs transition-all duration-300 border border-gray-200 rounded-lg cursor-pointer active:bg-blue-50 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-white border border-gray-200 rounded-full">
                <div className="text-sm">{getBoundaryIcon(boundary.type)}</div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 truncate">
                  {boundary.name}
                </div>
                <span
                  className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${getBoundaryBadgeColor(
                    boundary.type
                  )}`}
                >
                  {boundary.type || "Ranh giới"}
                </span>
              </div>

              <FaExternalLinkAlt className="text-[10px] text-gray-400" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <FaLayerGroup className="text-3xl text-gray-300" />
          <p className="text-xs font-bold text-gray-600">
            Không tìm thấy ranh giới hành chính
          </p>
        </div>
      )}
    </div>
  );

  // ✅ RENDER VỚI PORTAL - Escape transform context
  return typeof window !== "undefined"
    ? createPortal(
        <div className="fixed inset-0 z-[9998] pointer-events-none pt-[70px]">
          <div className="pointer-events-auto">
            <CardContent />
          </div>
        </div>,
        document.body
      )
    : null;
}
