// Dịch vụ tìm kiếm POI sử dụng Overpass API
// API miễn phí: https://overpass-api.de

/**
 * Mapping giữa loại địa điểm và Overpass tags
 */
const POI_TYPES = {
  school: { amenity: "school", name: "Trường học" },
  hospital: { amenity: "hospital", name: "Bệnh viện" },
  pharmacy: { amenity: "pharmacy", name: "Nhà thuốc" },
  restaurant: { amenity: "restaurant", name: "Nhà hàng" },
  cafe: { amenity: "cafe", name: "Quán cà phê" },
  shopping_mall: { shop: "mall", name: "Trung tâm thương mại" },
  market: { amenity: "marketplace", name: "Chợ" },
  park: { leisure: "park", name: "Công viên" },
  gas_station: { amenity: "fuel", name: "Trạm xăng" },
  atm: { amenity: "atm", name: "ATM" },
  bank: { amenity: "bank", name: "Ngân hàng" },
  police: { amenity: "police", name: "Công an" },
  fire_station: { amenity: "fire_station", name: "Cảnh sát phòng cháy" },
  post_office: { amenity: "post_office", name: "Bưu điện" },
  library: { amenity: "library", name: "Thư viện" },
}

/**
 * Tìm kiếm POI lân cận sử dụng Overpass API
 * @param {number} lat - Vĩ độ tâm tìm kiếm
 * @param {number} lng - Kinh độ tâm tìm kiếm
 * @param {string} poiType - Loại POI (school, hospital, etc.)
 * @param {number} radius - Bán kính tìm kiếm (mét)
 * @returns {Promise} - Trả về danh sách POI
 */
export const searchNearbyPlacesOverpass = async (lat, lng, poiType, radius) => {
  try {
    const poiConfig = POI_TYPES[poiType]
    if (!poiConfig) {
      throw new Error(`Loại POI không hỗ trợ: ${poiType}`)
    }

    // Tạo Overpass query
    const tagKey = Object.keys(poiConfig)[0] // 'amenity', 'shop', 'leisure'
    const tagValue = poiConfig[tagKey]

    const query = `
      [out:json];
      (
        node["${tagKey}"="${tagValue}"](around:${radius},${lat},${lng});
        way["${tagKey}"="${tagValue}"](around:${radius},${lat},${lng});
      );
      out center;
    `

    // Gọi Overpass API
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`)
    }

    const data = await response.json()

    // Chuyển đổi dữ liệu Overpass sang format dễ sử dụng
    const places = data.elements
      .filter((element) => element.lat && element.lon) // Chỉ lấy có tọa độ
      .map((element) => ({
        id: element.id,
        name: element.tags?.name || `${poiConfig.name} #${element.id}`,
        lat: element.lat || element.center?.lat,
        lng: element.lon || element.center?.lon,
        type: poiConfig.name,
        address: element.tags?.["addr:full"] || element.tags?.["addr:street"] || "Không có địa chỉ",
        phone: element.tags?.phone || null,
        website: element.tags?.website || null,
        opening_hours: element.tags?.opening_hours || null,
      }))
      .slice(0, 20) // Giới hạn 20 kết quả

    return places
  } catch (error) {
    console.error("[v0] Overpass API Error:", error)
    throw error
  }
}

/**
 * Thêm function tìm kiếm POI sử dụng Nominatim API (thay thế Overpass vì bị lỗi 504/502)
 * Nominatim API ổn định hơn và không bị quá tải
 */
export const searchNearbyPlacesNominatim = async (lat, lng, poiType, radius) => {
  try {
    const poiConfig = POI_TYPES[poiType]
    if (!poiConfig) {
      throw new Error(`Loại POI không hỗ trợ: ${poiType}`)
    }

    // Mapping loại POI sang từ khóa tìm kiếm Nominatim
    const searchKeywords = {
      school: "school",
      hospital: "hospital",
      pharmacy: "pharmacy",
      restaurant: "restaurant",
      cafe: "cafe",
      shopping_mall: "shopping mall",
      market: "market",
      park: "park",
      gas_station: "gas station",
      atm: "atm",
      bank: "bank",
      police: "police",
      fire_station: "fire station",
      post_office: "post office",
      library: "library",
    }

    const keyword = searchKeywords[poiType]
    const radiusKm = radius / 1000

    // Gọi Nominatim API để tìm kiếm
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${keyword}&format=json&lat=${lat}&lon=${lng}&limit=50&viewbox=${lng - radiusKm / 111},${lat - radiusKm / 111},${lng + radiusKm / 111},${lat + radiusKm / 111}&bounded=1`,
      {
        headers: {
          "User-Agent": "RealEstateApp/1.0",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    const data = await response.json()

    // Chuyển đổi dữ liệu Nominatim sang format dễ sử dụng
    const places = data
      .filter((place) => {
        // Tính khoảng cách từ tâm tìm kiếm
        const R = 6371 // Bán kính Trái Đất (km)
        const dLat = ((Number.parseFloat(place.lat) - lat) * Math.PI) / 180
        const dLng = ((Number.parseFloat(place.lon) - lng) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((Number.parseFloat(place.lat) * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c * 1000 // Chuyển sang mét

        return distance <= radius
      })
      .map((place) => ({
        id: place.osm_id,
        name: place.name || `${poiConfig.name} #${place.osm_id}`,
        lat: Number.parseFloat(place.lat),
        lng: Number.parseFloat(place.lon),
        type: poiConfig.name,
        address: place.address || "Không có địa chỉ",
        phone: null,
        website: null,
        opening_hours: null,
      }))
      .slice(0, 20) // Giới hạn 20 kết quả

    return places
  } catch (error) {
    console.error("[v0] Nominatim API Error:", error)
    throw error
  }
}

/**
 * Lấy danh sách các loại POI hỗ trợ
 */
export const getSupportedPOITypes = () => {
  return Object.entries(POI_TYPES).map(([key, value]) => ({
    value: key,
    label: value.name,
  }))
}
