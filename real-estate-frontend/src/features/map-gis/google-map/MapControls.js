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
  FaMapPin,
} from "react-icons/fa";

const MapControls = ({
  isFullscreen,
  mapType,
  setMapType,
  planningData,
  showPlanningLayer,
  setShowPlanningLayer,
  propertyBoundary,
  showBoundaryLayer,
  setShowBoundaryLayer,
  toggleFullscreen,
  showSearch,
  setShowSearch,
  clickPointMode,
  setClickPointMode,
  measurementMode,
  setMeasurementMode,
  setMeasurementPoints,
  setMeasurementDistance,
  propertyCenter,
  showDirections,
  setShowDirections,
  showNearbyPlaces,
  setShowNearbyPlaces,
  setShowPlanningLegend,
}) => {
  const btnBase =
    "w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <aside
      aria-label="Bảng điều khiển bản đồ"
      className="absolute z-10 left-3 top-4 flex flex-col gap-2 max-h-[82vh] overflow-y-auto [&::-webkit-scrollbar]:hidden animate-slideInLeft"
      style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
    >
      {/* 1. LOẠI BẢN ĐỒ (1 hàng dọc gọn gàng) */}
      <nav
        aria-label="Loại bản đồ"
        className="flex flex-col gap-1 p-1.5 bg-white/95 backdrop-blur-md shadow-lg rounded-xl border border-slate-200/80"
      >
        <button
          type="button"
          onClick={() => setMapType("roadmap")}
          aria-label="Bản đồ đường phố"
          aria-pressed={mapType === "roadmap"}
          title="Bản đồ Đường phố"
          className={`${btnBase} ${
            mapType === "roadmap"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FaMap aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setMapType("satellite")}
          aria-label="Bản đồ vệ tinh"
          aria-pressed={mapType === "satellite"}
          title="Bản đồ Vệ tinh"
          className={`${btnBase} ${
            mapType === "satellite"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FaSatellite aria-hidden="true" />
        </button>
      </nav>

      {/* 2. CÔNG CỤ & LỚP (1 hàng dọc tiết kiệm diện tích) */}
      <nav
        aria-label="Công cụ và lớp bản đồ"
        className="flex flex-col gap-1 p-1.5 bg-white/95 backdrop-blur-md shadow-lg rounded-xl border border-slate-200/80"
      >
        {planningData && (
          <button
            type="button"
            onClick={() => {
              const nextState = !showPlanningLayer;
              setShowPlanningLayer(nextState);
              if (nextState && setShowPlanningLegend) {
                setShowPlanningLegend(true);
              }
            }}
            aria-label="Bật hoặc tắt lớp quy hoạch"
            aria-pressed={showPlanningLayer}
            title="Lớp Quy hoạch"
            className={`${btnBase} ${
              showPlanningLayer
                ? "bg-purple-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FaLayerGroup aria-hidden="true" />
          </button>
        )}

        {propertyBoundary && (
          <button
            type="button"
            onClick={() => setShowBoundaryLayer(!showBoundaryLayer)}
            aria-label="Bật hoặc tắt khung viền thửa đất"
            aria-pressed={showBoundaryLayer}
            title="Khung viền thửa đất"
            className={`${btnBase} ${
              showBoundaryLayer
                ? "bg-orange-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FaDrawPolygon aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Thu nhỏ toàn màn hình" : "Mở rộng toàn màn hình"}
          aria-pressed={isFullscreen}
          title={isFullscreen ? "Thu nhỏ màn hình" : "Toàn màn hình"}
          className={`${btnBase} bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-600`}
        >
          {isFullscreen ? <FaCompress aria-hidden="true" /> : <FaExpand aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Tìm kiếm địa chỉ và ranh giới"
          aria-pressed={showSearch}
          title="Tìm kiếm địa chỉ & ranh giới"
          className={`${btnBase} ${
            showSearch
              ? "bg-blue-600 text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FaSearch aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setClickPointMode(!clickPointMode)}
          aria-label="Chọn điểm trên bản đồ"
          aria-pressed={clickPointMode}
          title="Chọn điểm trên bản đồ"
          className={`${btnBase} ${
            clickPointMode
              ? "bg-emerald-600 text-white shadow-md animate-pulse"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FaMapMarkerAlt aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (measurementMode) {
              setMeasurementPoints([]);
              setMeasurementDistance(0);
            }
            setMeasurementMode(!measurementMode);
          }}
          aria-label="Thước đo khoảng cách và diện tích"
          aria-pressed={measurementMode}
          title="Thước đo khoảng cách & diện tích"
          className={`${btnBase} ${
            measurementMode
              ? "bg-amber-500 text-white shadow-md animate-pulse"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FaRuler aria-hidden="true" />
        </button>

        <div className="h-px my-0.5 bg-slate-200" role="separator" />
        <button
          type="button"
          onClick={() => setShowDirections(!showDirections)}
          aria-label="Tìm đường đi"
          aria-pressed={showDirections}
          title="Chỉ đường"
          className={`${btnBase} ${
            showDirections
              ? "bg-purple-600 text-white shadow-md"
              : "bg-purple-50 text-purple-700 hover:bg-purple-100"
          }`}
        >
          <FaDirections aria-hidden="true" />
        </button>

        {propertyCenter && (
          <button
            type="button"
            onClick={() => setShowNearbyPlaces(!showNearbyPlaces)}
            aria-label="Khám phá tiện ích lân cận"
            aria-pressed={showNearbyPlaces}
            title="Tiện ích lân cận"
            className={`${btnBase} ${
              showNearbyPlaces
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <FaMapPin aria-hidden="true" />
          </button>
        )}
      </nav>
    </aside>
  );
};

export default MapControls;
