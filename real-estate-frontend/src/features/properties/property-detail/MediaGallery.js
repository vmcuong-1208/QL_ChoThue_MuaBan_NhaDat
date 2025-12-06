import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { SERVER_URL } from "../../../services/api";

const MediaGallery = ({
  mediaItems,
  currentImageIndex,
  onPrev,
  onNext,
  onOpenFullscreen,
}) => {
  if (!mediaItems || mediaItems.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gray-900 shadow-xl rounded-2xl aspect-video">
        <img
          src="/placeholder.svg?height=500&width=800"
          alt="Không có media"
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  const currentMedia = mediaItems[currentImageIndex];
  const isVideo = currentMedia?.type === "video";
  const mediaUrl = currentMedia?.url?.startsWith("http")
    ? currentMedia.url
    : `${SERVER_URL}${currentMedia?.url}`;

  return (
    <div className="relative overflow-hidden bg-gray-900 shadow-xl rounded-2xl aspect-video group">
      {isVideo ? (
        <div
          className="w-full h-full cursor-pointer animate-fadeIn"
          onClick={() => onOpenFullscreen(currentImageIndex, "property")}
        >
          <video
            src={`${mediaUrl}#t=1`}
            className="object-cover w-full h-full"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-40">
            <div className="flex flex-col items-center gap-2">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span className="px-4 py-2 text-sm text-white bg-black rounded-lg bg-opacity-60">
                Click để xem video
              </span>
            </div>
          </div>
          <div className="absolute px-3 py-1 text-xs font-bold text-white bg-red-600 rounded top-4 left-4">
            VIDEO
          </div>
        </div>
      ) : (
        <div
          className="w-full h-full cursor-pointer animate-fadeIn"
          onClick={() => onOpenFullscreen(currentImageIndex, "property")}
        >
          <img
            src={mediaUrl}
            alt={`Media ${currentImageIndex + 1}`}
            className="object-cover w-full h-full transition-transform hover:scale-105"
            onError={(e) => {
              e.target.src = "/placeholder.svg?height=500&width=800";
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-0 opacity-0 hover:bg-opacity-20 hover:opacity-100">
            <span className="px-4 py-2 text-sm text-white bg-black rounded-lg bg-opacity-60">
              Click để xem lớn
            </span>
          </div>
        </div>
      )}

      {/* Navigation arrows */}
      {mediaItems.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute p-2 text-white transition-all transform -translate-y-1/2 bg-black rounded-full opacity-50 left-4 top-1/2 bg-opacity-30 hover:bg-opacity-60 hover:scale-110"
            title="Ảnh trước"
          >
            <FaChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute p-2 text-white transition-all transform -translate-y-1/2 bg-black rounded-full opacity-50 right-4 top-1/2 bg-opacity-30 hover:bg-opacity-60 hover:scale-110"
            title="Ảnh sau"
          >
            <FaChevronRight size={20} />
          </button>
          <div className="absolute px-3 py-1 text-sm text-white bg-black rounded-full bottom-4 right-4 bg-opacity-60">
            {currentImageIndex + 1}/{mediaItems.length}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaGallery;
