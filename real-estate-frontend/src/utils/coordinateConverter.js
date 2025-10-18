// Utility để chuyển đổi tọa độ VN2000 sang WGS84 (Frontend version)
// Sử dụng công thức chuyển đổi theo Quyết định 12/2002/NĐ-CP

/**
 * Bảng tham số chuyển đổi cho các múi chiếu VN2000
 * Dựa trên Quyết định 12/2002/NĐ-CP
 */
export const VN2000_ZONES = {
  "104°00'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 104 },
  "104°15'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 104.25 },
  "104°30'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 104.5 },
  "104°45'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 104.75 },
  "105°00'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 105 },
  "105°30'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 105.5 },
  "105°45'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 105.75 },
  "106°00'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 106 },
  "106°15'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 106.25 },
  "106°30'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 106.5 },
  "107°00'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 107 },
  "107°15'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 107.25 },
  "107°45'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 107.75 },
  "108°00'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 108 },
  "108°15'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 108.25 },
  "108°30'": { deltaX0: -191.90441429, deltaY0: -39.30318279, deltaZ0: -111.45032835, zone: 108.5 },
}

/**
 * Chuyển đổi tọa độ VN2000 sang WGS84
 * @param {number} x - Tọa độ X trong hệ VN2000 (mét) - Northing
 * @param {number} y - Tọa độ Y trong hệ VN2000 (mét) - Easting
 * @param {string} muiChieu - Múi chiếu (VD: "104°45'", "107°00'")
 * @returns {object} - {lat, lng} trong hệ WGS84
 */
export function vn2000ToWGS84(x, y, muiChieu) {
  // Lấy tham số múi chiếu
  const zoneParams = VN2000_ZONES[muiChieu]
  if (!zoneParams) {
    throw new Error(`Múi chiếu không hợp lệ: ${muiChieu}`)
  }

  const { zone, deltaX0, deltaY0, deltaZ0 } = zoneParams  // Lấy delta cho transformation

  const centralMeridian = zone // Kinh tuyến trục (độ thập phân)
  const falseEasting = 500000
  const falseNorthing = 0
  const scale = 0.9999

  const a = 6378137.0
  const f = 1 / 298.257223563
  const e2 = 2 * f - f * f
  const e = Math.sqrt(e2)

  // Bước 1: Inverse projection TM → lat/lon trên VN datum
  const M = (x - falseNorthing) / scale
  const mu = M / (a * (1 - e2 / 4 - (3 * Math.pow(e2, 2)) / 64 - (5 * Math.pow(e2, 3)) / 256))

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))

  const phi1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) +
               (21 * Math.pow(e1, 2) / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) +
               (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu) +
               (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu)

  const C1 = e2 / (1 - e2) * Math.pow(Math.cos(phi1), 2)
  const T1 = Math.pow(Math.tan(phi1), 2)
  const N1 = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(phi1), 2))
  const R1 = (a * (1 - e2)) / Math.pow(1 - e2 * Math.pow(Math.sin(phi1), 2), 1.5)
  const D = (y - falseEasting) / (N1 * scale)

  const latRad = phi1 - (N1 * Math.tan(phi1) / R1) *
                 (D ** 2 / 2 -
                  (5 + 3 * T1 + 10 * C1 - 4 * Math.pow(C1, 2) - 9 * (e2 / (1 - e2))) * D ** 4 / 24 +
                  (61 + 90 * T1 + 298 * C1 + 45 * Math.pow(T1, 2) - 252 * (e2 / (1 - e2)) - 3 * Math.pow(C1, 2)) * D ** 6 / 720)

  const lonRad = (centralMeridian * Math.PI) / 180 +
                 (D -
                  (1 + 2 * T1 + C1) * D ** 3 / 6 +
                  (5 - 2 * C1 + 28 * T1 - 3 * Math.pow(C1, 2) + 8 * (e2 / (1 - e2)) + 24 * Math.pow(T1, 2)) * D ** 5 / 120) /
                 Math.cos(phi1)

  // Bước 2: Geodetic VN to ECEF VN (h=0)
  const phi = latRad
  const lambda = lonRad
  const h = 0

  const N = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(phi), 2))

  const X_vn = (N + h) * Math.cos(phi) * Math.cos(lambda)
  const Y_vn = (N + h) * Math.cos(phi) * Math.sin(lambda)
  const Z_vn = (N * (1 - e2) + h) * Math.sin(phi)

  // Bước 3: Apply Helmert translation (VN to WGS84)
  const X_wgs = X_vn + deltaX0
  const Y_wgs = Y_vn + deltaY0
  const Z_wgs = Z_vn + deltaZ0

  // Bước 4: ECEF WGS to geodetic lat/lon WGS
  const p = Math.sqrt(X_wgs ** 2 + Y_wgs ** 2)
  const theta = Math.atan2(Z_wgs * a, p * (a * Math.sqrt(1 - e2)))

  const mu_wgs = Math.atan2(Z_wgs, p * Math.sqrt(1 - e2))
  const sin_mu = Math.sin(mu_wgs)
  const cos_mu = Math.cos(mu_wgs)

  const latRad_wgs = Math.atan2(
    Z_wgs + (a * e2 / Math.sqrt(1 - e2)) * Math.pow(sin_mu, 3),
    p - a * e2 * Math.pow(cos_mu, 3)
  )

  const lonRad_wgs = Math.atan2(Y_wgs, X_wgs)

  const latDeg = (latRad_wgs * 180) / Math.PI
  const lngDeg = (lonRad_wgs * 180) / Math.PI

  console.log("[v0] VN2000 to WGS84 conversion:", {
    input: { x, y, muiChieu },
    vn_lat: (latRad * 180) / Math.PI,
    vn_lng: (lonRad * 180) / Math.PI,
    output: { latDeg, lngDeg },
  })

  return {
    lat: latDeg,
    lng: lngDeg,
  }
}

