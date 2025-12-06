import {
  FaMap,
  FaSatellite,
  FaRuler,
  FaExpand,
  FaCompress,
  FaDrawPolygon,
  FaLayerGroup,
  FaDirections,
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
  FaMapPin,
} from "react-icons/fa";

const MapControls = ({
  isFullscreen,
  mapType,
  setMapType,
  planningData,
  showPlanningLayer,
  setShowPlanningLayer,
  planningOpacity,
  setPlanningOpacity,
  propertyBoundary,
  showBoundaryLayer,
  setShowBoundaryLayer,
  boundaryOpacity,
  setBoundaryOpacity,
  toggleFullscreen,
  showSearch,
  setShowSearch,
  clickPointMode,
  setClickPointMode,
  measurementMode,
  setMeasurementMode,
  measurementPoints,
  setMeasurementPoints,
  measurementDistance,
  setMeasurementDistance,
  propertyCenter,
  showDirections,
  setShowDirections,
  showNearbyPlaces,
  setShowNearbyPlaces,
}) => {
  return (
    <div
      className="absolute z-10 space-y-3 left-4 animate-slideInLeft max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
      style={{
        top: isFullscreen ? "0px" : "10px",
      }}
    >
      {/* 1. MAP TYPE */}
      <div className="p-2 bg-white shadow-lg md:p-3 rounded-xl backdrop-blur-sm bg-opacity-95">
        <div className="hidden mb-2 text-xs font-bold tracking-wide text-gray-600 md:block">
          LOẠI BẢN ĐỒ
        </div>
        <div className="flex gap-1.5 md:gap-2">
          <button
            onClick={() => setMapType("roadmap")}
            className={`flex items-center justify-center md:justify-start gap-2 px-2 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-bold transition-all duration-300 rounded-lg ${
              mapType === "roadmap"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
            }`}
          >
            <FaMap className={mapType === "roadmap" ? "animate-pulse" : ""} />
            <span className="hidden md:inline">Đường</span>
          </button>

          <button
            onClick={() => setMapType("satellite")}
            className={`flex items-center justify-center md:justify-start gap-2 px-2 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-bold transition-all duration-300 rounded-lg ${
              mapType === "satellite"
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
            }`}
          >
            <FaSatellite
              className={mapType === "satellite" ? "animate-pulse" : ""}
            />
            <span className="hidden md:inline">Vệ tinh</span>
          </button>
        </div>
      </div>

      {/* 2. LAYERS & TOOLS */}
      <div className="p-2 space-y-2 bg-white shadow-lg md:p-3 rounded-xl backdrop-blur-sm bg-opacity-95">
        <div className="hidden mb-1 text-xs font-bold tracking-wide text-gray-600 md:block">
          CÔNG CỤ & LỚP
        </div>

        {/* Planning Layer */}
        {planningData && (
          <div className="pb-2 space-y-2 border-b border-gray-100">
            <button
              onClick={() => setShowPlanningLayer(!showPlanningLayer)}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm font-bold transition-all duration-300 rounded-lg ${
                showPlanningLayer
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaLayerGroup /> <span>Quy hoạch</span>
              </div>
            </button>
            {showPlanningLayer && (
              <div className="px-1 animate-slideInTop">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>Độ mờ</span>
                  <span>{Math.round(planningOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={planningOpacity * 100}
                  onChange={(e) =>
                    setPlanningOpacity(parseInt(e.target.value) / 100)
                  }
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Property Boundary */}
        {propertyBoundary && (
          <div className="pb-2 space-y-2 border-b border-gray-100">
            <button
              onClick={() => setShowBoundaryLayer(!showBoundaryLayer)}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm font-bold transition-all duration-300 rounded-lg ${
                showBoundaryLayer
                  ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaDrawPolygon /> <span>Khung viền</span>
              </div>
            </button>
            {showBoundaryLayer && (
              <div className="px-1 animate-slideInTop">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>Độ mờ</span>
                  <span>{Math.round(boundaryOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={boundaryOpacity * 100}
                  onChange={(e) =>
                    setBoundaryOpacity(parseInt(e.target.value) / 100)
                  }
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold text-gray-700 transition-all bg-gray-100 rounded-lg hover:bg-blue-100 hover:text-blue-600"
            title="Toàn màn hình"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold rounded-lg transition-all ${
              showSearch
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Tìm kiếm"
          >
            <FaSearch />
          </button>

          <button
            onClick={() => setClickPointMode(!clickPointMode)}
            className={`flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold rounded-lg transition-all ${
              clickPointMode
                ? "bg-green-600 text-white animate-pulse"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Chọn điểm"
          >
            <FaMapMarkerAlt />
          </button>

          <button
            onClick={() => {
              if (measurementMode) {
                setMeasurementPoints([]);
                setMeasurementDistance(0);
              }
              setMeasurementMode(!measurementMode);
            }}
            className={`flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold rounded-lg transition-all ${
              measurementMode
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Đo đạc khoảng cách"
          >
            <FaRuler />
          </button>
        </div>

        {/* Directions & Nearby */}
        {propertyCenter && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowDirections(!showDirections)}
              className={`flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold rounded-lg transition-all ${
                showDirections
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title="Chỉ đường"
            >
              <FaDirections />
            </button>
            <button
              onClick={() => setShowNearbyPlaces(!showNearbyPlaces)}
              className={`flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold rounded-lg transition-all ${
                showNearbyPlaces
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title="Địa điểm xung quanh"
            >
              <FaMapPin />
            </button>
          </div>
        )}
      </div>

      {/* MEASUREMENT RESULT */}
      {measurementMode && measurementPoints.length > 0 && (
        <div className="p-3 bg-white border-l-4 border-orange-500 shadow-lg rounded-xl animate-slideInTop">
          <div className="text-[10px] font-bold text-gray-500 uppercase">
            KHOẢNG CÁCH
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-orange-600">
              {measurementDistance.toFixed(2)}m
            </span>
            <button
              onClick={() => {
                setMeasurementPoints([]);
                setMeasurementDistance(0);
              }}
              className="p-1 text-gray-400 transition-colors hover:text-red-500"
              title="Xóa đo đạc"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapControls;
