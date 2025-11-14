"use client"

import { useEffect, useRef } from "react"

const PlanningOverlay = ({ mapRef, planningData, showPlanningLayer, planningOpacity = 0.7 }) => {
  const overlaysRef = useRef([])

  useEffect(() => {
    // 1. Kiểm tra điều kiện cơ bản
    if (!mapRef?.current || !planningData || !window.google) {
      return
    }

    // 2. Cleanup overlay cũ
    overlaysRef.current.forEach((overlay) => {
      overlay.setMap(null)
    })
    overlaysRef.current = []

    if (!showPlanningLayer) {
      return
    }

    console.log(`[PlanningOverlay] Bắt đầu vẽ ${planningData.overlays?.length || 0} lớp phủ...`)

    if (planningData.overlays && Array.isArray(planningData.overlays)) {
      
      // --- DEBUG: Log phần tử đầu tiên để xem cấu trúc JSON ---
      if (planningData.overlays.length > 0) {
        console.log("[PlanningOverlay] Cấu trúc phần tử đầu tiên:", planningData.overlays[0]);
        console.log("[PlanningOverlay] Bounds của phần tử đầu:", planningData.overlays[0].bounds);
      }
      // --------------------------------------------------------

      planningData.overlays.forEach((item, index) => {
        try {
          // Kiểm tra an toàn: Đảm bảo item.bounds tồn tại
          if (!item.bounds) {
            console.warn(`[PlanningOverlay] Bỏ qua item ${index}: Không có bounds`, item);
            return;
          }

          // Xử lý trường hợp key viết hoa/thường hoặc dùng min/max
          // (Điều chỉnh fallback tùy theo dữ liệu thực tế của bạn)
          const north = parseFloat(item.bounds.north || item.bounds.North || item.bounds.maxLat);
          const south = parseFloat(item.bounds.south || item.bounds.South || item.bounds.minLat);
          const east = parseFloat(item.bounds.east || item.bounds.East || item.bounds.maxLng || item.bounds.maxLon);
          const west = parseFloat(item.bounds.west || item.bounds.West || item.bounds.minLng || item.bounds.minLon);

          // Kiểm tra tọa độ hợp lệ (không phải NaN)
          if (isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) {
            if (index === 0) console.error(`[PlanningOverlay] Tọa độ không hợp lệ tại item 0:`, { north, south, east, west });
            return;
          }

          const bounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(south, west), // SW
            new window.google.maps.LatLng(north, east), // NE
          )

          const overlay = new window.google.maps.GroundOverlay(item.url, bounds, {
            clickable: false,
            opacity: planningOpacity,
            map: mapRef.current, // Gán map trực tiếp tại đây
          })

          overlaysRef.current.push(overlay)
          
          // Chỉ log item đầu tiên thành công để đỡ rác console
          if (index === 0) {
            console.log(`[PlanningOverlay] ✅ Đã vẽ thành công overlay đầu tiên: ${item.name || 'Unknown'}`, item.url);
          }

        } catch (error) {
          console.error(`[PlanningOverlay] Lỗi item ${index}:`, error)
        }
      })
      
      console.log(`[PlanningOverlay] Hoàn tất vẽ ${overlaysRef.current.length} overlay lên bản đồ.`);
    }

    return () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null))
      overlaysRef.current = []
    }
  }, [mapRef, planningData, showPlanningLayer]) // Bỏ planningOpacity ra khỏi đây để tránh vẽ lại toàn bộ khi đổi opacity

  // Effect riêng để đổi opacity mượt hơn
  useEffect(() => {
    if (overlaysRef.current.length > 0) {
      overlaysRef.current.forEach((overlay) => {
        overlay.setOpacity(planningOpacity)
      })
    }
  }, [planningOpacity])

  return null
}

export default PlanningOverlay