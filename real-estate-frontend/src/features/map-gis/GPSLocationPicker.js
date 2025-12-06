"use client";

import { useState } from "react";
import { FaMapMarkerAlt, FaSpinner } from "react-icons/fa";

const GPSLocationPicker = ({
  onLocationChange,
  initialLat = "",
  initialLng = "",
}) => {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt của bạn không hỗ trợ định vị GPS");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));

        if (onLocationChange) {
          onLocationChange({
            lat: latitude,
            lng: longitude,
          });
        }

        setLoading(false);
        console.log("[GPS] Location obtained:", { latitude, longitude });
      },
      (error) => {
        setLoading(false);
        let errorMessage = "Không thể lấy vị trí GPS";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Thông tin vị trí không khả dụng";
            break;
          case error.TIMEOUT:
            errorMessage = "Yêu cầu lấy vị trí đã hết thời gian chờ";
            break;
          default:
            errorMessage = "Đã xảy ra lỗi không xác định khi lấy vị trí";
        }

        setError(errorMessage);
        console.error("[GPS] Error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <FaMapMarkerAlt className="text-emerald-600" />
            Vị trí GPS (tùy chọn)
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Lấy tọa độ thực tế của bất động sản qua định vị thiết bị
          </p>
        </div>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white transition-colors rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin text-xs" /> Đang lấy...
            </>
          ) : (
            <>
              <FaMapMarkerAlt className="text-xs" /> Lấy vị trí hiện tại
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <span className="font-bold">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Coordinates Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-[11px] font-semibold text-gray-600">
            Latitude (Vĩ độ)
          </label>
          <input
            type="text"
            value={lat}
            readOnly
            placeholder="VD: 10.762622"
            className="w-full px-3 py-2 text-xs font-medium text-gray-800 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed focus:outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 text-[11px] font-semibold text-gray-600">
            Longitude (Kinh độ)
          </label>
          <input
            type="text"
            value={lng}
            readOnly
            placeholder="VD: 106.660172"
            className="w-full px-3 py-2 text-xs font-medium text-gray-800 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed focus:outline-none"
          />
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-2 p-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg">
        <FaMapMarkerAlt className="flex-shrink-0 mt-0.5 text-emerald-600 text-xs" />
        <p className="text-[11px] leading-relaxed">
          Nhấn <strong className="text-gray-800">"Lấy vị trí hiện tại"</strong> khi bạn đang đứng tại vị trí bất động sản để trình duyệt tự động gán tọa độ chính xác.
        </p>
      </div>
    </div>
  );
};

export default GPSLocationPicker;
