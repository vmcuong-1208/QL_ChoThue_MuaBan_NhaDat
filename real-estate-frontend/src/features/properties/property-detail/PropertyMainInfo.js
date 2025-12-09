import {
  FaMapMarkerAlt,
  FaRulerCombined,
  FaCalendarAlt,
  FaEye,
  FaHeart,
  FaRegHeart,
  FaShareAlt,
  FaCheckCircle,
  FaFlag,
} from "react-icons/fa";

const PropertyMainInfo = ({
  property,
  fullAddress,
  formatPrice,
  formatDate,
  isFavorite,
  onToggleFavorite,
  onShare,
  onOpenReportModal,
}) => {
  if (!property) return null;

  return (
    <div className="p-6 transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl animate-fadeInUp">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            {property.TieuDe}
          </h1>
          {property.TrangThaiXacThuc === "đã xác thực" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full font-medium">
              <FaCheckCircle /> <span>Đã xác thực</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onShare}
            className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 transition-all bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:scale-105 shadow-sm"
            title="Chia sẻ tin đăng"
          >
            <FaShareAlt />
          </button>
          <button
            onClick={onToggleFavorite}
            className={`flex items-center justify-center gap-2 px-4 py-2 transition-all rounded-lg hover:scale-105 shadow-sm ${
              isFavorite
                ? "bg-red-100 text-red-600 border border-red-300"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
            title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 transition-all bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 hover:scale-105 shadow-sm"
              title="Báo cáo tin đăng sai phạm"
            >
              <FaFlag className="text-rose-500 text-xs" />
              <span className="hidden sm:inline">Báo cáo</span>
            </button>
          )}
        </div>
      </div>

      <p className="flex items-center gap-2 mb-4 text-gray-600">
        <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
        <span>{fullAddress}</span>
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="text-3xl font-bold text-red-600">
          {formatPrice(property.Gia)}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
          <FaRulerCombined />
          <span className="font-semibold">{property.DienTich} m²</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <FaCalendarAlt />
          <span>Đăng: {formatDate(property.NgayTao)}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaEye />
          <span>{property.SoLuotXem || 0} lượt xem</span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            property.TrangThai === "đang bán"
              ? "bg-green-100 text-green-700"
              : property.TrangThai === "cho thuê"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {property.TrangThai}
        </span>
      </div>
    </div>
  );
};

export default PropertyMainInfo;
