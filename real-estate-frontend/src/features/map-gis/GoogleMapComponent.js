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
import { FaBookOpen, FaArrowsAltH } from "react-icons/fa";
import { createPriceBadgeIcon, createPropertyTooltipHtml } from "./priceMarkerUtils";
import PlanningLegendPanel from "./PlanningLegendPanel";
import MeasurementPanel from "./MeasurementPanel";
import PlanningSwipeSlider, { SAMPLE_PLANNING_DISTRICTS } from "./PlanningSwipeSlider";
import { loadPlanningDataFromUrl } from "../../utils/planningDataLoader";
import {
  calculateGeodesicDistance,
  calculatePolylineDistance,
  calculatePolygonArea as calculateGeoArea,
  getSegmentMidpoint,
  getPolygonCentroid,
  formatMeasureDistance,
  formatMeasureArea,
} from "./measurementUtils";

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
  const [measureType, setMeasureType] = useState("distance"); // "distance" | "area"
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [measurementDistance, setMeasurementDistance] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [showPlanningLegend, setShowPlanningLegend] = useState(false);
  const [routeData, setRouteData] = useState(null);

  // Swipe Slider Comparison States
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [internalPlanningData, setInternalPlanningData] = useState(null);
  const [activeDistrictName, setActiveDistrictName] = useState("TP. Mỹ Tho (2030)");
  const [currentMapZoom, setCurrentMapZoom] = useState(zoom);

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

    // Custom Pane cho Swipe Slider So Sánh Quy Hoạch
    if (!map.getPane("planningSwipePane")) {
      const pPane = map.createPane("planningSwipePane");
      pPane.style.zIndex = 450;
    }

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

    const onZoomEnd = () => {
      setCurrentMapZoom(map.getZoom());
    };
    map.on("zoomend", onZoomEnd);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("resize", onResize);
      map.off("zoomend", onZoomEnd);
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

  // 3. Xử lý Search Nominatim (Tìm kiếm địa chỉ chi tiết theo chuẩn Google Maps)
  const handleSearchCommit = async (query) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const places = await searchPlaces(query, 1);
      const result = places.length > 0 ? places[0] : null;

      if (result) {
        const place = {
          ...result,
          lat: Number.parseFloat(result.lat),
          lng: Number.parseFloat(result.lon || result.lng),
          display_name: result.displayName || result.display_name,
          name: result.name || result.displayName,
        };
        setSelectedPlace(place);
        setSelectedProperty(null);

        // Đặt ghim đỏ chuẩn Google Maps ngay tại vị trí tìm thấy
        setClickMarker({
          lat: place.lat,
          lng: place.lng,
          title: place.name || place.displayName,
        });

        if (leafletMapRef.current) {
          leafletMapRef.current.setView([place.lat, place.lng], 17);
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
        setSearchError(`Không tìm thấy địa điểm "${query}". Bạn hãy thử nhập thêm từ khóa hoặc chọn gợi ý bên dưới.`);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Lỗi kết nối khi tìm kiếm địa chỉ.");
    } finally {
      setSearchLoading(false);
    }
  };

  // 3b. Xử lý khi bấm chọn địa điểm chi tiết từ danh sách gợi ý Autocomplete
  const handlePlaceSelect = useCallback(
    async (place) => {
      if (!place || isNaN(place.lat) || isNaN(place.lng)) return;

      const standardizedPlace = {
        ...place,
        lat: Number(place.lat),
        lng: Number(place.lng),
        display_name: place.displayName || place.display_name || place.name,
        name: place.name || place.displayName,
      };

      setSelectedPlace(standardizedPlace);
      setSelectedProperty(null);

      // Đặt ghim đỏ chuẩn Google Maps ngay lập tức
      setClickMarker({
        lat: standardizedPlace.lat,
        lng: standardizedPlace.lng,
        title: standardizedPlace.name || standardizedPlace.display_name,
      });

      if (leafletMapRef.current) {
        leafletMapRef.current.setView([standardizedPlace.lat, standardizedPlace.lng], 17);
      }

      // Tự động tìm nạp ranh giới và BĐS xung quanh địa điểm
      try {
        const foundBoundaries = await handleSelectByCoordinates(
          standardizedPlace.lat,
          standardizedPlace.lng
        );
        if (foundBoundaries && foundBoundaries.length > 0) {
          const province = foundBoundaries.find((b) => b.level === 1);
          const district = foundBoundaries.find((b) => b.level === 2);
          if (province) {
            await fetchProperties(province.id, district?.id || null);
          }
        }
      } catch (err) {
        console.warn("handlePlaceSelect boundaries error:", err);
      }
    },
    [handleSelectByCoordinates, fetchProperties]
  );

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

  // Con trỏ chữ thập (Crosshair) khi bật thước đo
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const container = leafletMapRef.current.getContainer();
    if (measurementMode) {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
    }
  }, [measurementMode]);

  // 6. Tính khoảng cách đo đạc
  useEffect(() => {
    if (measurementPoints.length > 1) {
      setMeasurementDistance(calculatePolylineDistance(measurementPoints));
    } else {
      setMeasurementDistance(0);
    }
  }, [measurementPoints]);

  // 7. Vẽ Measurement Layer (Khoảng cách & Diện tích)
  useEffect(() => {
    if (!measurementGroupRef.current) return;
    const group = measurementGroupRef.current;
    group.clearLayers();

    if (!measurementMode || measurementPoints.length === 0) return;

    const latLngs = measurementPoints.map((p) => [p.lat, p.lng]);

    // A. Vẽ hình học: Đa giác diện tích (Polygon) hoặc Đường gấp khúc (Polyline)
    if (measureType === "area" && latLngs.length >= 3) {
      // Đa giác khép kín đo diện tích
      const polygon = L.polygon(latLngs, {
        color: "#f59e0b",
        weight: 2.5,
        fillColor: "#fbbf24",
        fillOpacity: 0.25,
        dashArray: "6, 6",
      });
      group.addLayer(polygon);

      // Thẻ diện tích nổi bật tại trọng tâm đa giác (Centroid)
      const centroid = getPolygonCentroid(measurementPoints);
      const area = calculateGeoArea(measurementPoints);
      const areaInfo = formatMeasureArea(area);

      const areaBadge = L.divIcon({
        className: "custom-measure-area",
        html: `
          <div class="measure-area-card">
            <div style="font-size: 10px; color: #fef08a; text-transform: uppercase; letter-spacing: 0.5px;">DIỆN TÍCH</div>
            <div style="font-size: 14px; font-weight: 900; color: #ffffff;">${areaInfo.primary}</div>
            ${areaInfo.ha ? `<div style="font-size: 10.5px; color: #fde047;">${areaInfo.ha}</div>` : ""}
          </div>
        `,
        iconSize: [0, 0],
      });
      group.addLayer(L.marker(centroid, { icon: areaBadge, zIndexOffset: 2500 }));
    } else if (latLngs.length > 1) {
      // Đường gấp khúc đo khoảng cách (hoặc diện tích khi chưa đủ 3 điểm)
      const polyline = L.polyline(latLngs, {
        color: measureType === "area" ? "#f59e0b" : "#ea580c",
        weight: 3,
        dashArray: "7, 5",
      });
      group.addLayer(polyline);
    }

    // B. Nhãn khoảng cách trên từng đoạn thẳng (Segment Midpoints)
    const segmentCount =
      measureType === "area" && latLngs.length >= 3
        ? latLngs.length
        : latLngs.length - 1;

    for (let i = 0; i < segmentCount; i++) {
      const p1 = measurementPoints[i];
      const p2 = measurementPoints[(i + 1) % measurementPoints.length];
      const dist = calculateGeodesicDistance(p1, p2);
      const midpoint = getSegmentMidpoint(p1, p2);

      const segBadge = L.divIcon({
        className: "custom-measure-segment",
        html: `
          <div class="measure-segment-pill">
            ${formatMeasureDistance(dist)}
          </div>
        `,
        iconSize: [0, 0],
      });
      group.addLayer(L.marker(midpoint, { icon: segBadge, zIndexOffset: 1500 }));
    }

    // C. Vẽ các điểm đỉnh đánh số thứ tự (Vertex Pins 1, 2, 3...)
    latLngs.forEach(([lat, lng], idx) => {
      const isLast = idx === latLngs.length - 1;
      const vertexIcon = L.divIcon({
        className: "custom-measure-point",
        html: `
          <div class="measure-vertex-pin ${isLast ? "pin-latest" : ""}">
            ${idx + 1}
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([lat, lng], {
        icon: vertexIcon,
        zIndexOffset: 2000 + idx,
      });

      if (measureType === "distance" && isLast && latLngs.length > 1) {
        const total = calculatePolylineDistance(measurementPoints);
        marker.bindTooltip(`Tổng khoảng cách: ${formatMeasureDistance(total)}`, {
          permanent: true,
          direction: "top",
          className: "measure-segment-pill",
        });
      }

      group.addLayer(marker);
    });
  }, [measurementMode, measurementPoints, measureType]);

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

    // Click / Search Marker (Ghim đỏ chuẩn Google Maps có nhãn tên & hiệu ứng lan tỏa)
    if (clickMarker) {
      const pinTitle = clickMarker.title || "Vị trí đã chọn";
      const pinIcon = L.divIcon({
        className: "custom-search-pin",
        html: `
          <div style="position: relative; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer;">
            <!-- Sóng lan tỏa tiếp đất Google Maps (Ground Ripple) -->
            <div style="position: absolute; bottom: -2px; left: 50%; transform: translate(-50%, 50%); width: 28px; height: 14px; background: rgba(234, 67, 53, 0.4); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            
            <!-- Biểu tượng Ghim đỏ Google Maps đổ bóng 3D -->
            <div style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.55)); transform-origin: bottom center;">
              <svg viewBox="0 0 24 24" width="42" height="42" fill="#ea4335" stroke="#b31412" stroke-width="0.7">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
              </svg>
            </div>

            <!-- Thẻ tên địa danh nổi bật -->
            ${clickMarker.title ? `
              <div style="margin-top: -3px; background: rgba(15, 23, 42, 0.95); color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; font-family: 'Roboto', Arial, sans-serif; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.45); border: 1.5px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 4px;">
                <span style="color: #ef4444;">📍</span>
                <span>${clickMarker.title.length > 28 ? clickMarker.title.slice(0, 28) + '...' : clickMarker.title}</span>
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [0, 0],
      });
      const marker = L.marker([clickMarker.lat, clickMarker.lng], {
        icon: pinIcon,
        zIndexOffset: 3000,
      });
      marker.bindPopup(`
        <div style="font-family: 'Roboto', Arial, sans-serif; padding: 4px; max-width: 260px;">
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">📍 ${pinTitle}</div>
          <div style="font-size: 11px; color: #64748b;">Tọa độ: ${clickMarker.lat.toFixed(6)}, ${clickMarker.lng.toFixed(6)}</div>
        </div>
      `);
      group.addLayer(marker);
    }

    // Property markers (Airbnb & Batdongsan Style Price Badge Pins)
    if (propertyMarkers && propertyMarkers.length > 0) {
      propertyMarkers.forEach((prop) => {
        const lat = Number(prop.GPS_Lat || prop.ToaDoX);
        const lng = Number(prop.GPS_Lng || prop.ToaDoY);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

        const isSelected = selectedProperty && (
          (selectedProperty.MaTTND && prop.MaTTND && selectedProperty.MaTTND === prop.MaTTND) ||
          (selectedProperty.id && prop.id && selectedProperty.id === prop.id)
        );

        const propIcon = createPriceBadgeIcon(prop, isSelected);

        const marker = L.marker([lat, lng], {
          icon: propIcon,
          zIndexOffset: isSelected ? 1000 : prop.Featured ? 500 : 100,
        });

        // Tooltip rich preview card chuẩn Airbnb khi hover
        marker.bindTooltip(createPropertyTooltipHtml(prop), {
          direction: "top",
          offset: [0, -28],
          className: "price-pin-tooltip",
          opacity: 1,
        });

        marker.on("click", () => {
          if (typeof handlePropertySelect === "function") {
            handlePropertySelect(prop);
          }
        });
        group.addLayer(marker);
      });
    }
  }, [clickMarker, propertyMarkers, handlePropertySelect, selectedProperty]);

  // 11. Lớp phủ Quy hoạch (planningData hoặc internalPlanningData mẫu) với Smart LOD
  useEffect(() => {
    if (!planningGroupRef.current) return;
    const group = planningGroupRef.current;
    group.clearLayers();

    const currentPlanning = internalPlanningData || planningData;
    if (!showPlanningLayer || !currentPlanning?.overlays) return;

    // Smart Level-of-Detail (LOD): Nếu tệp có cấu trúc phân cấp pyramid L1..L6 (như Mỹ Tho 386 overlays)
    // thì chỉ nạp đúng 1 cấp zoom phù hợp nhất thay vì load cả 6 cấp đè lên nhau gây lag
    let overlaysToRender = currentPlanning.overlays;
    const hasPyramidLevels = currentPlanning.overlays.some((o) => /_L\d+_/.test(o.url));

    if (hasPyramidLevels) {
      const levelMap = {};
      currentPlanning.overlays.forEach((o) => {
        const m = o.url.match(/_L(\d+)_/);
        const lvl = m ? parseInt(m[1], 10) : 1;
        if (!levelMap[lvl]) levelMap[lvl] = [];
        levelMap[lvl].push(o);
      });

      const available = Object.keys(levelMap).map(Number).sort((a, b) => a - b);
      let targetLevel = available[0];

      if (currentMapZoom <= 13) {
        targetLevel = available.includes(3) ? 3 : available.includes(2) ? 2 : available[0];
      } else if (currentMapZoom <= 15) {
        targetLevel = available.includes(4) ? 4 : available.includes(3) ? 3 : available[available.length - 1];
      } else {
        targetLevel = available.includes(5) ? 5 : available[available.length - 1];
      }

      overlaysToRender = levelMap[targetLevel] || currentPlanning.overlays;
    }

    overlaysToRender.forEach((item) => {
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
        const overlay = L.imageOverlay(item.url, bounds, {
          opacity: planningOpacity,
          pane: "planningSwipePane",
        });
        group.addLayer(overlay);
      } catch (err) {
        console.warn("Planning layer error:", err);
      }
    });
  }, [planningData, internalPlanningData, showPlanningLayer, planningOpacity, currentMapZoom]);

  // Handler chọn khu vực quy hoạch mẫu cho Swipe Slider
  const handleSelectSwipeDistrict = useCallback(async (district) => {
    if (!district?.path) return;
    try {
      setActiveDistrictName(district.name);
      const data = await loadPlanningDataFromUrl(district.path);
      if (data && data.overlays && data.overlays.length > 0) {
        setInternalPlanningData(data);
        setShowPlanningLayer(true);
        setIsSwipeActive(true);
        setMapType("satellite");

        // Bay đến vùng quy hoạch
        if (leafletMapRef.current) {
          const first = data.overlays[0];
          const north = parseFloat(first.bounds.north || first.bounds.North || first.bounds.maxLat);
          const south = parseFloat(first.bounds.south || first.bounds.South || first.bounds.minLat);
          const east = parseFloat(first.bounds.east || first.bounds.East || first.bounds.maxLng);
          const west = parseFloat(first.bounds.west || first.bounds.West || first.bounds.minLng);

          if (!isNaN(north) && !isNaN(south) && !isNaN(east) && !isNaN(west)) {
            leafletMapRef.current.fitBounds(
              [
                [south, west],
                [north, east],
              ],
              { padding: [50, 50], maxZoom: 14 }
            );
          }
        }
      }
    } catch (err) {
      console.warn("handleSelectSwipeDistrict error:", err);
    }
  }, []);

  // Handler Bật/Tắt chế độ So Sánh Quy Hoạch Swipe
  const handleToggleSwipe = useCallback(async () => {
    if (!isSwipeActive) {
      setIsSwipeActive(true);
      setShowPlanningLayer(true);
      setPlanningOpacity(0.95);
      setMapType("satellite"); // Tự động chọn Vệ tinh làm nền Hiện trạng sắc nét nhất

      if (!internalPlanningData && !planningData) {
        await handleSelectSwipeDistrict(SAMPLE_PLANNING_DISTRICTS[0]);
      }
    } else {
      setIsSwipeActive(false);
    }
  }, [isSwipeActive, internalPlanningData, planningData, handleSelectSwipeDistrict]);

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
          showPlanningLegend={showPlanningLegend}
          setShowPlanningLegend={setShowPlanningLegend}
          isSwipeActive={isSwipeActive}
          onToggleSwipe={handleToggleSwipe}
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

      {/* 4. Measurement Panel (Thước đo khoảng cách & diện tích) */}
      {measurementMode && (
        <MeasurementPanel
          measureType={measureType}
          setMeasureType={setMeasureType}
          measurementPoints={measurementPoints}
          onUndo={() => {
            setMeasurementPoints((prev) => prev.slice(0, -1));
          }}
          onClear={() => {
            setMeasurementPoints([]);
            setMeasurementDistance(0);
          }}
          onClose={() => {
            setMeasurementMode(false);
            setMeasurementPoints([]);
            setMeasurementDistance(0);
          }}
        />
      )}

      {showSearch && (
        <div className="animate-slideInTop">
          <SearchPanel
            onClose={() => setShowSearch(false)}
            onSearchCommit={handleSearchCommit}
            onPlaceSelect={handlePlaceSelect}
            onToggleClickMode={() => setClickPointMode(!clickPointMode)}
            isClickModeActive={clickPointMode}
            onBoundaryAdd={onBoundaryAdd}
            onSelect={onBoundaryAdd}
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

      {/* 4. Admin Boundaries Panel (Bottom Right) - Ẩn khi đang bật thanh trượt so sánh để tránh che hoặc xung đột */}
      {!isSwipeActive && (
        <AdminBoundariesPanel
          selectedBoundaries={selectedBoundaries}
          boundaryOpacities={boundaryOpacities}
          setBoundaryOpacities={setBoundaryOpacities}
          handleRemoveBoundary={handleRemoveBoundary}
          handleClearAllBoundaries={handleClearAllBoundaries}
        />
      )}

      {/* 5. Planning Legend Panel & Trigger Buttons (Bottom Left) */}
      {showPlanningLegend && (
        <PlanningLegendPanel onClose={() => setShowPlanningLegend(false)} />
      )}

      {/* Trigger Buttons (Bottom Left) - Ẩn khi Bảng chú giải đang mở */}
      {!showPlanningLegend && (
        <div className="absolute z-10 bottom-4 left-4 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowPlanningLegend(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 hover:text-blue-600 rounded-2xl shadow-xl border border-slate-200/90 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Mở Bảng chú giải màu sắc quy hoạch & ký hiệu loại đất"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 via-amber-400 to-emerald-500 animate-pulse" />
            <FaBookOpen className="text-blue-600 text-xs" />
            <span>Chú giải Quy hoạch</span>
          </button>

          {/* Nút bật nhanh So Sánh Swipe */}
          {!isSwipeActive && (
            <button
              onClick={handleToggleSwipe}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-xl border border-purple-400/40 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Thanh trượt so sánh Quy hoạch chia đôi màn hình (Before/After Swipe Slider)"
            >
              <FaArrowsAltH className="text-sky-300 text-xs animate-pulse" />
              <span>So sánh Swipe</span>
            </button>
          )}
        </div>
      )}

      {/* 6. Planning Swipe Slider (Chia đôi màn hình) */}
      {isSwipeActive && (
        <PlanningSwipeSlider
          mapRef={mapRef}
          isActive={isSwipeActive}
          onClose={() => setIsSwipeActive(false)}
          activeDistrictName={activeDistrictName}
          onSelectDistrict={handleSelectSwipeDistrict}
          planningOpacity={planningOpacity}
          setPlanningOpacity={setPlanningOpacity}
        />
      )}
    </div>
  );
};

export default GoogleMapComponent;
