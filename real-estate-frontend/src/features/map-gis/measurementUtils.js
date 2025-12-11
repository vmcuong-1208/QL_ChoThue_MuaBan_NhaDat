/**
 * GIS Measurement Utilities - Geodesic Distance & Spherical Polygon Area
 * Chuẩn tính toán trắc địa WGS84 cho bản đồ số
 */

const EARTH_RADIUS = 6378137; // Bán kính Trái Đất chuẩn WGS84 (mét)

/**
 * Tính khoảng cách trắc địa giữa 2 tọa độ GPS (Haversine Formula)
 * @param {{ lat: number, lng: number } | [number, number]} p1
 * @param {{ lat: number, lng: number } | [number, number]} p2
 * @returns {number} Khoảng cách bằng mét (meters)
 */
export function calculateGeodesicDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const lat1 = Number(p1.lat ?? p1[0]);
  const lng1 = Number(p1.lng ?? p1[1]);
  const lat2 = Number(p2.lat ?? p2[0]);
  const lng2 = Number(p2.lng ?? p2[1]);

  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return 0;

  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
}

/**
 * Tính tổng chiều dài đường gấp khúc (Polyline Distance)
 * @param {Array<{lat: number, lng: number}>} points
 * @returns {number} Mét
 */
export function calculatePolylineDistance(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateGeodesicDistance(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Tính chu vi đa giác khép kín (Polygon Perimeter)
 * @param {Array<{lat: number, lng: number}>} points
 * @returns {number} Mét
 */
export function calculatePolygonPerimeter(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  if (points.length === 2) return calculateGeodesicDistance(points[0], points[1]);
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    total += calculateGeodesicDistance(points[i], points[next]);
  }
  return total;
}

/**
 * Tính diện tích đa giác mặt cầu (Spherical Excess Area Formula)
 * Chuẩn thuật toán Chamberlain-Duquette (1964) / Girard's Spherical Excess
 * @param {Array<{lat: number, lng: number}>} points
 * @returns {number} Diện tích bằng mét vuông (m²)
 */
export function calculatePolygonArea(points) {
  if (!Array.isArray(points) || points.length < 3) return 0;

  let total = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const pPrev = points[(i - 1 + n) % n];
    const pCurr = points[i];
    const pNext = points[(i + 1) % n];

    const latRad = (Number(pCurr.lat ?? pCurr[0]) * Math.PI) / 180;
    const lngPrevRad = (Number(pPrev.lng ?? pPrev[1]) * Math.PI) / 180;
    const lngNextRad = (Number(pNext.lng ?? pNext[1]) * Math.PI) / 180;

    total += (lngNextRad - lngPrevRad) * Math.sin(latRad);
  }

  const area = Math.abs((total * EARTH_RADIUS * EARTH_RADIUS) / 2);
  return area;
}

/**
 * Lấy tọa độ điểm giữa của 1 đoạn thẳng (Midpoint)
 */
export function getSegmentMidpoint(p1, p2) {
  const lat1 = Number(p1.lat ?? p1[0]);
  const lng1 = Number(p1.lng ?? p1[1]);
  const lat2 = Number(p2.lat ?? p2[0]);
  const lng2 = Number(p2.lng ?? p2[1]);
  return [(lat1 + lat2) / 2, (lng1 + lng2) / 2];
}

/**
 * Lấy trọng tâm hình học (Centroid) của đa giác
 */
export function getPolygonCentroid(points) {
  if (!Array.isArray(points) || points.length === 0) return [0, 0];
  let sumLat = 0;
  let sumLng = 0;
  points.forEach((p) => {
    sumLat += Number(p.lat ?? p[0]);
    sumLng += Number(p.lng ?? p[1]);
  });
  return [sumLat / points.length, sumLng / points.length];
}

/**
 * Định dạng khoảng cách sang chuỗi tiếng Việt dễ hiểu
 * @param {number} meters
 * @returns {string} ví dụ: "152.4 m" hoặc "3.45 km"
 */
export function formatMeasureDistance(meters) {
  if (meters == null || isNaN(meters) || meters <= 0) return "0 m";
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(1)} m`;
}

/**
 * Định dạng diện tích sang chuỗi phong phú (m², ha, sào)
 * @param {number} sqMeters
 */
export function formatMeasureArea(sqMeters) {
  if (sqMeters == null || isNaN(sqMeters) || sqMeters <= 0) {
    return {
      primary: "0 m²",
      m2: "0 m²",
      ha: "0 ha",
      sao: "0 sào",
    };
  }

  const m2Formatted = `${Math.round(sqMeters).toLocaleString("vi-VN")} m²`;
  const ha = sqMeters / 10000;
  const sao = sqMeters / 360; // Chuẩn Sào Bắc Bộ 360m²

  if (sqMeters >= 10000) {
    return {
      primary: `${ha.toFixed(2)} ha`,
      m2: m2Formatted,
      ha: `${ha.toFixed(2)} ha`,
      sao: `${sao.toFixed(1)} sào`,
    };
  }

  return {
    primary: `${sqMeters >= 10 ? Math.round(sqMeters).toLocaleString("vi-VN") : sqMeters.toFixed(1)} m²`,
    m2: m2Formatted,
    ha: ha >= 0.01 ? `${ha.toFixed(2)} ha` : null,
    sao: sao >= 1 ? `${sao.toFixed(1)} sào` : null,
  };
}
