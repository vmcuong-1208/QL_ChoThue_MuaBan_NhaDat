import { useState, useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { SERVER_URL } from "../../../services/api";

const FullscreenViewer = ({
  isOpen,
  onClose,
  currentIndex,
  mediaType = "property", // 'property' or 'document'
  mediaItems = [],
  documentImages = [],
  onPrev,
  onNext,
}) => {
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoom = () => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    resetZoom();
  }, [currentIndex, mediaType]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, onPrev, onNext, onClose]);

  if (!isOpen) return null;

  const totalCount =
    mediaType === "property" ? mediaItems.length : documentImages.length;

  const currentItem =
    mediaType === "property"
      ? mediaItems[currentIndex]
      : { type: "image", url: documentImages[currentIndex] };

  const isVideo = currentItem?.type === "video";
  const mediaUrl = currentItem?.url?.startsWith("http")
    ? currentItem.url
    : `${SERVER_URL}${currentItem?.url}`;

  const handleZoomIn = () => setImageZoom((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => {
    setImageZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setImagePosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleWheel = (e) => {
    if (isVideo) return;
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e) => {
    if (imageZoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && imageZoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 animate-fadeIn"
      onWheel={handleWheel}
    >
      <button
        onClick={onClose}
        className="absolute z-50 p-2 text-white transition-all rounded-full top-4 right-4 hover:bg-white hover:bg-opacity-20"
        title="Đóng (Esc)"
      >
        <FaTimes size={32} />
      </button>

      <div className="absolute z-50 px-4 py-2 text-white transform -translate-x-1/2 bg-black rounded-full top-4 left-1/2 bg-opacity-60 text-sm font-semibold">
        {currentIndex + 1} / {totalCount}
      </div>

      {/* Zoom controls for images */}
      {!isVideo && (
        <div className="absolute z-50 flex flex-col gap-2 right-4 top-20">
          <button
            onClick={handleZoomIn}
            disabled={imageZoom >= 3}
            className="p-3 text-white bg-black rounded-full bg-opacity-60 hover:bg-opacity-80 disabled:opacity-30"
            title="Phóng to"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            disabled={imageZoom <= 1}
            className="p-3 text-white bg-black rounded-full bg-opacity-60 hover:bg-opacity-80 disabled:opacity-30"
            title="Thu nhỏ"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <div className="px-3 py-1 text-sm text-center text-white bg-black rounded-full bg-opacity-60">
            {Math.round(imageZoom * 100)}%
          </div>
        </div>
      )}

      {/* Main content display */}
      <div className="relative flex items-center justify-center w-full h-full px-4 py-20 overflow-hidden">
        {isVideo ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Fullscreen"
            className={`object-contain max-w-full max-h-full animate-fadeIn transition-transform ${
              imageZoom > 1 ? "cursor-move" : "cursor-default"
            }`}
            style={{
              transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${
                imagePosition.y / imageZoom
              }px)`,
              transition: isDragging ? "none" : "transform 0.2s ease-out",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            draggable={false}
            onError={(e) => {
              e.target.src = "/placeholder.svg?height=800&width=1200";
            }}
          />
        )}
      </div>

      {/* Navigation arrows */}
      {totalCount > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute p-3 text-white transition-all transform -translate-y-1/2 bg-black rounded-full opacity-60 left-4 top-1/2 hover:opacity-100 hover:scale-110"
            title="Trước"
          >
            <FaChevronLeft size={28} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute p-3 text-white transition-all transform -translate-y-1/2 bg-black rounded-full opacity-60 right-4 top-1/2 hover:opacity-100 hover:scale-110"
            title="Sau"
          >
            <FaChevronRight size={28} />
          </button>
        </>
      )}
    </div>
  );
};

export default FullscreenViewer;
