"use client"

import { useState } from "react"
// import locationService from "../services/locationService" // Đã loại bỏ
import GoogleMapComponent from "./GoogleMapComponent"
import { loadPlanningData } from "../utils/planningDataLoader"
import "../styles/MapPage.css"

const MapPage = () => {
    // Giữ lại các state cần thiết:
    const [mapCenter] = useState({ lat: 10.8231, lng: 106.6297 })
    const [zoom] = useState(10)
    const [planningData, setPlanningData] = useState(null)
    const [loading, setLoading] = useState(false)

    // 🚀 CẬP NHẬT: Nhận province và district, sau đó gọi loadPlanningData(province, district)
    const handleDistrictSelectForPlanning = async (provinceName, districtName) => {
        // Dùng districtName là điều kiện chính để tải quy hoạch
        if (!districtName) {
            setPlanningData(null);
            return;
        }

        setLoading(true);
        console.log(`[MapPage] Loading planning for: ${districtName} (Province: ${provinceName})`);
        try {
            // Gọi hàm loadPlanningData đã được cập nhật logic (v1)
            const data = await loadPlanningData(provinceName, districtName);
            setPlanningData(data);
            if (!data) {
                console.log(`[MapPage] No planning data found for ${districtName}.`);
            }
        } catch (error) {
            console.error("[MapPage] Lỗi khi load planning data:", error);
            setPlanningData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="map-page-container">
            <div className="map-page-content">
                <GoogleMapComponent
                    center={mapCenter}
                    zoom={zoom}
                    planningData={planningData}
                    height="calc(100vh - 150px)"
                    showControls={true}
                    // 🚀 CẬP NHẬT: Truyền hàm với 2 tham số
                    onDistrictSelect={(province, district) => handleDistrictSelectForPlanning(province, district)}
                    showMode="map"
                    onBoundaryAdd={(callback) => callback}
                />
            </div>
        </div>
    )
}

export default MapPage