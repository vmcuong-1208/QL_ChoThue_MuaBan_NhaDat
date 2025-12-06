// Utility để chuyển đổi tọa độ VN2000 sang WGS84
// Sử dụng công thức chuyển đổi theo Quyết định 12/2002/NĐ-CP

/**
 * Bảng tham số chuyển đổi cho các múi chiếu VN2000
 * Dựa trên Quyết định 12/2002/NĐ-CP
 */
const VN2000_ZONES = {
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

// Hệ số góc xoay trục tọa độ (theo Quyết định 12/2002/NĐ-CP)
const ROTATION_PARAMS = {
  alpha0: -0.00928836, // giây
  psi0: 0.01975479, // giây
  epsilon0: -0.00427372, // giây
}

// Hệ số tỷ lệ chiều dài
const k = 1.0000000252906278

/**
 * Chuyển đổi tọa độ VN2000 sang WGS84
 * @param {number} x - Tọa độ X trong hệ VN2000 (mét)
 * @param {number} y - Tọa độ Y trong hệ VN2000 (mét)
 * @param {string} muiChieu - Múi chiếu (VD: "104°45'", "107°00'")
 * @returns {object} - {lat, lng} trong hệ WGS84
 */
function vn2000ToWGS84(x, y, muiChieu) {
  // Lấy tham số múi chiếu
  const zoneParams = VN2000_ZONES[muiChieu]
  if (!zoneParams) {
    throw new Error(`Múi chiếu không hợp lệ: ${muiChieu}`)
  }

  const { deltaX0, deltaY0, deltaZ0, zone } = zoneParams

  // Bước 1: Chuyển từ tọa độ phẳng VN2000 sang tọa độ địa lý (lat, lon) trong VN2000
  // Sử dụng phép chiếu Gauss-Kruger ngược
  const centralMeridian = zone // Kinh tuyến trục (độ thập phân)
  const falseNorthing = 500000 // False Northing cho VN2000
  const a = 6378137.0 // Bán trục lớn WGS84
  const f = 1 / 298.257223563 // Độ dẹt WGS84
  const e2 = 2 * f - f * f // Bình phương độ lệch tâm thứ nhất

  // Tính toán các tham số
  const n = f / (2 - f)
  const n2 = n * n
  const n3 = n2 * n
  const n4 = n3 * n
  const n5 = n4 * n

  const A = (a / (1 + n)) * (1 + n2 / 4 + n4 / 64)

  // Tính vĩ độ từ tọa độ Y (Northing)
  const xi = x / A
  const eta = (y - falseNorthing) / A

  // Các hệ số beta
  const beta1 = (1 / 2) * n - (2 / 3) * n2 + (5 / 16) * n3 + (41 / 180) * n4 - (127 / 288) * n5
  const beta2 = (13 / 48) * n2 - (3 / 5) * n3 + (557 / 1440) * n4 + (281 / 630) * n5
  const beta3 = (61 / 240) * n3 - (103 / 140) * n4 + (15061 / 26880) * n5
  const beta4 = (49561 / 161280) * n4 - (179 / 168) * n5
  const beta5 = (34729 / 80640) * n5

  // Tính vĩ độ và kinh độ
  const xiPrime =
    xi -
    beta1 * Math.sin(2 * xi) * Math.cosh(2 * eta) -
    beta2 * Math.sin(4 * xi) * Math.cosh(4 * eta) -
    beta3 * Math.sin(6 * xi) * Math.cosh(6 * eta) -
    beta4 * Math.sin(8 * xi) * Math.cosh(8 * eta) -
    beta5 * Math.sin(10 * xi) * Math.cosh(10 * eta)

  const etaPrime =
    eta -
    beta1 * Math.cos(2 * xi) * Math.sinh(2 * eta) -
    beta2 * Math.cos(4 * xi) * Math.sinh(4 * eta) -
    beta3 * Math.cos(6 * xi) * Math.sinh(6 * eta) -
    beta4 * Math.cos(8 * xi) * Math.sinh(8 * eta) -
    beta5 * Math.cos(10 * xi) * Math.sinh(10 * eta)

  const chi = Math.asin(Math.sin(xiPrime) / Math.cosh(etaPrime))

  // Tính vĩ độ (latitude)
  const lat =
    chi +
    Math.sin(2 * chi) * (e2 / 2 + (5 * e2 * e2) / 24 + (e2 * e2 * e2) / 12) +
    Math.sin(4 * chi) * ((7 * e2 * e2) / 48 + (29 * e2 * e2 * e2) / 240) +
    Math.sin(6 * chi) * ((7 * e2 * e2 * e2) / 120)

  // Tính kinh độ (longitude)
  const lng = centralMeridian + Math.atan(Math.sinh(etaPrime) / Math.cos(xiPrime))

  // Chuyển từ radian sang độ
  const latDeg = (lat * 180) / Math.PI
  const lngDeg = (lng * 180) / Math.PI

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
function convertMultiplePoints(coordinates, muiChieu) {
  return coordinates.map((point) => vn2000ToWGS84(point.x, point.y, muiChieu))
}

/**
 * Tính diện tích đa giác từ các tọa độ WGS84
 * Sử dụng công thức Shoelace (Gauss area formula)
 * @param {Array} coordinates - Mảng các điểm [{lat, lng}, ...]
 * @returns {number} - Diện tích (m²)
 */
function calculatePolygonArea(coordinates) {
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
function calculateDistance(point1, point2) {
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
function getAvailableZones() {
  return Object.keys(VN2000_ZONES)
}

/**
 * Lấy múi chiếu theo tỉnh/thành phố
 * Dựa trên bảng múi chiếu của các tỉnh thành Việt Nam
 */
const PROVINCE_ZONES = {
  "An Giang": "104°45'",
  "Bắc Ninh": "107°00'",
  "Cà Mau": "104°30'",
  "Cao Bằng": "105°45'",
  "Đắk Lắk": "108°30'",
  "Điện Biên": "103°00'",
  "Đồng Nai": "107°45'",
  "Đồng Tháp": "105°00'",
  "Gia Lai": "108°15'",
  "Hà Tĩnh": "105°30'",
  "Hưng Yên": "105°30'",
  "Khánh Hòa": "108°15'",
  "Lai Châu": "104°45'",
  "Lạng Sơn": "107°15'",
  "Lâm Đồng": "107°45'",
  "Lào Cai": "104°45'",
  "Ninh Bình": "105°00'",
  "Phú Thọ": "104°45'",
  "Quảng Ngãi": "108°00'",
  "Quảng Ninh": "107°45'",
  "Quảng Trị": "106°00'",
  "Sơn La": "104°00'",
  "Tây Ninh": "105°45'",
  "Thái Nguyên": "106°30'",
  "Thanh Hóa": "105°00'",
  "Thành phố Cần Thơ": "105°00'",
  "Thành phố Đà Nẵng": "107°45'",
  "Thành phố Hà Nội": "105°00'",
  "Thành phố Hải Phòng": "105°45'",
  "Thành phố Hồ Chí Minh": "105°45'",
  "Thành phố Huế": "107°00'",
  "Tuyên Quang": "106°00'",
  "Vĩnh Long": "105°30'",
}

/**
 * Lấy múi chiếu theo tên tỉnh
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @returns {string} - Múi chiếu (VD: "104°45'")
 */
function getZoneByProvince(provinceName) {
  return PROVINCE_ZONES[provinceName] || "105°00'" // Mặc định là 105°00'
}

module.exports = {
  vn2000ToWGS84,
  convertMultiplePoints,
  calculatePolygonArea,
  calculateDistance,
  getAvailableZones,
  getZoneByProvince,
  VN2000_ZONES,
  PROVINCE_ZONES,
}
