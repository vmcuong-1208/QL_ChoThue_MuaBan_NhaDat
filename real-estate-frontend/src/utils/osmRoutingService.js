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
export const getRouteFromOSRM = async (
  startLng,
  startLat,
  endLng,
  endLat,
  profile = "driving"
) => {
  console.log("--- Executing getRouteFromOSRM ---");
  console.log("📍 Input Profile:", profile);

  try {
    // Sử dụng máy chủ OSRM phân tách 3 profile thực tế (đường lớn cho ô tô, hẻm cho xe máy, lối đi bộ nhỏ cho đi bộ)
    const routedEndpointMap = {
      driving: "https://routing.openstreetmap.de/routed-car/route/v1/driving",
      cycling: "https://routing.openstreetmap.de/routed-bike/route/v1/driving",
      walking: "https://routing.openstreetmap.de/routed-foot/route/v1/driving",
    };

    const baseEndpoint = routedEndpointMap[profile] || routedEndpointMap.driving;
    const queryParams = "overview=full&geometries=geojson&steps=true&annotations=distance,duration";
    let url = `${baseEndpoint}/${startLng},${startLat};${endLng},${endLat}?${queryParams}`;

    let response = await fetch(url, { cache: "no-store" });
    let data = response.ok ? await response.json() : null;

    // Fallback về router.project-osrm.org nếu routed endpoint gặp sự cố
    if (!data || data.code !== "Ok" || !data.routes?.length) {
      const fallbackUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?${queryParams}`;
      response = await fetch(fallbackUrl, { cache: "no-store" });
      data = await response.json();
    }

    if (!data || data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error(data?.message || "Không tìm thấy route");
    }

    const route = data.routes[0];

    // Điều chỉnh thời gian cho Xe máy (~30 km/h) vì routed-bike tính theo tốc độ xe đạp (~15 km/h)
    let adjustedDuration = route.duration;
    if (profile === "cycling") {
      adjustedDuration = Math.round(route.distance / 8.33);
    }

    // Chuyển đổi dữ liệu OSRM sang format dễ sử dụng
    return {
      coordinates: route.geometry.coordinates, // Array [lng, lat]
      distance: route.distance, // Mét
      duration: adjustedDuration, // Giây
      steps: route.legs[0]?.steps || [], // Chi tiết các bước
      legs: route.legs, // Thông tin từng chặng
    };
  } catch (error) {
    console.error("❌ OSRM API Error:", error);
    throw error;
  }
};

/**
 * Chuyển đổi khoảng cách từ mét sang km
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Chuyển đổi thời gian từ giây sang định dạng dễ đọc
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  return `${minutes} phút`;
};
