"use client"

// Component quản lý GroundOverlay instances cho lớp quy hoạch
import { useEffect, useRef } from "react"

const PlanningOverlay = ({ mapRef, planningData, showPlanningLayer, planningOpacity = 0.7 }) => {
  // Ref để lưu trữ tất cả GroundOverlay instances
  const overlaysRef = useRef([])

  // Load và hiển thị GroundOverlay
  useEffect(() => {
    if (!mapRef?.current || !planningData || !window.google) {
      return
    }

    // Cleanup: xóa tất cả overlay cũ
    overlaysRef.current.forEach((overlay) => {
      overlay.setMap(null)
    })
    overlaysRef.current = []

    // Nếu không hiển thị lớp, không tạo overlay
    if (!showPlanningLayer) {
      return
    }

    // Tạo GroundOverlay cho mỗi ảnh trong planningData
    if (planningData.overlays && Array.isArray(planningData.overlays)) {
      planningData.overlays.forEach((item) => {
        try {
          // Tạo bounds từ LatLonBox
          const bounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(item.bounds.south, item.bounds.west),
            new window.google.maps.LatLng(item.bounds.north, item.bounds.east),
          )

          // Tạo GroundOverlay
          const overlay = new window.google.maps.GroundOverlay(item.url, bounds, {
            clickable: false,
            opacity: planningOpacity,
          })

          // Thêm vào map
          overlay.setMap(mapRef.current)
          overlaysRef.current.push(overlay)

          console.log(`[v0] Loaded GroundOverlay: ${item.name}`)
        } catch (error) {
          console.error(`[v0] Lỗi khi load GroundOverlay ${item.name}:`, error)
        }
      })
    }

    // Cleanup function
    return () => {
      overlaysRef.current.forEach((overlay) => {
        overlay.setMap(null)
      })
      overlaysRef.current = []
    }
  }, [mapRef, planningData, showPlanningLayer, planningOpacity])

  // Cập nhật opacity khi thay đổi
  useEffect(() => {
    overlaysRef.current.forEach((overlay) => {
      overlay.setOpacity(planningOpacity)
    })
  }, [planningOpacity])

  // Component này không render gì, chỉ quản lý GroundOverlay
  return null
}

export default PlanningOverlay
