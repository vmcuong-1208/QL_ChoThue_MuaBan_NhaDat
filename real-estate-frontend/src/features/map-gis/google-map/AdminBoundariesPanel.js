import { FaLayerGroup, FaTimes } from "react-icons/fa";

const AdminBoundariesPanel = ({
  selectedBoundaries,
  boundaryOpacities,
  setBoundaryOpacities,
  handleRemoveBoundary,
  handleClearAllBoundaries,
}) => {
  if (!selectedBoundaries || selectedBoundaries.length === 0) return null;

  return (
    <div className="absolute z-20 flex flex-col items-end gap-3 pointer-events-none bottom-4 right-4">
      {/* Header Card */}
      <div className="flex items-center justify-between w-full max-w-sm gap-3 p-3 transition-all duration-300 bg-white border-t-4 border-blue-600 shadow-2xl pointer-events-auto rounded-xl backdrop-blur-md bg-opacity-95 hover:shadow-blue-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 transition-transform bg-blue-100 rounded-full hover:scale-110">
            <FaLayerGroup className="text-sm text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">Ranh giới HC</h4>
            <p className="text-[10px] text-gray-500 font-medium">
              {selectedBoundaries.length} lớp
            </p>
          </div>
        </div>

        <button
          onClick={handleClearAllBoundaries}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white transition-all duration-300 bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:scale-105 hover:shadow-lg active:scale-95"
          title="Xóa tất cả ranh giới"
        >
          <FaTimes className="text-xs" />
          <span className="hidden sm:inline">Xóa tất cả</span>
        </button>
      </div>

      {/* Boundaries List */}
      <div className="flex flex-col w-full max-w-sm gap-2 overflow-y-auto pointer-events-auto max-h-[60vh] pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
        {selectedBoundaries.map((boundary, index) => (
          <div
            key={boundary.id}
            className="relative p-3 transition-all duration-300 bg-white shadow-lg rounded-xl backdrop-blur-md bg-opacity-95 hover:shadow-2xl hover:-translate-y-1 animate-slideInRight"
            style={{
              animationDelay: `${index * 50}ms`,
              borderLeft: `4px solid ${boundary.color}`,
            }}
          >
            {/* Name + Level Badge + Remove Button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center flex-1 min-w-0 gap-2">
                <span
                  className="text-xs font-bold text-gray-800 truncate"
                  title={boundary.name}
                >
                  {boundary.name}
                </span>
                <span
                  className="px-2 py-0.5 text-[10px] font-extrabold text-white rounded-full shadow-sm flex-shrink-0"
                  style={{ backgroundColor: boundary.color }}
                >
                  {boundary.level === "level1"
                    ? "Tỉnh"
                    : boundary.level === "level2"
                    ? "Huyện"
                    : "Xã"}
                </span>
              </div>

              <button
                onClick={() => handleRemoveBoundary(boundary.id)}
                className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-gray-400 transition-all duration-300 rounded-full hover:text-red-500 hover:bg-red-50 hover:scale-110 active:scale-90"
                title="Xóa lớp này"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  Độ mờ
                </span>
                <span
                  className="px-2 py-0.5 text-xs font-bold text-white rounded-full shadow-sm"
                  style={{ backgroundColor: boundary.color }}
                >
                  {Math.round((boundaryOpacities[boundary.id] || 0.5) * 100)}%
                </span>
              </div>

              <div className="relative h-2 overflow-hidden bg-gray-200 rounded-full">
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-200 rounded-full"
                  style={{
                    width: `${(boundaryOpacities[boundary.id] || 0.5) * 100}%`,
                    backgroundColor: boundary.color,
                  }}
                />

                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={boundaryOpacities[boundary.id] || 0.5}
                  onChange={(e) =>
                    setBoundaryOpacities((prev) => ({
                      ...prev,
                      [boundary.id]: parseFloat(e.target.value),
                    }))
                  }
                  className="absolute top-0 left-0 z-10 w-full h-full opacity-0 cursor-pointer"
                />

                <div
                  className="absolute w-4 h-4 transition-all duration-200 border-2 border-white rounded-full shadow-lg pointer-events-none top-1/2"
                  style={{
                    left: `calc(${
                      (boundaryOpacities[boundary.id] || 0.5) * 100
                    }% - 8px)`,
                    transform: "translateY(-50%)",
                    backgroundColor: boundary.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBoundariesPanel;
