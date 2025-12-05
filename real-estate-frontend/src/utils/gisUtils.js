// src/utils/gisUtils.js

/**
 * Chuyển đổi các cấu trúc tọa độ GeoJSON (LineString, Polygon, MultiPolygon)
 * sang định dạng mà Google Maps Polygon 'paths' yêu cầu (luôn là 2D).
 *
 * @param {Array} coordinates - Mảng tọa độ GeoJSON thô.
 * @returns {Array<Array<{lat: number, lng: number}>>} - Một mảng các "path" (ring).
 */
export const convertCoordinates = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    console.warn("[v1] Tọa độ đầu vào rỗng")
    return []
  }

  try {
    const first = coordinates[0] // Can be [lng, lat] OR [Ring] OR [Polygon]
    if (!Array.isArray(first)) return [] // Invalid

    const second = first[0] // Can be lng OR [lng, lat] OR [Ring]
    if (second === undefined) {
      console.warn("[v1] Cấu trúc tọa độ không hợp lệ, mảng con rỗng.")
      return [] // Empty inner array
    }

    // --- 1. Check for Depth 4: MultiPolygon ---
    if (Array.isArray(second)) {
      const third = second[0]
      if (Array.isArray(third)) {
        const fourth = third[0]
        if (typeof fourth === "number") {
          console.log("[v1] Phát hiện dạng MultiPolygon (Depth 4)")
          const allRings = [] // Khởi tạo biến để hứng kết quả

          coordinates.forEach((polygon) => {
            polygon.forEach((ring) => {
              // Filter và validate từng point
              const validRing = ring
                .map((coord) => {
                  if (
                    !Array.isArray(coord) ||
                    coord.length < 2 ||
                    typeof coord[0] !== "number" ||
                    typeof coord[1] !== "number" ||
                    isNaN(coord[0]) ||
                    isNaN(coord[1]) ||
                    !isFinite(coord[0]) ||
                    !isFinite(coord[1])
                  ) {
                    console.warn("[v1] Skipping invalid coord (not finite number):", coord)
                    return null
                  }
                  return { lat: coord[1], lng: coord[0] }
                })
                .filter((p) => p !== null) // Loại bỏ invalid points

              // Chỉ thêm ring nếu có ít nhất 3 points (polygon hợp lệ)
              if (validRing.length >= 3) {
                allRings.push(validRing)
              } else {
                console.warn("[v1] Skipping invalid ring (less than 3 valid points after filter)")
              }
            })
          })

          // Debug
          if (allRings.length > 0 && allRings[0].length > 0) {
            const samplePoint = allRings[0][0]
            console.log("[v1] Sample converted point (Depth 4):", samplePoint)
          }
          return allRings // Trả về kết quả
        }
      }
    }

    // --- 2. Check for Depth 3: Polygon ---
    if (Array.isArray(second)) {
      const third = second[0]
      if (typeof third === "number") {
        console.log("[v1] Phát hiện dạng Polygon (Depth 3)")

        const convertedPaths = coordinates
          .map((ring) => {
            const validRing = ring
              .map((coord) => {
                if (
                  !Array.isArray(coord) ||
                  coord.length < 2 ||
                  typeof coord[0] !== "number" ||
                  typeof coord[1] !== "number" ||
                  isNaN(coord[0]) ||
                  isNaN(coord[1]) ||
                  !isFinite(coord[0]) ||
                  !isFinite(coord[1])
                ) {
                  console.warn("[v1] Skipping invalid coord (not finite number):", coord)
                  return null
                }
                return { lat: coord[1], lng: coord[0] }
              })
              .filter((p) => p !== null)

            return validRing.length >= 3 ? validRing : null
          })
          .filter((r) => r !== null)

        // Debug
        if (convertedPaths.length > 0 && convertedPaths[0].length > 0) {
          const samplePoint = convertedPaths[0][0]
          console.log("[v1] Sample converted point (Depth 3):", samplePoint)
        }
        return convertedPaths
      }
    }

    // --- 3. Check for Depth 2: LineString/Ring ---
    if (typeof second === "number") {
      console.log("[v1] Phát hiện dạng LineString/Ring (Depth 2)")
      const validPath = coordinates
        .map((coord) => {
          if (
            !Array.isArray(coord) ||
            coord.length < 2 ||
            typeof coord[0] !== "number" ||
            typeof coord[1] !== "number" ||
            isNaN(coord[0]) ||
            isNaN(coord[1]) ||
            !isFinite(coord[0]) ||
            !isFinite(coord[1])
          ) {
            console.warn("[v1] Skipping invalid coord (not finite number):", coord)
            return null
          }
          return { lat: coord[1], lng: coord[0] }
        })
        .filter((p) => p !== null)

      return validPath.length >= 3 ? [validPath] : []
    }

    console.warn("[v1] Không thể nhận diện định dạng tọa độ.")
    return []
  } catch (err) {
    console.error("[v1] Lỗi trong convertCoordinates:", err, "Input:", JSON.stringify(coordinates).substring(0, 200))
    return []
  }
}

export const calculatePolygonArea = (paths) => {
  if (window.google && window.google.maps && window.google.maps.geometry) {
    let totalArea = 0
    if (Array.isArray(paths) && paths.length > 0) {
      // Check if paths[0] is a coordinate object (single path) or array (multipolygon)
      if (paths[0].lat !== undefined) {
        totalArea = window.google.maps.geometry.spherical.computeArea(paths)
      } else if (Array.isArray(paths[0])) {
        paths.forEach((path) => {
          totalArea += window.google.maps.geometry.spherical.computeArea(path)
        })
      }
    }
    return totalArea
  }
  console.warn("[v0] Google Maps Geometry library not loaded, returning 0")
  return 0
}
