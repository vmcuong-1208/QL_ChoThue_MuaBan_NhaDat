import { useState, useEffect } from "react";
import { FaTimes, FaSearchPlus, FaSearchMinus, FaUndo } from "react-icons/fa";

const ImagePreviewModal = ({ src, title = "Xem trước ảnh giấy tờ", onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom & pan khi mở ảnh mới
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  // Đóng modal khi bấm ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Zoom bằng cuộn chuột (Wheel)
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomStep = 0.15;
    if (e.deltaY < 0) {
      // Cuộn lên -> Phóng to (tối đa 4x)
      setScale((prev) => Math.min(prev + zoomStep, 4));
    } else {
      // Cuộn xuống -> Thu nhỏ (tối thiểu 0.5x)
      setScale((prev) => {
        const next = Math.max(prev - zoomStep, 0.5);
        if (next <= 1) setPosition({ x: 0, y: 0 }); // reset vị trí nếu về kích cỡ gốc
        return next;
      });
    }
  };

  // Kéo di chuyển ảnh khi đã phóng to
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Header điều khiển */}
      <div
        className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 px-4 py-2.5 bg-gray-900/80 rounded-xl border border-gray-700/60 shadow-lg text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
          📄 {title}
        </span>

        {/* Thanh công cụ Zoom */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((prev) => Math.min(prev + 0.25, 4))}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600 cursor-pointer"
            title="Phóng to"
          >
            <FaSearchPlus /> <span className="hidden sm:inline">Phóng to</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setScale((prev) => {
                const next = Math.max(prev - 0.25, 0.5);
                if (next <= 1) setPosition({ x: 0, y: 0 });
                return next;
              });
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600 cursor-pointer"
            title="Thu nhỏ"
          >
            <FaSearchMinus /> <span className="hidden sm:inline">Thu nhỏ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600 cursor-pointer"
            title="Đặt lại kích thước"
          >
            <FaUndo /> <span className="hidden sm:inline">Đặt lại ({Math.round(scale * 100)}%)</span>
          </button>
          <div className="w-[1px] h-5 bg-gray-700 mx-1"></div>
          {/* Nút thoát */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/90 hover:bg-red-600 active:bg-red-700 text-white transition-colors cursor-pointer"
            title="Đóng (ESC)"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {/* Vùng hiển thị ảnh có bắt sự kiện cuộn chuột */}
      <div
        className="w-full h-full flex items-center justify-center p-6 overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={title}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
          className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl rounded-md pointer-events-auto select-none"
        />
      </div>

      {/* Gợi ý cuộn chuột ở góc dưới */}
      <div className="absolute bottom-4 px-3 py-1.5 text-[11px] text-gray-300 bg-gray-900/70 border border-gray-700/50 rounded-full pointer-events-none">
        💡 Cuộn chuột để phóng to / thu nhỏ (hoặc nhấn giữ để kéo di chuyển)
      </div>
    </div>
  );
};

export default ImagePreviewModal;
