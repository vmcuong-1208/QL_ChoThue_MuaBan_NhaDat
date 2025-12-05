/**
 * Kiểm tra 1 điểm có nằm trong polygon không (ray casting algorithm)
 * Lưu ý: Hàm này kiểm tra trên một RING (vòng khép kín các tọa độ)
 * @param {Object} point - {lat, lng}
 * @param {Array} ring - Mảng các điểm [[lng, lat], [lng, lat], ...]
 * @returns {Boolean}
 */
export function isPointInPolygon(point, ring) {
  const { lat, lng } = point
  const x = lng
  const y = lat

  let inside = false

  // Kiểm tra tính hợp lệ của ring
  if (!Array.isArray(ring) || ring.length < 3) return false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    // Đảm bảo coordinate tồn tại và là mảng
    if (!Array.isArray(ring[i]) || !Array.isArray(ring[j])) continue;

    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]

    const intersect = (yi > y !== yj > y) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Kiểm tra 1 điểm có nằm trong MultiPolygon không
 * MultiPolygon là mảng các Polygon. Mỗi Polygon là mảng các Ring (Ring đầu là bao ngoài, các Ring sau là lỗ hổng)
 */
export function isPointInMultiPolygon(point, multiPolygon) {
  // Duyệt qua từng Polygon thành phần
  return multiPolygon.some((polygonRings) => {
    if (!Array.isArray(polygonRings) || polygonRings.length === 0) return false;

    // 1. Kiểm tra xem điểm có nằm trong vòng ngoài (Exterior Ring) không
    const exteriorRing = polygonRings[0];
    if (!isPointInPolygon(point, exteriorRing)) {
      return false; // Không nằm trong vỏ ngoài -> Bỏ qua polygon này
    }

    // 2. Nếu có các vòng trong (Interior Rings/Holes), kiểm tra xem điểm có rơi vào lỗ hổng không
    if (polygonRings.length > 1) {
      for (let k = 1; k < polygonRings.length; k++) {
        const holeRing = polygonRings[k];
        if (isPointInPolygon(point, holeRing)) {
          return false; // Rơi vào lỗ hổng -> Không tính là nằm trong Polygon
        }
      }
    }

    // Nằm trong vỏ ngoài và không rơi vào lỗ hổng nào -> TRUE
    return true;
  });
}

/**
 * Tìm tất cả các boundary (tỉnh/huyện/xã) chứa một điểm
 */
export async function findBoundariesContainingPoint(point, gisDataList) {
    const results = [];

    // console.log(`[v1] Checking point ${point.lat}, ${point.lng} against ${gisDataList.length} boundaries...`);

    for (const gisData of gisDataList) {
        try {
            let isInside = false;

            if (!gisData.coordinates) continue;

            if (gisData.type === "MultiPolygon") {
                // Sử dụng hàm đã fix logic MultiPolygon
                isInside = isPointInMultiPolygon(point, gisData.coordinates);

            } else if (gisData.type === "Polygon") {
                const polygonRings = gisData.coordinates;
                if (!Array.isArray(polygonRings) || polygonRings.length === 0) continue;
                
                const exteriorRing = polygonRings[0];

                // BƯỚC 1: Kiểm tra ranh giới ngoài
                if (isPointInPolygon(point, exteriorRing)) {
                    isInside = true;

                    // BƯỚC 2: Kiểm tra các lỗ hổng (Interior Rings)
                    if (polygonRings.length > 1) {
                        for (let i = 1; i < polygonRings.length; i++) {
                            const interiorRing = polygonRings[i];
                            if (isPointInPolygon(point, interiorRing)) {
                                isInside = false; // Lật lại kết quả
                                break;
                            }
                        }
                    }
                }
            }

            if (isInside) {
                // console.log(`[v1] Match found: ${gisData.name} (${gisData.type})`);
                results.push({
                    level: gisData.level,
                    level1_id: gisData.level1_id, // Sử dụng key thống nhất
                    level2_id: gisData.level2_id || null,
                    name: gisData.name,
                    type: gisData.type,
                    // Không cần push gisData gốc để tiết kiệm bộ nhớ, chỉ cần các ID để fetch lại
                });
            }

        } catch (error) {
            console.error(`[v1] Error checking point in ${gisData.name}:`, error);
        }
    }

    console.log("[v1] Found boundaries:", { count: results.length, data: results });

    return results;
}