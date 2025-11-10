// Dịch vụ định tuyến sử dụng OSRM (Open Source Routing Machine)
// API miễn phí: https://router.project-osrm.org

/**
 * Lấy route từ OSRM API
 * @param {number} startLng - Kinh độ điểm bắt đầu
 * @param {number} startLat - Vĩ độ điểm bắt đầu
 * @param {number} endLng - Kinh độ điểm kết thúc
 * @param {number} endLat - Vĩ độ điểm kết thúc
 * @param {string} profile - Chế độ di chuyển: 'driving', 'cycling', hoặc 'walking'
 * @returns {Promise} - Trả về route data
 */
export const getRouteFromOSRM = async (startLng, startLat, endLng, endLat, profile) => { // <--- Thêm tham số profile
  console.log("--- Executing getRouteFromOSRM ---");
  try {
    // OSRM API endpoint - format: lng,lat;lng,lat
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&annotations=distance,duration`
    console.log("OSRM Request URL:", url);
    const response = await fetch(url, {
      cache: 'no-store' // Buộc trình duyệt không dùng cache
    });
    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      throw new Error("Không tìm thấy route")
    }

    const route = data.routes[0]

    // Chuyển đổi dữ liệu OSRM sang format dễ sử dụng
    return {
      coordinates: route.geometry.coordinates, // Array [lng, lat]
      distance: route.distance, // Mét
      duration: route.duration, // Giây
      steps: route.legs[0].steps, // Chi tiết các bước
      legs: route.legs, // Thông tin từng chặng
    }
  } catch (error) {
    console.error("[v0] OSRM API Error:", error)
    throw error
  }
}

/**
 * Chuyển đổi khoảng cách từ mét sang km
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Chuyển đổi thời gian từ giây sang định dạng dễ đọc
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`
  }
  return `${minutes} phút`
}
