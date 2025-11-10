"use client"

import { useState } from "react" // Loại bỏ useEffect và locationService
// import locationService from "../services/locationService" // Đã loại bỏ
import GoogleMapComponent from "./GoogleMapComponent"
import { loadPlanningData } from "../utils/planningDataLoader"
import "../styles/MapPage.css"

const MapPage = () => {
    // ⚠️ Đã loại bỏ các state dư thừa: selectedProvince, districts, provinces
    
    // Giữ lại các state cần thiết:
    const [mapCenter] = useState({ lat: 10.8231, lng: 106.6297 }) // Khai báo ban đầu
    const [zoom] = useState(10) // Khai báo ban đầu
    const [planningData, setPlanningData] = useState(null)
    const [loading, setLoading] = useState(false)

    // Loại bỏ hoàn toàn các useEffect không còn sử dụng

    // Logic xử lý load Planning Data được truyền vào GoogleMapComponent
    const handleDistrictSelectForPlanning = async (districtName) => {
        if (!districtName) {
            setPlanningData(null);
            return;
        }
        setLoading(true);
        try {
            // Tải dữ liệu Quy hoạch dựa trên tên/ID khu vực
            const data = await loadPlanningData(districtName);
            setPlanningData(data);
        } catch (error) {
            console.error("Lỗi khi load planning data:", error);
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
                    onDistrictSelect={handleDistrictSelectForPlanning} 
                    showMode="map" 
                />
            </div>
        </div>
    )
}

export default MapPage