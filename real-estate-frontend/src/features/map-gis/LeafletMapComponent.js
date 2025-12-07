"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaCompress, FaExpand, FaLayerGroup, FaRedo, FaEye, FaEyeSlash } from "react-icons/fa";

// Map tile layers - 100% MIỄN PHÍ KHÔNG CẦN API KEY / THẺ VISA
const TILE_LAYERS = {
  googleHybrid: {
    name: "Vệ tinh Google",
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    attribution: "&copy; Google Maps (Satellite)",
    icon: "🛰️",
  },
  osmStreet: {
    name: "Bản đồ đường",
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    attribution: "&copy; Google Maps",
    icon: "🗺️",
  },
  esriSatellite: {
    name: "Vệ tinh Esri",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    subdomains: ["a", "b", "c"],
    maxZoom: 19,
    attribution: "&copy; Esri World Imagery",
    icon: "🌍",
  },
};

/**
 * Chuẩn hóa danh sách tọa độ (hỗ trợ cả dạng [{lat, lng}], [[lat, lng]], hoặc {latitude, longitude})
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

/**
 * Tính tâm đa giác
 */
function computePolygonCenter(points) {
  if (!points || points.length === 0) return null;
  let sumLat = 0;
  let sumLng = 0;
  points.forEach(([lat, lng]) => {
    sumLat += lat;
    sumLng += lng;
  });
  return [sumLat / points.length, sumLng / points.length];
}