/**
 * Chuyển đổi nhiều điểm tọa độ VN2000 sang WGS84
 * @param {Array} coordinates - Mảng các điểm [{x, y}, ...]
 * @param {string} muiChieu - Múi chiếu
 * @returns {Array} - Mảng các điểm [{lat, lng}, ...]
 */
export function convertMultiplePoints(coordinates, muiChieu) {
  return coordinates.map((point) => vn2000ToWGS84(point.x, point.y, muiChieu))
}

/**
 * Tính diện tích đa giác từ các tọa độ WGS84
 * Sử dụng công thức Shoelace (Gauss area formula)
 * @param {Array} coordinates - Mảng các điểm [{lat, lng}, ...]
 * @returns {number} - Diện tích (m²)
 */
export function calculatePolygonArea(coordinates) {
  if (coordinates.length < 3) {
    return 0
  }

  // Chuyển đổi lat/lng sang tọa độ Cartesian (đơn giản hóa)
  // Đối với diện tích nhỏ, có thể sử dụng phép chiếu đơn giản
  const R = 6378137 // Bán kính Trái Đất (mét)

  // Tính tâm đa giác
  const centerLat = coordinates.reduce((sum, p) => sum + p.lat, 0) / coordinates.length
  const centerLng = coordinates.reduce((sum, p) => sum + p.lng, 0) / coordinates.length

  // Chuyển đổi sang tọa độ Cartesian cục bộ
  const points = coordinates.map((p) => {
    const x = ((R * ((p.lng - centerLng) * Math.PI)) / 180) * Math.cos((centerLat * Math.PI) / 180)
    const y = (R * ((p.lat - centerLat) * Math.PI)) / 180
    return { x, y }
  })

  // Áp dụng công thức Shoelace
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }

  return Math.abs(area / 2)
}

/**
 * Tính khoảng cách giữa 2 điểm WGS84 (Haversine formula)
 * @param {object} point1 - {lat, lng}
 * @param {object} point2 - {lat, lng}
 * @returns {number} - Khoảng cách (mét)
 */
