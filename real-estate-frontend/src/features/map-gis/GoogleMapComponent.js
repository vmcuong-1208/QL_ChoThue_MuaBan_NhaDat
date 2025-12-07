"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { calculateDistance } from "../../utils/coordinateConverter";
import { calculatePolygonArea } from "../../utils/gisUtils";
import DirectionsPanel from "./DirectionsPanel";
import NearbyPlacesPanel from "./NearbyPlacesPanel";
import SearchPanel from "../properties/SearchPanel";
import PlaceDetailCard from "./PlaceDetailCard";
import { getPlaceByCoordinates } from "../../utils/nominatimService";
import useGISLogic from "../../hooks/useGISLogic";
import usePropertyLogic from "../../hooks/usePropertyLogic";
import { SERVER_URL } from "../../services/api";

import MapControls from "./google-map/MapControls";
import AdminBoundariesPanel from "./google-map/AdminBoundariesPanel";

// Mock google object để tránh các hàm kiểm tra window.google.maps bị undefined
if (typeof window !== "undefined") {
  if (!window.google) {
    window.google = {
      maps: {
        LatLngBounds: class {
          constructor() {
            this.points = [];
          }
          extend(pt) {
            const lat = typeof pt.lat === "function" ? pt.lat() : pt.lat;
            const lng = typeof pt.lng === "function" ? pt.lng() : pt.lng;
            if (lat !== undefined && lng !== undefined) {
              this.points.push([lat, lng]);
            }
          }
        },
        LatLng: class {
          constructor(lat, lng) {
            this._lat = lat;
            this._lng = lng;
          }
          lat() { return this._lat; }
          lng() { return this._lng; }
        },
        event: {
          removeListener: () => {},
          addListener: () => {},
        },
      },
    };
  }
}

// 100% MIỄN PHÍ - KHÔNG CẦN GOOGLE CLOUD BILLING / API KEY
const TILE_CONFIGS = {
  satellite: {
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", // Google Hybrid vệ tinh sắc nét có tên đường tiếng Việt
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    attribution: "&copy; Google Maps (Satellite)",
  },
  roadmap: {
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", // Google Maps đường sá chuẩn tiếng Việt
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    attribution: "&copy; Google Maps",
  },
};

/**
 * Chuẩn hóa danh sách tọa độ (hỗ trợ cả dạng [{lat, lng}], [[lat, lng]])
 */
function normalizeCoordinates(coords) {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return [];
  const flat = Array.isArray(coords[0]) && Array.isArray(coords[0][0]) ? coords.flat() : coords;

  const result = [];
  for (const pt of flat) {
    if (!pt) continue;
    let lat = null;
    let lng = null;
    if (Array.isArray(pt) && pt.length >= 2) {
      lat = Number(pt[0]);
      lng = Number(pt[1]);
    } else if (typeof pt === "object") {
      lat = Number(pt.lat ?? pt.latitude ?? pt.y);
      lng = Number(pt.lng ?? pt.lon ?? pt.longitude ?? pt.x);
    }
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
      result.push([lat, lng]);
    }
  }
  return result;
}

function computeCenter(points) {
  if (!points || points.length === 0) return null;
  let sumLat = 0;
  let sumLng = 0;
  points.forEach(([lat, lng]) => {
    sumLat += lat;
    sumLng += lng;
  });
  return [sumLat / points.length, sumLng / points.length];
}

