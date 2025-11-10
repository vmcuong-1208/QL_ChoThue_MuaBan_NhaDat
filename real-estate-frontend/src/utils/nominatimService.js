// Dịch vụ tìm kiếm địa điểm sử dụng Nominatim (OpenStreetMap)
// API miễn phí: https://nominatim.openstreetmap.org
// Không cần API key, nhưng có giới hạn request (1 request/giây)

/**
 * Tìm kiếm địa điểm từ tên/địa chỉ
 * @param {string} query - Tên địa điểm hoặc địa chỉ
 * @param {number} limit - Số kết quả tối đa (mặc định 10)
 * @returns {Promise<Array>} - Mảng kết quả [{displayName, lat, lng, type, importance, ...}]
 */
export const searchPlaces = async (query, limit = 10) => {
  try {
    if (!query || query.trim().length === 0) {
      return []
    }

    // Nominatim search API
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.append("q", query)
    url.searchParams.append("format", "json")
    url.searchParams.append("limit", limit)
    url.searchParams.append("addressdetails", 1)
    url.searchParams.append("extratags", 1)
    url.searchParams.append("countrycodes", "vn")
    url.searchParams.append("accept-language", "vi")
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "RealEstateApp/1.0 (contact@example.com)",
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    const data = await response.json()

    // Chuyển đổi kết quả Nominatim sang format thống nhất
    const results = data.map((item) => ({
      displayName: item.display_name,
      name: extractPlaceName(item),
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      type: item.type,
      class: item.class,
      importance: item.importance,
      address: item.address || {},
      boundingbox: item.boundingbox,
      osmId: item.osm_id,
      osmType: item.osm_type,
    }))

    console.log("[v0] Nominatim search:", { query, count: results.length })

    return results
  } catch (error) {
    console.error("[v0] Nominatim search error:", error)
    return []
  }
}

/**
 * Lấy thông tin chi tiết của 1 địa điểm từ tọa độ
 */
export const getPlaceByCoordinates = async (lat, lng) => {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse")
    url.searchParams.append("lat", lat)
    url.searchParams.append("lon", lng)
    url.searchParams.append("format", "json")
    url.searchParams.append("addressdetails", 1)
    url.searchParams.append("extratags", 1)

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "RealEstateApp/1.0 (contact@example.com)",
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim reverse API error: ${response.status}`)
    }

    const data = await response.json()

    const result = {
      displayName: data.display_name,
      name: extractPlaceName(data),
      lat: Number.parseFloat(data.lat),
      lng: Number.parseFloat(data.lon),
      type: data.type,
      class: data.class,
      address: data.address || {},
      boundingbox: data.boundingbox,
      osmId: data.osm_id,
      osmType: data.osm_type,
    }

    console.log("[v0] Nominatim reverse geocode:", { lat, lng })

    return result
  } catch (error) {
    console.error("[v0] Nominatim reverse error:", error)
    return null
  }
}

/**
 * Trích xuất tên địa điểm chính từ dữ liệu Nominatim
 */
function extractPlaceName(osmData) {
  if (osmData.extratags?.name) {
    return osmData.extratags.name
  }

  if (osmData.address?.name) {
    return osmData.address.name
  }

  const displayName = osmData.display_name || ""
  const parts = displayName.split(",")
  return parts[0].trim()
}

/**
 * Format thông tin địa chỉ từ OSM address object
 */
export const formatAddress = (address = {}) => {
  return {
    housenumber: address.house_number || "",
    street: address.road || address.path || address.street || "",
    ward: address.suburb || address.village || address.neighborhood || "",
    district: address.city_district || address.county || address.district || "",
    province: address.state || address.province || "",
    country: address.country || "Việt Nam",
    postcode: address.postcode || "",
  }
}

/**
 * Build full address string từ components
 */
export const buildAddressString = (components = {}) => {
  const parts = []

  if (components.housenumber) parts.push(components.housenumber)
  if (components.street) parts.push(components.street)
  if (components.ward) parts.push(components.ward)
  if (components.district) parts.push(components.district)
  if (components.province) parts.push(components.province)

  return parts.filter((p) => p).join(", ")
}