export function calculateDistance(point1, point2) {
  const R = 6378137 // Bán kính Trái Đất (mét)
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Lấy danh sách các múi chiếu có sẵn
 * @returns {Array} - Mảng các múi chiếu
 */
export function getAvailableZones() {
  return Object.keys(VN2000_ZONES)
}

/**
 * Lấy múi chiếu theo tỉnh/thành phố
 * Dựa trên bảng múi chiếu của các tỉnh thành Việt Nam
 */
export const PROVINCE_ZONES = {
  // 63 tỉnh thành trước sáp nhập - Độ chính xác cao nhất
  "Lai Châu": "103°00'",
  "Điện Biên": "103°00'",
  "Sơn La": "104°00'",
  "Lào Cai": "104°45'",
  "Yên Bái": "104°45'",
  "Hà Giang": "105°30'",
  "Tuyên Quang": "106°00'",
  "Phú Thọ": "104°45'",
  "Vĩnh Phúc": "105°00'",
  "Cao Bằng": "105°45'",
  "Lạng Sơn": "107°15'",
  "Bắc Cạn": "106°30'", // Bắc Kạn
  "Thái Nguyên": "106°30'",
  "Bắc Giang": "107°00'",
  "Bắc Ninh": "105°30'",
  "Quảng Ninh": "107°45'",
  "Thành phố Hải Phòng": "105°45'",
  "Hải Dương": "105°30'",
  "Hưng Yên": "105°30'",
  "Thành phố Hà Nội": "105°00'",
  "Hòa Bình": "106°00'",
  "Hà Nam": "105°00'",
  "Nam Định": "105°30'",
  "Thái Bình": "105°30'",
  "Ninh Bình": "106°00'",
  "Thanh Hóa": "105°00'",
  "Nghệ An": "104°45'",
  "Hà Tĩnh": "105°30'",
  "Quảng Bình": "106°00'",
  "Quảng Trị": "106°15'",
  "Thừa Thiên - Huế": "107°00'",
  "Thành phố Đà Nẵng": "107°45'",
  "Quảng Nam": "107°45'",
  "Quảng Ngãi": "108°00'",
  "Bình Định": "106°15'",
  "Kon Tum": "107°30'",
  "Gia Lai": "108°30'",
  "Đắk Lắk": "108°30'",
  "Đắk Nông": "108°30'", // Đắk Nông
  "Phú Yên": "108°30'",
  "Khánh Hòa": "108°15'",
  "Ninh Thuận": "108°15'",
  "Bình Thuận": "108°30'",
  "Lâm Đồng": "107°45'",
  "Đồng Nai": "107°45'",
  "Bà Rịa - Vũng Tàu": "107°45'",
  "Bình Dương": "105°45'",
  "Bình Phước": "106°15'",
  "Tây Ninh": "105°30'",
  "Long An": "105°45'",
  "Tiền Giang": "105°45'",
  "Bến Tre": "105°45'",
  "Đồng Tháp": "105°00'",
  "Vĩnh Long": "105°30'",
  "Trà Vinh": "105°30'",
  "An Giang": "104°45'",
  "Kiên Giang": "104°30'",
  "Thành phố Cần Thơ": "105°00'",
  "Hậu Giang": "105°00'",
  "Sóc Trăng": "105°00'",
  "Bạc Liêu": "105°00'",
  "Cà Mau": "104°30'",
  "Thành phố Hồ Chí Minh": "105°45'",

  // Alias cho các tên tỉnh thường dùng
  "Hà Nội": "105°00'",
  "Hồ Chí Minh": "105°45'",
  "TP Hồ Chí Minh": "105°45'",
  "TP.HCM": "105°45'",
  "Sài Gòn": "105°45'",
  "Đà Nẵng": "107°45'",
  "Hải Phòng": "105°45'",
  "Cần Thơ": "105°00'",
  Huế: "107°00'",
  "Thừa Thiên Huế": "107°00'",
  "Bắc Kạn": "106°30'",
  "Đắk Nông": "108°30'",
}

/**
 * Danh sách các huyện/thành phố thuộc tỉnh với kinh tuyến trục riêng (nếu có)
 * Sử dụng cho việc load KMZ cấp huyện
 */
export const DISTRICT_ZONES = {
  // Tiền Giang
  "Gò Công Tây": "105°45'",
  "Gò Công Đông": "105°45'",
  "Thị xã Gò Công": "105°45'",
  "Tân Phước": "105°45'",
  "Cái Bè": "105°45'",
  "Cai Lậy": "105°45'",
  "Châu Thành": "105°45'",
  "Chợ Gạo": "105°45'",
  "Mỹ Tho": "105°45'",

  // Có thể thêm các huyện khác ở đây
  // Format: "Tên Huyện": "Kinh tuyến trục"
}

/**
 * Lấy múi chiếu theo tên tỉnh hoặc huyện
 * @param {string} locationName - Tên tỉnh/thành phố hoặc huyện
 * @returns {string} - Múi chiếu (VD: "104°45'")
 */
export function getZoneByProvince(locationName) {
  // Kiểm tra trong danh sách huyện trước
  if (DISTRICT_ZONES[locationName]) {
    return DISTRICT_ZONES[locationName]
  }

  // Sau đó kiểm tra trong danh sách tỉnh
  return PROVINCE_ZONES[locationName] || "105°00'" // Mặc định là 105°00'
}

/**
 * Normalize tên tỉnh bằng cách loại bỏ prefix
 * @param {string} provinceName - Tên tỉnh từ API (VD: "Tỉnh Quảng Ninh", "Thành phố Hà Nội")
 * @returns {string} - Tên tỉnh đã normalize (VD: "Quảng Ninh", "Hà Nội")
 */
export function normalizeProvinceName(provinceName) {
  if (!provinceName) return ""

  // Loại bỏ các prefix thường gặp
  const prefixes = ["Tỉnh ", "Thành phố ", "Thành phố trực thuộc trung ương ", "TP. ", "TP "]

  let normalized = provinceName.trim()
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.substring(prefix.length)
      break
    }
  }

  return normalized.trim()
}

/**
 * Lấy kinh tuyến trục từ tên tỉnh (có normalize)
 * @param {string} provinceName - Tên tỉnh từ API
 * @returns {string|null} - Kinh tuyến trục hoặc null nếu không tìm thấy
 */
export function getMeridianFromProvinceName(provinceName) {
  if (!provinceName) return null

  // Normalize tên tỉnh
  const normalized = normalizeProvinceName(provinceName)

  console.log("[v0] Getting meridian for province:", {
    original: provinceName,
    normalized: normalized,
  })

  // Tìm trong PROVINCE_ZONES
  const meridian = PROVINCE_ZONES[normalized]

  if (meridian) {
    console.log("[v0] Found meridian:", meridian)
    return meridian
  }

  // Thử tìm với tên gốc nếu không tìm thấy
  const originalMeridian = PROVINCE_ZONES[provinceName]
  if (originalMeridian) {
    console.log("[v0] Found meridian with original name:", originalMeridian)
    return originalMeridian
  }

  console.warn("[v0] Meridian not found for province:", provinceName)
  return null
}
