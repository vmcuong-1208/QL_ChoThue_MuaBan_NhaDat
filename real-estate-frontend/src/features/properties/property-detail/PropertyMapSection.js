"use client";

import React, { useState, useMemo } from "react";
import { FaMapMarkerAlt, FaDrawPolygon, FaInfoCircle } from "react-icons/fa";
import LeafletMapComponent from "../../map-gis/LeafletMapComponent";
import PropertyDistanceFinder from "./PropertyDistanceFinder";

/**
 * Tính tâm đa giác nếu có danh sách tọa độ thửa đất
 */
const computeCentroid = (points) => {
  if (!points || !Array.isArray(points) || points.length === 0) return null;
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;

  points.forEach((pt) => {
    let lat = null;
    let lng = null;
    if (Array.isArray(pt) && pt.length >= 2) {
      lat = Number(pt[0]);
      lng = Number(pt[1]);
    } else if (typeof pt === "object") {
      lat = Number(pt.lat ?? pt.latitude ?? pt.y);
      lng = Number(pt.lng ?? pt.lon ?? pt.longitude ?? pt.x);
    }
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      sumLat += lat;
      sumLng += lng;
      count++;
    }
  });

  if (count === 0) return null;
  return { lat: sumLat / count, lng: sumLng / count };
};

const PropertyMapSection = ({
  property,
  fullAddress,
  boundary,
  area,
  planningData,
}) => {
  // State quản lý lộ trình chỉ đường
  const [routeData, setRouteData] = useState(null);
  const [isPickingOnMap, setIsPickingOnMap] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null);

  if (!property) return null;

  // Tính tọa độ tâm của bất động sản (ưu tiên tâm thửa đất VN2000, sau đó đến GPS)
  const calculateMapCenter = () => {
    if (boundary && boundary.length > 0) {
      const centroid = computeCentroid(boundary);
      if (centroid) return centroid;
      const first = boundary[0];
      const lat = Number(Array.isArray(first) ? first[0] : (first.lat || first.y));
      const lng = Number(Array.isArray(first) ? first[1] : (first.lng || first.x));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }

    const lat = Number(property.GPS_Lat || property.ToaDoX || 10.8231);
    const lng = Number(property.GPS_Lng || property.ToaDoY || 106.6297);

    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      isFinite(lat) &&
      isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      lat !== 0 &&
      lng !== 0
    ) {
      return { lat, lng };
    }
    return { lat: 10.8231, lng: 106.6297 };
  };

  const center = useMemo(() => calculateMapCenter(), [boundary, property]);
  const zoom = property.ToaDoVN2000?.wgs84Coordinates ? 18 : 15;

  // Tọa độ đích cho bộ dò khoảng cách
  const destination = useMemo(() => {
    return {
      lat: center.lat,
      lng: center.lng,
      address: fullAddress,
      title: property.TieuDe || "Bất động sản",
    };
  }, [center, fullAddress, property.TieuDe]);

  // Click trên bản đồ (dùng khi người dùng chọn chế độ "Chấm điểm trên bản đồ")
  const handleMapClick = (coords) => {
    if (isPickingOnMap && coords) {
      setPickedLocation(coords);
    }
  };

  return (
    <div className="p-5 sm:p-6 transition-all duration-300 bg-white shadow-lg rounded-2xl hover:shadow-xl animate-fadeInUp">
      {/* Tiêu đề & Thông tin bổ trợ */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>Vị trí trên bản đồ</span>
            {boundary && boundary.length >= 3 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                <FaDrawPolygon className="text-[11px]" />
                Ranh giới VN2000
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Bản đồ vệ tinh có ranh giới thửa đất và công cụ dò khoảng cách, chỉ đường
          </p>
        </div>

        {isPickingOnMap && (
          <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full animate-pulse">
            🎯 Đang chọn vị trí xuất phát trên bản đồ
          </span>
        )}
      </div>

      {/* Bản đồ Leaflet Map */}
      <div
        className={`overflow-hidden rounded-xl border border-gray-200 transition-all ${
          isPickingOnMap ? "ring-2 ring-amber-400 cursor-crosshair" : ""
        }`}
      >
        <LeafletMapComponent
          center={center}
          zoom={zoom}
          propertyBoundary={boundary}
          propertyArea={area}
          planningData={planningData}
          height="520px"
          showControls={true}
          showMode="property"
          propertyProvince={property.MaTinh}
          propertyDistrict={property.MaHuyen}
          routeData={routeData}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Địa chỉ thực tế của BĐS */}
      <div className="flex items-start gap-2.5 mt-3.5 text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
        <FaMapMarkerAlt className="text-red-500 text-sm mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <span className="font-semibold text-gray-900">Địa chỉ: </span>
          <span>{fullAddress || property.DiaChi || "Chưa cập nhật địa chỉ"}</span>
        </div>
      </div>

      {/* CÔNG CỤ DÒ KHOẢNG CÁCH & TÌM ĐƯỜNG (Khoảng cách bao xa, thời gian bao lâu, mở Google Maps) */}
      <PropertyDistanceFinder
        destination={destination}
        fullAddress={fullAddress}
        onRouteChange={setRouteData}
        onMapPickRequest={setIsPickingOnMap}
        pickedLocationFromMap={pickedLocation}
        onResetMap={() => setRouteData(null)}
      />
    </div>
  );
};

export default PropertyMapSection;
