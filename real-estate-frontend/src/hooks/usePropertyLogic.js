"use client";

import { useState } from "react";
import api from "../services/api";

const usePropertyLogic = (mapRef) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyMarkers, setPropertyMarkers] = useState([]);
  const [relatedProperties, setRelatedProperties] = useState([]);

  // Tìm kiếm BĐS theo Tỉnh/Huyện
  const fetchProperties = async (provinceId, districtId) => {
    console.log("🔍 [fetchProperties] START:", { provinceId, districtId }); // ← DEBUG 1

    if (!provinceId) {
      console.warn("⚠️ [fetchProperties] No provinceId provided!"); // ← DEBUG 2
      return;
    }

    try {
      const params = {
        tinh: provinceId,
        huyen: districtId,
        limit: 20,
      };

      const propResponse = await api.get("/properties/search", { params });

      console.log("🔍 [fetchProperties] Response status:", propResponse.status); // ← DEBUG 5
      console.log("🔍 [fetchProperties] Response data:", propResponse.data); // ← DEBUG 6

      const properties = propResponse.data.properties || [];

      console.log("🔍 [fetchProperties] Properties array:", properties); // ← DEBUG 7
      console.log("🔍 [fetchProperties] Properties length:", properties.length); // ← DEBUG 8

      setPropertyMarkers(properties);

      // Logic "BĐS Liên quan" (Client-side filtering)
      // Lấy 5 BĐS đầu tiên làm "liên quan"
      const related = properties.slice(0, 5);
      setRelatedProperties(related);

      console.log("🔍 [fetchProperties] Related properties:", related); // ← DEBUG 9
      console.log("🔍 [fetchProperties] Related length:", related.length); // ← DEBUG 10

      console.log(
        `✅ [fetchProperties] Found ${properties.length} properties in area.`
      ); // ← DEBUG 11
    } catch (err) {
      console.error("❌ [fetchProperties] Error:", err); // ← DEBUG 12
      console.error(
        "❌ [fetchProperties] Error details:",
        err.response?.data || err.message
      ); // ← DEBUG 13

      setPropertyMarkers([]);
      setRelatedProperties([]);
    }
  };

  const handlePropertySelect = (property) => {
    console.log("🔍 [handlePropertySelect] Property selected:", property); // ← DEBUG

    setSelectedProperty(property);

    if (mapRef.current && property.ToaDoX && property.ToaDoY) {
      console.log("🔍 [handlePropertySelect] Panning to:", {
        lat: property.ToaDoX,
        lng: property.ToaDoY,
      }); // ← DEBUG

      mapRef.current.panTo({ lat: property.ToaDoX, lng: property.ToaDoY });
      mapRef.current.setZoom(17);
    } else {
      console.warn("⚠️ [handlePropertySelect] Missing coordinates:", {
        ToaDoX: property.ToaDoX,
        ToaDoY: property.ToaDoY,
      }); // ← DEBUG
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
