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
    <div className="p-6 transition-all duration-300 border-2 border-blue-200 bg-blue-50 rounded-xl hover:border-blue-400 hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
        <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <FaMapMarkerAlt className="text-green-600" />
          Vị trí GPS (tùy chọn)
        </h4>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" /> Đang lấy vị trí...
            </>
          ) : (
            <>
              <FaMapMarkerAlt /> Lấy vị trí hiện tại
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 border-l-4 border-red-500 rounded-r-lg animate-slideInLeft">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Coordinates Fields */}
      <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-bold text-gray-700">
            Latitude (Vĩ độ)
          </label>
          <input
            type="text"
            value={lat}
            readOnly
            placeholder="VD: 10.762622"
            className="w-full px-4 py-3 font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg cursor-not-allowed focus:outline-none"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold text-gray-700">
            Longitude (Kinh độ)
          </label>
          <input
            type="text"
            value={lng}
            readOnly
            placeholder="VD: 106.660172"
            className="w-full px-4 py-3 font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg cursor-not-allowed focus:outline-none"
          />
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-3 p-4 border-l-4 border-green-500 rounded-r-lg bg-green-50">
        <FaMapMarkerAlt className="flex-shrink-0 mt-1 text-green-600" />
        <p className="text-sm font-medium text-gray-700">
          Click <span className="font-extrabold">"Lấy vị trí hiện tại"</span> để
          tự động điền tọa độ GPS từ thiết bị của bạn. Trình duyệt sẽ yêu cầu
          quyền truy cập vị trí.
        </p>
      </div>
    </div>
  );
};

export default GPSLocationPicker;
