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
  FaBookOpen,
  FaArrowsAltH,
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
  isSwipeActive,
  onToggleSwipe,
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
  showPlanningLegend,
  setShowPlanningLegend,
}) => {
  return (
    <div
      className="absolute z-10 space-y-3 left-4 animate-slideInLeft max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
      style={{
        top: "16px",
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
              onClick={() => {
                const nextState = !showPlanningLayer;
                setShowPlanningLayer(nextState);
                if (nextState && setShowPlanningLegend) {
                  setShowPlanningLegend(true);
                }
              }}
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
              <div className="px-1 space-y-2 animate-slideInTop">
                <div>
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

                {onToggleSwipe && (
                  <button
                    type="button"
                    onClick={onToggleSwipe}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      isSwipeActive
                        ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md animate-pulse"
                        : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                    }`}
                    title="Thanh trượt so sánh Quy hoạch chia đôi màn hình (Before/After)"
                  >
                    <div className="flex items-center gap-1.5">
                      <FaArrowsAltH className="text-[11px]" />
                      <span>So sánh Swipe</span>
                    </div>
                    <span className="text-[9.5px] uppercase tracking-wider bg-white/30 px-1.5 py-0.2 rounded font-black">
                      Chia đôi
                    </span>
                  </button>
                )}

                {setShowPlanningLegend && (
                  <button
                    onClick={() => setShowPlanningLegend(!showPlanningLegend)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      showPlanningLegend
                        ? "bg-purple-100 text-purple-700 border border-purple-300 shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <FaBookOpen className="text-purple-600 text-[11px]" />
                      <span>Chú giải loại đất</span>
                    </div>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-black">
                      15
                    </span>
                  </button>
                )}
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
                ? "bg-amber-500 text-white shadow-md ring-2 ring-amber-300 animate-pulse"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Thước đo bản đồ: Đo khoảng cách & Diện tích tự do"
          >
            <FaRuler />
          </button>
        </div>

        {/* Directions & Nearby */}
        {propertyCenter && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            <button
              onClick={() => setShowDirections(!showDirections)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold rounded-lg transition-all ${
                showDirections
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              }`}
              title="Tìm đường đi"
            >
              <FaDirections className="text-sm" />
              <span>Chỉ đường</span>
            </button>
            <button
              onClick={() => setShowNearbyPlaces(!showNearbyPlaces)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold rounded-lg transition-all ${
                showNearbyPlaces
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
              title="Khám phá tiện ích lân cận & Bán kính"
            >
              <FaMapPin className="text-sm text-emerald-600" />
              <span>Tiện ích</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapControls;