const LeafletMapComponent = ({
  center = { lat: 10.8231, lng: 106.6297 },
  zoom = 16,
  propertyBoundary = null,
  propertyArea = null,
  planningData = null,
  height = "400px",
  showControls = true,
  showMode = "property",
  onMapClick = null,
  propertyMarkers = [],
  onPropertySelect = null,
  selectedBoundaries = [],
  boundaryOpacity: initialBoundaryOpacity = 0.35,
  className = "",
  routeData = null,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const activeTileLayerRef = useRef(null);
  const boundaryLayerGroupRef = useRef(null);
  const planningLayerGroupRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const routeLayerGroupRef = useRef(null);

  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // States
  const [activeTileKey, setActiveTileKey] = useState("googleHybrid");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBoundary, setShowBoundary] = useState(true);
  const [boundaryOpacity, setBoundaryOpacity] = useState(initialBoundaryOpacity);
  const [showPlanning, setShowPlanning] = useState(true);

  // Chuẩn hóa center an toàn
  const safeCenter = useMemo(() => {
    const lat = Number(center?.lat ?? center?.latitude ?? 10.8231);
    const lng = Number(center?.lng ?? center?.longitude ?? 106.6297);
    return [
      isNaN(lat) || !isFinite(lat) ? 10.8231 : lat,
      isNaN(lng) || !isFinite(lng) ? 106.6297 : lng,
    ];
  }, [center]);

  // Chuẩn hóa boundary
  const normalizedBoundary = useMemo(() => {
    return normalizeCoordinates(propertyBoundary);
  }, [propertyBoundary]);

  // 1. Khởi tạo Leaflet Map (Chỉ 1 lần khi mount)
  useEffect(() => {
    if (!containerRef.current) return;

    // Nếu đã có map instance cũ thì dọn dẹp
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: safeCenter,
      zoom: zoom,
      zoomControl: false, // Tự làm zoom control hoặc đặt vị trí tùy chọn
      attributionControl: false,
    });

    // Tạo các LayerGroups để quản lý từng lớp độc lập
    boundaryLayerGroupRef.current = L.layerGroup().addTo(map);
    planningLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);

    // Thêm tile layer ban đầu (Google Hybrid)
    const initialTile = TILE_LAYERS[activeTileKey] || TILE_LAYERS.googleHybrid;
    activeTileLayerRef.current = L.tileLayer(initialTile.url, {
      maxZoom: initialTile.maxZoom,
      subdomains: initialTile.subdomains || ["mt0", "mt1", "mt2", "mt3"],
      attribution: initialTile.attribution,
    }).addTo(map);

    // Attribution control góc dưới phải (nhỏ gọn)
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

    // Zoom control góc dưới phải (để không che các control bên trên)
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Event click map nếu có
    map.on("click", (e) => {
      if (typeof onMapClickRef.current === "function") {
        onMapClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapRef.current = map;

    // Fix bug tile hiển thị xám khi container vừa render xong
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
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // 2. Chuyển đổi Tile Layer khi activeTileKey thay đổi
  useEffect(() => {
    if (!mapRef.current) return;
    const tileConfig = TILE_LAYERS[activeTileKey];
    if (!tileConfig) return;

    if (activeTileLayerRef.current) {
      mapRef.current.removeLayer(activeTileLayerRef.current);
    }

    activeTileLayerRef.current = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      subdomains: tileConfig.subdomains || ["mt0", "mt1", "mt2", "mt3"],
      attribution: tileConfig.attribution,
    }).addTo(mapRef.current);
  }, [activeTileKey]);

  // 3. Vẽ Thửa đất VN2000 (Polygon) & các điểm góc, nhãn diện tích
  useEffect(() => {
    if (!mapRef.current || !boundaryLayerGroupRef.current) return;
    const layerGroup = boundaryLayerGroupRef.current;
    layerGroup.clearLayers();

    if (!showBoundary || normalizedBoundary.length < 3) {
      // Nếu không có boundary, vẽ GPS marker tại center nếu showMode === 'property'
      if (normalizedBoundary.length === 0 && safeCenter) {
        const pinIcon = L.divIcon({
          className: "custom-gps-pin",
          html: `
            <div style="position: relative; width: 34px; height: 34px; transform: translate(-50%, -100%);">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `,
          iconSize: [0, 0],
        });
        const marker = L.marker(safeCenter, { icon: pinIcon });
        marker.bindPopup(`
          <div style="font-family: Roboto, sans-serif; font-size: 13px; line-height: 1.4;">
            <strong style="color: #1e3a8a;">📍 Vị trí bất động sản</strong>
            <div style="margin-top: 4px; color: #4b5563;">Vĩ độ: ${safeCenter[0].toFixed(6)}<br/>Kinh độ: ${safeCenter[1].toFixed(6)}</div>
          </div>
        `);
        layerGroup.addLayer(marker);
      }
      return;
    }

    // A. Vẽ đa giác thửa đất
    const polygon = L.polygon(normalizedBoundary, {
      color: "#dc2626", // Viền đỏ đậm
      weight: 3,
      opacity: 0.95,
      fillColor: "#ef4444",
      fillOpacity: boundaryOpacity,
      dashArray: "6, 4",
    });

    polygon.bindPopup(`
      <div style="font-family: Roboto, sans-serif; font-size: 13px; line-height: 1.5;">
        <strong style="color: #b91c1c;">📋 Ranh giới thửa đất VN2000</strong>
        <p style="margin: 4px 0 0 0; color: #374151;">Số điểm góc: <b>${normalizedBoundary.length} điểm</b></p>
        ${
          propertyArea
            ? `<p style="margin: 2px 0 0 0; color: #15803d; font-weight: bold;">Diện tích: ${Number(propertyArea).toLocaleString('vi-VN')} m²</p>`
            : ""
        }
      </div>
    `);
    layerGroup.addLayer(polygon);

    // B. Đánh số thứ tự các đỉnh góc (1, 2, 3...)
    normalizedBoundary.forEach(([lat, lng], idx) => {
      const cornerBadge = L.divIcon({
        className: "custom-corner-badge",
        html: `
          <div style="
            position: relative;
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
            cursor: pointer;
            transition: transform 0.15s ease;
          " onmouseover="this.style.transform='translate(-50%, -50%) scale(1.2)'" onmouseout="this.style.transform='translate(-50%, -50%) scale(1)'">
            ${idx + 1}
          </div>
        `,
        iconSize: [0, 0],
      });

      const cornerMarker = L.marker([lat, lng], { icon: cornerBadge });
      cornerMarker.bindPopup(`
        <div style="font-family: Roboto, sans-serif; font-size: 12px;">
          <strong style="color: #dc2626;">Đỉnh góc ${idx + 1}</strong>
          <div style="color: #4b5563; margin-top: 2px;">
            X (Lat): ${lat.toFixed(6)}<br/>
            Y (Lng): ${lng.toFixed(6)}
          </div>
        </div>
      `);
      layerGroup.addLayer(cornerMarker);
    });

    // C. Nhãn diện tích ở tâm thửa đất
    const centerPoint = computePolygonCenter(normalizedBoundary);
    if (centerPoint && (propertyArea || propertyArea === 0)) {
      const areaText = `${Number(propertyArea).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} m²`;
      const areaBadge = L.divIcon({
        className: "custom-area-badge",
        html: `
          <div style="
            position: relative;
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
            pointer-events: auto;
          ">
            📐 ${areaText}
          </div>
        `,
        iconSize: [0, 0],
      });
      const areaMarker = L.marker(centerPoint, { icon: areaBadge });
      layerGroup.addLayer(areaMarker);
    }

    // Tự động căn chỉnh vừa vặn khung nhìn với đa giác
    try {
      const bounds = polygon.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 19 });
      }
    } catch (e) {
      console.warn("Could not fit bounds:", e);
    }
  }, [normalizedBoundary, showBoundary, boundaryOpacity, propertyArea, safeCenter, showMode]);

  // 4. Lớp phủ Quy hoạch (Planning Overlay)
  useEffect(() => {
    if (!mapRef.current || !planningLayerGroupRef.current) return;
    const layerGroup = planningLayerGroupRef.current;
    layerGroup.clearLayers();

    if (!showPlanning || !planningData || !planningData.overlays) return;

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
        const overlay = L.imageOverlay(item.url, bounds, { opacity: 0.7 });
        layerGroup.addLayer(overlay);
      } catch (err) {
        console.warn("Planning layer render error:", err);
      }
    });
  }, [planningData, showPlanning]);

  // 5. Quản lý Ranh giới hành chính được chọn (selectedBoundaries)
  useEffect(() => {
    if (!mapRef.current || !markersLayerGroupRef.current) return;
    const layerGroup = markersLayerGroupRef.current;
    layerGroup.clearLayers();

    if (selectedBoundaries && selectedBoundaries.length > 0) {
      selectedBoundaries.forEach((boundary) => {
        const coords = normalizeCoordinates(boundary.coordinates);
        if (coords.length >= 3) {
          const poly = L.polygon(coords, {
            color: boundary.color || "#3b82f6",
            weight: 2,
            opacity: 0.8,
            fillColor: boundary.color || "#3b82f6",
            fillOpacity: 0.25,
          });
          poly.bindPopup(`<b>${boundary.name || "Ranh giới"}</b>`);
          layerGroup.addLayer(poly);
        }
      });
    }

    // Property markers nếu có trong danh sách
    if (propertyMarkers && propertyMarkers.length > 0) {
      propertyMarkers.forEach((prop) => {
        const lat = Number(prop.GPS_Lat || prop.ToaDoX);
        const lng = Number(prop.GPS_Lng || prop.ToaDoY);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

        const priceText = prop.Gia
          ? prop.Gia >= 1000000000
            ? `${(prop.Gia / 1000000000).toFixed(1)} tỷ`
            : `${(prop.Gia / 1000000).toFixed(0)} tr`
          : "Xem";

        const propIcon = L.divIcon({
          className: "custom-property-pin",
          html: `
            <div style="
              position: relative;
              transform: translate(-50%, -100%);
              background: #2563eb;
              color: white;
              padding: 3px 7px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              border: 1.5px solid white;
              white-space: nowrap;
              cursor: pointer;
            ">
              🏠 ${priceText}
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([lat, lng], { icon: propIcon });
        marker.on("click", () => {
          if (typeof onPropertySelect === "function") {
            onPropertySelect(prop);
          }
        });
        marker.bindPopup(`
          <div style="font-family: Roboto, sans-serif; font-size: 12px; max-width: 200px;">
            <strong style="color: #1e40af;">${prop.TieuDe || "Bất động sản"}</strong>
            <p style="margin: 4px 0 0 0; color: #dc2626; font-weight: bold;">${priceText}</p>
            <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 11px;">${prop.DiaChi || ""}</p>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    }
  }, [selectedBoundaries, propertyMarkers, onPropertySelect]);

  // 6. Quản lý Route / Lộ trình chỉ đường & khoảng cách
  useEffect(() => {
    if (!mapRef.current || !routeLayerGroupRef.current) return;
    const layerGroup = routeLayerGroupRef.current;
    layerGroup.clearLayers();

    if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
      return;
    }

    // Format coordinates: OSRM trả về [lng, lat]
    const points = routeData.coordinates.map((c) => {
      let lat = Array.isArray(c) ? c[1] : (c.lat ?? c[1]);
      let lng = Array.isArray(c) ? c[0] : (c.lng ?? c[0]);
      // Nhận diện đảo lat/lng nếu ở VN (lat ~ 8-24, lng ~ 102-110)
      if (lat > 50 && lng < 30) {
        const tmp = lat;
        lat = lng;
        lng = tmp;
      }
      return [Number(lat), Number(lng)];
    }).filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));

    if (points.length < 2) return;

    // Viền đậm bên ngoài (casing) tạo hiệu ứng đường đi nổi bật
    const casingPolyline = L.polyline(points, {
      color: "#1e3a8a",
      weight: 8,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
    });
    layerGroup.addLayer(casingPolyline);

    // Đường chỉ dẫn chính giữa (màu xanh dương sáng)
    const mainPolyline = L.polyline(points, {
      color: "#3b82f6",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    });
    layerGroup.addLayer(mainPolyline);

    // Marker điểm xuất phát (Origin)
    const originLat = routeData.origin?.lat ?? points[0][0];
    const originLng = routeData.origin?.lng ?? points[0][1];
    const originTitle = routeData.origin?.address || routeData.origin?.title || "Vị trí của bạn";

    const originIcon = L.divIcon({
      className: "custom-route-origin-pin",
      html: `
        <div style="position: relative; transform: translate(-50%, -100%);">
          <div style="
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #ffffff;
            padding: 5px 11px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45);
            border: 2px solid #ffffff;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 5px;
          ">
            <span>📍 Điểm xuất phát</span>
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #1d4ed8; margin: 0 auto;"></div>
        </div>
      `,
      iconSize: [0, 0],
    });

    const originMarker = L.marker([originLat, originLng], { icon: originIcon });
    originMarker.bindPopup(`
      <div style="font-family: Roboto, sans-serif; font-size: 13px; line-height: 1.4;">
        <strong style="color: #2563eb;">📍 Điểm xuất phát</strong>
        <p style="margin: 4px 0 0; color: #4b5563;">${originTitle}</p>
        <div style="margin-top: 4px; font-size: 11px; color: #9ca3af;">
          (${originLat.toFixed(5)}, ${originLng.toFixed(5)})
        </div>
      </div>
    `);
    layerGroup.addLayer(originMarker);

    // Tự động căn chỉnh bao trọn lộ trình
    try {
      const bounds = casingPolyline.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 17,
        });
      }
    } catch (e) {
      console.warn("Could not fit route bounds:", e);
    }
  }, [routeData]);

  // Xử lý nút Reset View (căn lại giữa thửa đất hoặc center)
  const handleResetView = useCallback(() => {
    if (!mapRef.current) return;
    if (normalizedBoundary.length >= 3) {
      const poly = L.polygon(normalizedBoundary);
      mapRef.current.fitBounds(poly.getBounds(), { padding: [35, 35], maxZoom: 19 });
    } else {
      mapRef.current.setView(safeCenter, zoom);
    }
  }, [normalizedBoundary, safeCenter, zoom]);

  // Xử lý bật/tắt Fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 150);
      return next;
    });
  }, []);

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 bg-gray-100 rounded-xl shadow-md ${
        isFullscreen ? "fixed inset-0 z-[9999] rounded-none !m-0 !h-screen !w-screen" : ""
      } ${className}`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* Map DOM Container */}
      <div
        ref={containerRef}
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

      {/* Top Floating Control Bar */}
      {showControls && (
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Layer Switcher (Bản đồ / Vệ tinh Google / Vệ tinh Esri) */}
          <div className="flex p-0.5 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-gray-200 text-xs font-medium">
            {Object.entries(TILE_LAYERS).map(([key, config]) => {
              const isActive = activeTileKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTileKey(key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${
                    isActive
                      ? "bg-blue-600 text-white font-bold shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title={config.name}
                >
                  <span>{config.icon}</span>
                  <span className="hidden sm:inline">{config.name}</span>
                </button>
              );
            })}
          </div>

          {/* Nút Bật/Tắt hiển thị ranh giới thửa đất (nếu có boundary) */}
          {normalizedBoundary.length >= 3 && (
            <button
              type="button"
              onClick={() => setShowBoundary((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg shadow-md border transition-all ${
                showBoundary
                  ? "bg-white/95 text-red-600 border-red-200 hover:bg-red-50"
                  : "bg-gray-200/90 text-gray-500 border-gray-300 line-through"
              }`}
              title={showBoundary ? "Ẩn ranh giới thửa đất" : "Hiện ranh giới thửa đất"}
            >
              {showBoundary ? <FaEye /> : <FaEyeSlash />}
              <span className="hidden sm:inline">Ranh giới</span>
            </button>
          )}

          {/* Nút Bật/Tắt Lớp phủ quy hoạch (nếu có planningData) */}
          {planningData && (
            <button
              type="button"
              onClick={() => setShowPlanning((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg shadow-md border transition-all ${
                showPlanning
                  ? "bg-white/95 text-purple-600 border-purple-200 hover:bg-purple-50"
                  : "bg-gray-200/90 text-gray-500 border-gray-300 line-through"
              }`}
              title={showPlanning ? "Ẩn lớp quy hoạch" : "Hiện lớp quy hoạch"}
            >
              <FaLayerGroup />
              <span className="hidden sm:inline">Quy hoạch</span>
            </button>
          )}
        </div>
      )}

      {/* Right Top Action Buttons: Reset View & Fullscreen */}
      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto">
          {/* Nút Reset View */}
          <button
            type="button"
            onClick={handleResetView}
            className="flex items-center justify-center w-8 h-8 text-gray-700 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95"
            title="Căn giữa ranh giới thửa đất"
          >
            <FaRedo className="text-xs" />
          </button>

          {/* Nút Toàn màn hình */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-8 h-8 text-gray-700 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95"
            title={isFullscreen ? "Thu nhỏ" : "Xem toàn màn hình"}
          >
            {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
          </button>
        </div>
      )}

      {/* Bottom Left Note / Status badge */}
      <div className="absolute bottom-2 left-2 z-[1000] pointer-events-none">
        <div className="px-2 py-1 text-[11px] font-medium bg-black/60 text-white rounded backdrop-blur-sm shadow flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Bản đồ mở (Open GIS) - Miễn phí</span>
        </div>
      </div>
    </div>
  );
};

export default LeafletMapComponent;
