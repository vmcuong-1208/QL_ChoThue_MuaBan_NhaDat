import { FaFileAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { SERVER_URL } from "../../services/api";

const PropertyLegalDocs = ({
  documentImages = [],
  showDocumentImages,
  onToggleShow,
  currentDocumentImageIndex,
  onSelectIndex,
  onPrev,
  onNext,
  onOpenFullscreen,
}) => {
  if (!documentImages || documentImages.length === 0) return null;

  return (
    <div className="p-6 transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl animate-fadeInUp">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <FaFileAlt className="text-yellow-600" /> Giấy tờ pháp lý
        </h2>
        <button
          onClick={onToggleShow}
          className="px-4 py-2 text-sm font-semibold text-blue-600 transition-all border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white"
        >
          {showDocumentImages ? "Ẩn giấy tờ" : "Xem giấy tờ"}
        </button>
      </div>

      {showDocumentImages && (
        <div className="mt-4 animate-scaleIn">
          <div
            className="relative mb-4 cursor-pointer aspect-video bg-gray-900 rounded-lg overflow-hidden group"
            onClick={() => onOpenFullscreen(currentDocumentImageIndex, "document")}
          >
            <img
              src={`${SERVER_URL}${documentImages[currentDocumentImageIndex]}`}
              alt={`Giấy tờ ${currentDocumentImageIndex + 1}`}
              className="object-cover w-full h-full transition-transform rounded-lg hover:scale-105"
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=500&width=800";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-0 rounded-lg opacity-0 hover:bg-opacity-20 hover:opacity-100">
              <span className="px-4 py-2 text-sm text-white bg-black rounded-lg bg-opacity-60">
                Click để xem lớn
              </span>
            </div>

            {documentImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                  }}
                  className="absolute p-2 text-white transition-all transform -translate-y-1/2 bg-black rounded-full opacity-50 left-4 top-1/2 bg-opacity-30 hover:bg-opacity-60"
                  title="Trước"
                >
                  <FaChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  className="absolute p-2 text-white transition-all transform -translate-y-1/2 bg-black rounded-full opacity-50 right-4 top-1/2 bg-opacity-30 hover:bg-opacity-60"
                  title="Sau"
                >
                  <FaChevronRight size={20} />
                </button>
                <div className="absolute px-3 py-1 text-sm text-white bg-black rounded-full bottom-4 right-4 bg-opacity-60">
                  {currentDocumentImageIndex + 1}/{documentImages.length}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {documentImages.map((image, index) => (
              <div
                key={index}
                onClick={() => onSelectIndex(index)}
                className={`flex-shrink-0 w-20 h-20 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentDocumentImageIndex
                    ? "border-blue-600 scale-105"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <img
                  src={`${SERVER_URL}${image}`}
                  alt={`Giấy tờ ${index + 1}`}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=80&width=80";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyLegalDocs;
