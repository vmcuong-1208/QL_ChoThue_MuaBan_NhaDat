// Utility để kiểm tra 1 điểm có nằm trong polygon không
// Sử dụng ray casting algorithm

/**
 * Kiểm tra 1 điểm có nằm trong polygon không (ray casting algorithm)
 * @param {Object} point - {lat, lng}
 * @param {Array} polygon - Mảng các điểm [[lng, lat], [lng, lat], ...] theo GeoJSON format
 * @returns {Boolean}
 */
export function isPointInPolygon(point, polygon) {
  const { lat, lng } = point
  const x = lng
  const y = lat

  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]

    const intersect = (yi > y !== yj > y) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Kiểm tra 1 điểm có nằm trong MultiPolygon không
 */
export function isPointInMultiPolygon(point, multiPolygon) {
  return multiPolygon.some((polygon) => isPointInPolygon(point, polygon))
}

/**
 * Tìm tất cả các boundary (tỉnh/huyện/xã) chứa một điểm
 */
export async function findBoundariesContainingPoint(point, gisDataList) {
    const results = [];

    for (const gisData of gisDataList) {
        try {
            let isInside = false;

            if (gisData.type === "MultiPolygon") {
                // MultiPolygon: Chỉ cần nằm trong bất kỳ polygon nào
                isInside = isPointInMultiPolygon(point, gisData.coordinates);

            } else if (gisData.type === "Polygon") {
                const polygonRings = gisData.coordinates;
                const exteriorRing = polygonRings[0];

                // BƯỚC 1: Kiểm tra ranh giới ngoài
                if (isPointInPolygon(point, exteriorRing)) {
                    isInside = true;

                    // BƯỚC 2: Kiểm tra các lỗ hổng (Interior Rings)
                    // Bắt đầu từ index 1 (nếu có)
                    if (polygonRings.length > 1) {
                        for (let i = 1; i < polygonRings.length; i++) {
                            const interiorRing = polygonRings[i];
                            // Nếu điểm nằm trong BẤT KỲ lỗ hổng nào, thì nó KHÔNG nằm trong Polygon
                            if (isPointInPolygon(point, interiorRing)) {
                                isInside = false; // Lật lại kết quả
                                break;
                            }
                        }
                    }
                }
            }

            if (isInside) {
                results.push({
                    level: gisData.level,
                    level1Id: gisData.level1_id,
                    level2Id: gisData.level2_id || null,
                    name: gisData.name,
                    type: gisData.type,
                    gisData: gisData,
                });
            }

        } catch (error) {
            console.error(`[v1] Error checking point in ${gisData.name}:`, error);
        }
    }

    console.log("[v1] Found boundaries:", { count: results.length });

    return results;
}
