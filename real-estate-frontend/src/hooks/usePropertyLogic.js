"use client";

import { useState, useEffect } from "react";
import api from "../services/api";

const usePropertyLogic = (mapRef) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyMarkers, setPropertyMarkers] = useState([]);
  const [relatedProperties, setRelatedProperties] = useState([]);

  // Tìm kiếm BĐS theo Tỉnh/Huyện (hoặc lấy toàn bộ ban đầu nếu không truyền)
  const fetchProperties = async (provinceId = null, districtId = null) => {
    try {
      const params = {
        limit: 100,
      };
      if (provinceId) params.tinh = provinceId;
      if (districtId) params.huyen = districtId;

      const propResponse = await api.get("/properties/search", { params });
      const properties = propResponse.data?.properties || (Array.isArray(propResponse.data) ? propResponse.data : []);

      setPropertyMarkers(properties);

      // Logic "BĐS Liên quan" (Client-side filtering)
      const related = properties.slice(0, 5);
      setRelatedProperties(related);
    } catch (err) {
      console.error("❌ [fetchProperties] Error:", err);
      setPropertyMarkers([]);
      setRelatedProperties([]);
    }
  };

  // Nạp sẵn BĐS lên bản đồ ngay khi mở trang
  useEffect(() => {
    fetchProperties();
  }, []);

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);

    const lat = Number(property.GPS_Lat || property.ToaDoX);
    const lng = Number(property.GPS_Lng || property.ToaDoY);

    if (mapRef.current && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      if (typeof mapRef.current.setView === "function") {
        mapRef.current.setView([lat, lng], 16, { animate: true });
      } else if (typeof mapRef.current.panTo === "function") {
        mapRef.current.panTo([lat, lng]);
      }
    }
  };

  return {
    selectedProperty,
    setSelectedProperty,
    propertyMarkers,
    setPropertyMarkers,
    relatedProperties,
    setRelatedProperties,
    fetchProperties,
    handlePropertySelect,
  };
};

export default usePropertyLogic;