const GoogleMapComponent = ({
  center = { lat: 10.8231, lng: 106.6297 },
  zoom = 15,
  propertyBoundary = null,
  propertyArea = null,
  planningData = null,
  showControls = true,
  onMapClick = null,
  onBoundaryAdd,
  height,
  showMode = "map",
}) => {
  // States
  const [propertyCenter, setPropertyCenter] = useState(center);
  const [mapType, setMapType] = useState("roadmap");
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true);
  const [showPlanningLayer, setShowPlanningLayer] = useState(true);
  const [boundaryOpacity, setBoundaryOpacity] = useState(0.4);

  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [measurementDistance, setMeasurementDistance] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [routeData, setRouteData] = useState(null);

  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const mapCanvasRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Layer groups
  const adminBoundariesGroupRef = useRef(null);
  const propertyBoundaryGroupRef = useRef(null);
  const markersGroupRef = useRef(null);
  const measurementGroupRef = useRef(null);
  const planningGroupRef = useRef(null);
  const routeGroupRef = useRef(null);

  const [planningOpacity, setPlanningOpacity] = useState(0.7);
  const [showSearch, setShowSearch] = useState(false);
  const [clickPointMode, setClickPointMode] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetailBoundaries, setPlaceDetailBoundaries] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [clickMarker, setClickMarker] = useState(null);
  const [boundaryCalculatedArea, setBoundaryCalculatedArea] = useState(null);

  // Custom Hooks
  const {
    selectedBoundaries,
    boundaryOpacities,
    setBoundaryOpacities,
    handleSearchSelect,
    handleRemoveBoundary,
    handleClearAllBoundaries,
    calculatedArea,
    sortedData,
    mapNameToId,
    handleSelectByCoordinates,
    restoreBoundaries,
  } = useGISLogic(mapRef, setPlaceDetailBoundaries);

  const {
    selectedProperty,
    setSelectedProperty,
    propertyMarkers,
    relatedProperties,
    fetchProperties,
    handlePropertySelect,
  } = usePropertyLogic(mapRef);

  const safeCenter = useMemo(() => {
    const lat = Number(propertyCenter?.lat ?? center?.lat ?? 10.8231);
    const lng = Number(propertyCenter?.lng ?? center?.lng ?? 106.6297);
    return [
      isNaN(lat) || !isFinite(lat) ? 10.8231 : lat,
      isNaN(lng) || !isFinite(lng) ? 106.6297 : lng,
    ];
  }, [propertyCenter, center]);

  const normalizedPropertyBoundary = useMemo(() => {
    return normalizeCoordinates(propertyBoundary);
  }, [propertyBoundary]);

  // 1. Khởi tạo Leaflet Map (Mount 1 lần)
  useEffect(() => {
    if (!mapCanvasRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const map = L.map(mapCanvasRef.current, {
      center: safeCenter,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Layer groups
    adminBoundariesGroupRef.current = L.layerGroup().addTo(map);
    propertyBoundaryGroupRef.current = L.layerGroup().addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);
    measurementGroupRef.current = L.layerGroup().addTo(map);
    planningGroupRef.current = L.layerGroup().addTo(map);
    routeGroupRef.current = L.layerGroup().addTo(map);

    // Initial tile layer
    const initialConfig = TILE_CONFIGS[mapType] || TILE_CONFIGS.roadmap;
    tileLayerRef.current = L.tileLayer(initialConfig.url, {
      maxZoom: initialConfig.maxZoom,
      subdomains: initialConfig.subdomains || ["mt0", "mt1", "mt2", "mt3"],
      attribution: initialConfig.attribution,
    }).addTo(map);

    // Zoom control góc dưới bên phải
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

    // Bọc mapRef để tương thích với các hook useGISLogic, usePropertyLogic
    const originalGetCenter = map.getCenter.bind(map);
    map.getCenter = () => {
      const c = originalGetCenter();
      return {
        lat: () => c.lat,
        lng: () => c.lng,
        lat: c.lat,
        lng: c.lng,
      };
    };

    const originalPanTo = map.panTo.bind(map);
    map.panTo = (dest, options) => {
      let target = dest;
      if (dest && typeof dest === "object") {
        const lat = Number(dest.lat ?? dest[0]);
        const lng = Number(dest.lng ?? dest[1]);
        if (!isNaN(lat) && !isNaN(lng)) target = [lat, lng];
      }
      return originalPanTo(target, options);
    };

    const originalFitBounds = map.fitBounds.bind(map);
    map.fitBounds = (bounds, options) => {
      if (bounds?.points && Array.isArray(bounds.points)) {
        if (bounds.points.length > 0) {
          return originalFitBounds(bounds.points, options);
        }
        return map;
      }
      return originalFitBounds(bounds, options);
    };

    leafletMapRef.current = map;
    mapRef.current = map;

    // Invalidate size on multiple intervals to ensure tiles paint fully
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 300);
    const t4 = setTimeout(() => map.invalidateSize(), 600);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("resize", onResize);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Chuyển đổi loại bản đồ (Đường <-> Vệ tinh)
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const config = TILE_CONFIGS[mapType] || TILE_CONFIGS.roadmap;

    if (tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || ["mt0", "mt1", "mt2", "mt3"],
      attribution: config.attribution,
    }).addTo(leafletMapRef.current);
  }, [mapType]);

  // 3. Xử lý Search Nominatim
  const handleSearchCommit = async (query) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&countrycodes=vn&limit=1&addressdetails=1`;
      const response = await fetch(url);
      const data = await response.json();
      const result = data.length > 0 ? data[0] : null;

      if (result) {
        const place = {
          ...result,
          lat: Number.parseFloat(result.lat),
          lng: Number.parseFloat(result.lon || result.lng),
        };
        setSelectedPlace(place);
        setSelectedProperty(null);

        if (leafletMapRef.current) {
          leafletMapRef.current.panTo([place.lat, place.lng]);
          leafletMapRef.current.setZoom(16);
        }

        const queryParts = query
          .split(",")
          .map((part) => part.trim())
          .reverse();
        const levels = [];

        const level1_name = queryParts.shift();
        const level1s = mapNameToId("level1", level1_name, sortedData);
        if (level1s && level1s.length > 0) levels.push(level1s[0]);

        const level1_ids = level1s ? level1s.map((l) => l.id) : [];
        const level2_name = queryParts.length > 0 ? queryParts.shift() : null;
        const level2 =
          level2_name && level1_ids.length > 0
            ? mapNameToId("level2", level2_name, sortedData, { level1_ids })
            : null;
        if (level2) levels.push(level2);

        const level2_ids = level2 ? [level2.id] : [];
        const level3_name = queryParts.length > 0 ? queryParts.shift() : null;
        const level3 =
          level2_ids.length > 0 && level3_name
            ? mapNameToId("level3", level3_name, sortedData, { level2_ids })
            : null;
        if (level3) levels.push(level3);

        await Promise.all(levels.map((level) => handleSearchSelect(level)));
        setPlaceDetailBoundaries(levels);

        const provinceId = level1s && level1s.length > 0 ? level1s[0].id : null;
        const districtId = level2 ? level2.id : null;

        if (provinceId) {
          await fetchProperties(provinceId, districtId);
        }
      } else {
        setSearchError("Không tìm thấy địa điểm.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Lỗi khi tìm kiếm.");
    } finally {
      setSearchLoading(false);
    }
  };

  // 4. Click điểm trên bản đồ
  const processMapClick = useCallback(
    async (lat, lng) => {
      try {
        const placeInfo = await getPlaceByCoordinates(lat, lng);
        const place = {
          ...(placeInfo || {}),
          lat,
          lng,
          display_name:
            placeInfo?.display_name ||
            `Vị trí: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          type: placeInfo?.type || "Selected Location",
        };
        setSelectedPlace(place);
        setSelectedProperty(null);

        const foundBoundaries = await handleSelectByCoordinates(lat, lng);
        if (foundBoundaries && foundBoundaries.length > 0) {
          const province = foundBoundaries.find((b) => b.level === 1);
          const district = foundBoundaries.find((b) => b.level === 2);

          if (province) {
            const provinceId = province.level1_id;
            const districtId = district?.level2_id || null;
            await fetchProperties(provinceId, districtId);
          }
        }
      } catch (err) {
        console.error("processMapClick Error:", err);
      }
    },
    [handleSelectByCoordinates, fetchProperties]
  );

  // 5. Gắn sự kiện click vào Leaflet Map
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;

    const onClick = async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (measurementMode) {
        setMeasurementPoints((prev) => [...prev, { lat, lng }]);
        return;
      }

      if (clickPointMode) {
        setClickMarker({ lat, lng });
        await processMapClick(lat, lng);
        return;
      }

      if (onMapClick) {
        onMapClick({ lat, lng });
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [measurementMode, clickPointMode, onMapClick, processMapClick]);

  // 6. Tính khoảng cách đo đạc
  useEffect(() => {
    if (measurementPoints.length > 1) {
      let totalDistance = 0;
      for (let i = 0; i < measurementPoints.length - 1; i++) {
        totalDistance += calculateDistance(
          measurementPoints[i],
          measurementPoints[i + 1]
        );
      }
      setMeasurementDistance(totalDistance);
    } else {
      setMeasurementDistance(0);
    }
  }, [measurementPoints]);

  // 7. Vẽ Measurement Layer
  useEffect(() => {
    if (!measurementGroupRef.current) return;
    const group = measurementGroupRef.current;
    group.clearLayers();

    if (!measurementMode || measurementPoints.length === 0) return;

    const latLngs = measurementPoints.map((p) => [p.lat, p.lng]);

    // Vẽ đường đo
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: "#dc2626",
        weight: 3,
        dashArray: "6, 6",
      });
      group.addLayer(polyline);
    }

    // Vẽ từng điểm nút đo
    latLngs.forEach(([lat, lng], idx) => {
      const badge = L.divIcon({
        className: "custom-measure-point",
        html: `
          <div style="
            transform: translate(-50%, -50%);
            width: 18px;
            height: 18px;
            background: #dc2626;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${idx + 1}</div>
        `,
        iconSize: [0, 0],
      });
      group.addLayer(L.marker([lat, lng], { icon: badge }));
    });
  }, [measurementMode, measurementPoints]);

  // 8. Vẽ Ranh giới hành chính (selectedBoundaries)
  useEffect(() => {
    if (!adminBoundariesGroupRef.current) return;
    const group = adminBoundariesGroupRef.current;
    group.clearLayers();

    if (!showBoundaryLayer || !selectedBoundaries || selectedBoundaries.length === 0) return;

    selectedBoundaries.forEach((boundary) => {
      const coords = normalizeCoordinates(boundary.coordinates);
      if (coords.length >= 3) {
        const opacity = boundaryOpacities[boundary.id] ?? boundaryOpacity;
        const poly = L.polygon(coords, {
          color: boundary.color || "#3b82f6",
          weight: 2,
          opacity: 0.85,
          fillColor: boundary.color || "#3b82f6",
          fillOpacity: opacity,
        });

        poly.bindPopup(`
          <div style="font-family: Roboto, sans-serif; font-size: 13px;">
            <strong style="color: ${boundary.color || '#1e40af'}">${boundary.name || "Ranh giới"}</strong>
            <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 11px;">Cấp: ${boundary.level || "Hành chính"}</p>
          </div>
        `);

        group.addLayer(poly);
      }
    });
  }, [selectedBoundaries, boundaryOpacities, boundaryOpacity, showBoundaryLayer]);

  // 9. Vẽ Thửa đất VN2000 (propertyBoundary)
  useEffect(() => {
    if (!propertyBoundaryGroupRef.current) return;
    const group = propertyBoundaryGroupRef.current;
    group.clearLayers();

    if (!showBoundaryLayer || normalizedPropertyBoundary.length < 3) return;

    const poly = L.polygon(normalizedPropertyBoundary, {
      color: "#dc2626",
      weight: 3,
      opacity: 0.95,
      fillColor: "#ef4444",
      fillOpacity: boundaryOpacity,
      dashArray: "6, 4",
    });

    group.addLayer(poly);

    // Đánh số đỉnh góc 1, 2, 3...
    normalizedPropertyBoundary.forEach(([lat, lng], idx) => {
      const cornerBadge = L.divIcon({
        className: "custom-corner-badge",
        html: `
          <div style="
            transform: translate(-50%, -50%);
            width: 22px;
            height: 22px;
            background: #dc2626;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          ">${idx + 1}</div>
        `,
        iconSize: [0, 0],
      });
      group.addLayer(L.marker([lat, lng], { icon: cornerBadge }));
    });

    // Nhãn diện tích ở tâm thửa đất
    const centerPoint = computeCenter(normalizedPropertyBoundary);
    const displayArea = propertyArea || boundaryCalculatedArea;
    if (centerPoint && displayArea) {
      const areaBadge = L.divIcon({
        className: "custom-area-badge",
        html: `
          <div style="
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.96);
            color: #b91c1c;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 800;
            border: 1.5px solid #ef4444;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">📐 ${Number(displayArea).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m²</div>
        `,
        iconSize: [0, 0],
      });
      group.addLayer(L.marker(centerPoint, { icon: areaBadge }));
    }

    // Căn giữa đa giác
    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.fitBounds(poly.getBounds(), { padding: [40, 40], maxZoom: 19 });
      } catch (err) {
        console.warn("fitBounds warning:", err);
      }
    }
  }, [normalizedPropertyBoundary, showBoundaryLayer, boundaryOpacity, propertyArea, boundaryCalculatedArea]);

  // 10. Vẽ Property Markers & Click Marker
  useEffect(() => {
    if (!markersGroupRef.current) return;
    const group = markersGroupRef.current;
    group.clearLayers();

    // Click Marker
    if (clickMarker) {
      const pinIcon = L.divIcon({
        className: "custom-click-pin",
        html: `
          <div style="transform: translate(-50%, -100%);">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="#2563eb" stroke="#ffffff" stroke-width="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [0, 0],
      });
      group.addLayer(L.marker([clickMarker.lat, clickMarker.lng], { icon: pinIcon }));
    }

    // Property markers
    if (propertyMarkers && propertyMarkers.length > 0) {
      propertyMarkers.forEach((prop) => {
        const lat = Number(prop.GPS_Lat || prop.ToaDoX);
        const lng = Number(prop.GPS_Lng || prop.ToaDoY);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

        const priceText = prop.Gia
          ? prop.Gia >= 1e9
            ? `${(prop.Gia / 1e9).toFixed(1)} tỷ`
            : `${(prop.Gia / 1e6).toFixed(0)} tr`
          : "Xem";

        const propIcon = L.divIcon({
          className: "custom-prop-pin",
          html: `
            <div style="
              transform: translate(-50%, -100%);
              background: #2563eb;
              color: white;
              padding: 2.5px 6.5px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              border: 1.5px solid white;
              white-space: nowrap;
              cursor: pointer;
            ">🏠 ${priceText}</div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([lat, lng], { icon: propIcon });
        marker.on("click", () => {
          if (typeof handlePropertySelect === "function") {
            handlePropertySelect(prop);
          }
        });
        group.addLayer(marker);
      });
    }
  }, [clickMarker, propertyMarkers, handlePropertySelect]);

  // 11. Lớp phủ Quy hoạch (planningData)
  useEffect(() => {
    if (!planningGroupRef.current) return;
    const group = planningGroupRef.current;
    group.clearLayers();

    if (!showPlanningLayer || !planningData?.overlays) return;

    planningData.overlays.forEach((item) => {
      try {
        if (!item?.bounds || !item?.url) return;
        const north = parseFloat(item.bounds.north || item.bounds.North || item.bounds.maxLat);
        const south = parseFloat(item.bounds.south || item.bounds.South || item.bounds.minLat);
        const east = parseFloat(item.bounds.east || item.bounds.East || item.bounds.maxLng);
        const west = parseFloat(item.bounds.west || item.bounds.West || item.bounds.minLng);

        if (isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) return;

        const bounds = [
          [south, west],
          [north, east],
        ];
        const overlay = L.imageOverlay(item.url, bounds, { opacity: planningOpacity });
        group.addLayer(overlay);
      } catch (err) {
        console.warn("Planning layer error:", err);
      }
    });
  }, [planningData, showPlanningLayer, planningOpacity]);

  // 12. Vẽ Chỉ đường (routeData)
  useEffect(() => {
    if (!routeGroupRef.current) return;
    const group = routeGroupRef.current;
    group.clearLayers();

    if (!routeData?.coordinates || routeData.coordinates.length < 2) return;

    const latLngs = routeData.coordinates.map((pt) => [
      pt.lat ?? pt[0],
      pt.lng ?? pt[1],
    ]);

    const polyline = L.polyline(latLngs, {
      color: "#2563eb",
      weight: 5,
      opacity: 0.9,
    });
    group.addLayer(polyline);

    if (leafletMapRef.current) {
      leafletMapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [routeData]);

  // Xử lý Fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 150);
      return next;
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden transition-all duration-300 bg-gray-100 ${
        isFullscreen ? "fixed inset-0 z-[9999] rounded-none !m-0 !h-screen !w-screen" : "w-full h-full"
      }`}
      style={{
        height: isFullscreen ? "100vh" : height || "100%",
        marginTop: "0px",
      }}
    >
      {/* 1. Leaflet Map Canvas Container */}
      <div
        ref={mapCanvasRef}
        className="w-full h-full z-0"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* 2. Map Controls (Top Left Toolbar) */}
      {showControls && (
        <MapControls
          isFullscreen={isFullscreen}
          mapType={mapType}
          setMapType={setMapType}
          planningData={planningData}
          showPlanningLayer={showPlanningLayer}
          setShowPlanningLayer={setShowPlanningLayer}
          planningOpacity={planningOpacity}
          setPlanningOpacity={setPlanningOpacity}
          propertyBoundary={propertyBoundary}
          showBoundaryLayer={showBoundaryLayer}
          setShowBoundaryLayer={setShowBoundaryLayer}
          boundaryOpacity={boundaryOpacity}
          setBoundaryOpacity={setBoundaryOpacity}
          toggleFullscreen={toggleFullscreen}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          clickPointMode={clickPointMode}
          setClickPointMode={setClickPointMode}
          measurementMode={measurementMode}
          setMeasurementMode={setMeasurementMode}
          measurementPoints={measurementPoints}
          setMeasurementPoints={setMeasurementPoints}
          measurementDistance={measurementDistance}
          setMeasurementDistance={setMeasurementDistance}
          propertyCenter={propertyCenter}
          showDirections={showDirections}
          setShowDirections={setShowDirections}
          showNearbyPlaces={showNearbyPlaces}
          setShowNearbyPlaces={setShowNearbyPlaces}
        />
      )}

      {/* 3. Floating Panels */}
      {showDirections && propertyCenter && (
        <div className="animate-slideInRight">
          <DirectionsPanel
            propertyCenter={propertyCenter}
            mapRef={mapRef}
            onClose={() => {
              setShowDirections(false);
              setRouteData(null);
            }}
            onRouteChange={setRouteData}
          />
        </div>
      )}

      {showNearbyPlaces && propertyCenter && (
        <div className="animate-slideInRight">
          <NearbyPlacesPanel
            propertyCenter={propertyCenter}
            mapRef={mapRef}
            onClose={() => setShowNearbyPlaces(false)}
          />
        </div>
      )}

      {showSearch && (
        <div className="animate-slideInTop">
          <SearchPanel
            onClose={() => setShowSearch(false)}
            onSearchCommit={handleSearchCommit}
            onToggleClickMode={() => setClickPointMode(!clickPointMode)}
            isClickModeActive={clickPointMode}
            onBoundaryAdd={onBoundaryAdd}
            searchLoading={searchLoading}
            searchError={searchError}
          />
        </div>
      )}

      {(selectedPlace || selectedProperty) && (
        <div className="absolute z-20 transform -translate-x-1/2 bottom-4 left-1/2 animate-slideInBottom">
          <PlaceDetailCard
            place={selectedPlace}
            propertySummary={selectedProperty}
            relatedProperties={
              relatedProperties?.map((prop) => {
                const fixImagePath = (imagePath) => {
                  if (!imagePath) return "/placeholder.svg?height=200&width=300";
                  if (typeof imagePath === "string" && imagePath.startsWith("http")) {
                    return imagePath;
                  }
                  return `${SERVER_URL}${imagePath}`;
                };

                let fixedHinhAnh = prop.HinhAnh;
                if (Array.isArray(prop.HinhAnh)) {
                  fixedHinhAnh = prop.HinhAnh.map(fixImagePath);
                } else if (prop.HinhAnh) {
                  fixedHinhAnh = [fixImagePath(prop.HinhAnh)];
                } else {
                  fixedHinhAnh = ["/placeholder.svg?height=200&width=300"];
                }

                return {
                  ...prop,
                  HinhAnh: fixedHinhAnh,
                };
              }) || []
            }
            boundaries={placeDetailBoundaries}
            onClose={() => {
              setSelectedPlace(null);
              setSelectedProperty(null);
              setClickMarker(null);
              setPlaceDetailBoundaries([]);
              localStorage.removeItem("mapState");
            }}
            onBoundaryClick={(boundary) => {
              if (boundary.MaTTND) {
                handlePropertySelect(boundary);
              }
            }}
            calculatedArea={calculatedArea}
            serverUrl={SERVER_URL}
          />
        </div>
      )}

      {/* 4. Admin Boundaries Panel (Bottom Right) */}
      <AdminBoundariesPanel
        selectedBoundaries={selectedBoundaries}
        boundaryOpacities={boundaryOpacities}
        setBoundaryOpacities={setBoundaryOpacities}
        handleRemoveBoundary={handleRemoveBoundary}
        handleClearAllBoundaries={handleClearAllBoundaries}
      />
    </div>
  );
};

export default GoogleMapComponent;
