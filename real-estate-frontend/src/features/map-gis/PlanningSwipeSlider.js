"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  FaArrowsAltH,
  FaExchangeAlt,
  FaTimes,
  FaSatellite,
  FaLayerGroup,
  FaSlidersH,
} from "react-icons/fa";

// Danh sách các mẫu quy hoạch có sẵn trong hệ thống
export const SAMPLE_PLANNING_DISTRICTS = [
  {
    id: "My_Tho_2030",
    name: "TP. Mỹ Tho (2030)",
    path: "Tien_Giang/My_Tho_2030",
  },
  {
    id: "Cai_Be_2030",
    name: "Huyện Cái Bè (2030)",
    path: "Tien_Giang/Cai_Be_2030",
  },
  {
    id: "TX_Cai_Lay_2025",
    name: "TX. Cai Lậy (2025)",
    path: "Tien_Giang/TX_Cai_Lay_2025",
  },
  {
    id: "Cai_Lay_2030",
    name: "Huyện Cai Lậy (2030)",
    path: "Tien_Giang/Cai_Lay_2030",
  },
  {
    id: "Chau_Thanh_2023",
    name: "Huyện Châu Thành (2023)",
    path: "Tien_Giang/Chau_Thanh_2023",
  },
  {
    id: "Cho_Gao_2030",
    name: "Huyện Chợ Gạo (2030)",
    path: "Tien_Giang/Cho_Gao_2030",
  },
  {
    id: "TX_Go_Cong_2024",
    name: "TX. Gò Công (2024)",
    path: "Tien_Giang/TX_Go_Cong_2024",
  },
  {
    id: "Go_Cong_Dong_2024",
    name: "H. Gò Công Đông (2024)",
    path: "Tien_Giang/Go_Cong_Dong_2024",
  },
  {
    id: "Go_Cong_Tay_2030",
    name: "H. Gò Công Tây (2030)",
    path: "Tien_Giang/Go_Cong_Tay_2030",
  },
  {
    id: "Tan_Phuoc_2024",
    name: "Huyện Tân Phước (2024)",
    path: "Tien_Giang/Tan_Phuoc_2024",
  },
];

const PlanningSwipeSlider = ({
  mapRef,
  isActive,
  onClose,
  initialPercent = 50,
  swipeSide: initialSwipeSide = "right", // "right" (Quy hoạch bên phải) | "left" (Quy hoạch bên trái)
  activeDistrictName = "TP. Mỹ Tho (2030)",
  onSelectDistrict,
  planningOpacity = 0.95,
  setPlanningOpacity,
}) => {
  // Quản lý vị trí con trượt độc lập bằng Ref để tránh re-render React cha khi kéo
  const percentRef = useRef(initialPercent);
  const swipeSideRef = useRef(initialSwipeSide);
  const [swipeSide, setSwipeSide] = useState(initialSwipeSide);
  const [displayPercent, setDisplayPercent] = useState(initialPercent);

  const isDraggingRef = useRef(false);
  const rafIdRef = useRef(null);

  // DOM Refs để cập nhật trực tiếp tại 60-120fps không qua React Virtual DOM
  const dividerRef = useRef(null);
  const leftBadgeRef = useRef(null);
  const rightBadgeRef = useRef(null);

  // 1. Cắt mặt nạ clip-path cho Leaflet Pane trực tiếp trên GPU
  const updateClip = useCallback(
    (percent) => {
      if (!mapRef?.current) return;
      const map = mapRef.current;
      const pane = map.getPane("planningSwipePane");
      if (!pane) return;

      try {
        const size = map.getSize();
        if (!size || size.x <= 0 || size.y <= 0) return;

        const clipPx = size.x * (percent / 100);
        const nw = map.containerPointToLayerPoint([0, 0]);
        const se = map.containerPointToLayerPoint([size.x, size.y]);
        const clipPoint = map.containerPointToLayerPoint([clipPx, 0]);

        if (swipeSideRef.current === "right") {
          // Nửa PHẢI là Quy hoạch (từ clipPoint.x đến se.x)
          pane.style.clipPath = `polygon(${clipPoint.x}px ${nw.y}px, ${se.x}px ${nw.y}px, ${se.x}px ${se.y}px, ${clipPoint.x}px ${se.y}px)`;
        } else {
          // Nửa TRÁI là Quy hoạch (từ nw.x đến clipPoint.x)
          pane.style.clipPath = `polygon(${nw.x}px ${nw.y}px, ${clipPoint.x}px ${nw.y}px, ${clipPoint.x}px ${se.y}px, ${nw.x}px ${se.y}px)`;
        }
      } catch (err) {
        console.warn("updateClip error:", err);
      }
    },
    [mapRef],
  );

  // 2. Cập nhật vị trí DOM elements mượt mà
  const applyPosition = useCallback(
    (percent) => {
      if (dividerRef.current) {
        dividerRef.current.style.left = `${percent}%`;
      }
      if (leftBadgeRef.current) {
        leftBadgeRef.current.style.left = `${percent / 2}%`;
      }
      if (rightBadgeRef.current) {
        rightBadgeRef.current.style.left = `${percent + (100 - percent) / 2}%`;
      }
      updateClip(percent);
    },
    [updateClip],
  );

  // 3. Lắng nghe sự kiện bản đồ (di chuyển, zoom) để cập nhật clipping
  useEffect(() => {
    if (!mapRef?.current || !isActive) return;
    const map = mapRef.current;

    const pane = map.getPane("planningSwipePane");
    if (pane) {
      pane.style.willChange = "clip-path";
      pane.style.transform = "translate3d(0, 0, 0)";
    }

    applyPosition(percentRef.current);

    const onMapChange = () => {
      applyPosition(percentRef.current);
    };

    map.on("move", onMapChange);
    map.on("zoom", onMapChange);
    map.on("resize", onMapChange);
    map.on("viewreset", onMapChange);

    return () => {
      map.off("move", onMapChange);
      map.off("zoom", onMapChange);
      map.off("resize", onMapChange);
      map.off("viewreset", onMapChange);

      if (pane) {
        pane.style.clipPath = "none";
        pane.style.willChange = "auto";
      }
    };
  }, [mapRef, isActive, applyPosition]);

  // 4. Xử lý Drag & Drop bằng requestAnimationFrame siêu mượt
  const handlePointerDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingRef.current || !mapRef?.current) return;
      const mapContainer = mapRef.current.getContainer();
      if (!mapContainer) return;

      const rect = mapContainer.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
      const relativeX = clientX - rect.left;
      const percent = Math.max(3, Math.min(97, (relativeX / rect.width) * 100));

      percentRef.current = percent;

      // Sử dụng requestAnimationFrame để hạn chế repaint và không block Main Thread
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          applyPosition(percentRef.current);
          rafIdRef.current = null;
        });
      }
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        // Cập nhật số hiển thị sau khi thả chuột
        setDisplayPercent(Math.round(percentRef.current));
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseup", handlePointerUp, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("touchend", handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [mapRef, applyPosition]);

  const handleSwapSides = () => {
    const next = swipeSide === "right" ? "left" : "right";
    setSwipeSide(next);
    swipeSideRef.current = next;
    applyPosition(percentRef.current);
  };

  if (!isActive) return null;

  const isPlanningOnRight = swipeSide === "right";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden"
      style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
    >
      {/* 1. THANH TRƯỢT PHÂN CHIA (VERTICAL DIVIDER BAR) */}
      <div
        ref={dividerRef}
        className="pointer-events-auto absolute top-0 bottom-0 z-40 will-change-[left]"
        style={{
          left: `${percentRef.current}%`,
          transform: "translateX(-50%)",
          width: "48px",
          cursor: "ew-resize",
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        {/* Đường kẻ dọc phát sáng */}
        <div
          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px]"
          style={{
            background: "linear-gradient(to bottom, #38bdf8, #ffffff, #a855f7)",
            boxShadow:
              "0 0 10px rgba(56, 189, 248, 0.8), 0 0 20px rgba(168, 85, 247, 0.6), 0 0 4px rgba(0,0,0,0.5)",
          }}
        />

        {/* Núm cầm tròn chính giữa (Draggable Grip Handle) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/95 text-white flex items-center justify-center border-2 border-white shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:scale-110 active:scale-95 transition-transform"
          title="Kéo sang trái / phải để so sánh Hiện trạng và Quy hoạch"
        >
          <FaArrowsAltH className="text-base text-sky-400 animate-pulse" />
        </div>
      </div>

      {/* 2. HUY HIỆU CHỈ DẪN 2 BÊN (TOP FLOATING BADGES) */}
      {/* Huy hiệu bên TRÁI */}
      <div
        ref={leftBadgeRef}
        className="pointer-events-none absolute top-4 z-30 will-change-[left]"
        style={{
          left: `${percentRef.current / 2}%`,
          transform: "translateX(-50%)",
        }}
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-xl border border-sky-400/50 backdrop-blur-md">
          {isPlanningOnRight ? (
            <>
              <FaSatellite className="text-emerald-400 text-xs" />
              <span>📷 Hiện Trạng (Vệ Tinh)</span>
            </>
          ) : (
            <>
              <FaLayerGroup className="text-purple-400 text-xs" />
              <span>🗺️ Quy Hoạch 2030</span>
            </>
          )}
        </div>
      </div>

      {/* Huy hiệu bên PHẢI */}
      <div
        ref={rightBadgeRef}
        className="pointer-events-none absolute top-4 z-30 will-change-[left]"
        style={{
          left: `${percentRef.current + (100 - percentRef.current) / 2}%`,
          transform: "translateX(-50%)",
        }}
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-xl border border-purple-400/50 backdrop-blur-md">
          {isPlanningOnRight ? (
            <>
              <FaLayerGroup className="text-purple-400 text-xs" />
              <span>🗺️ Quy Hoạch 2030</span>
            </>
          ) : (
            <>
              <FaSatellite className="text-emerald-400 text-xs" />
              <span>📷 Hiện Trạng (Vệ Tinh)</span>
            </>
          )}
        </div>
      </div>

      {/* 3. THANH ĐIỀU KHIỂN NỔI DƯỚI ĐÁY (SWIPE TOOLBAR DOCK) */}
      <div className="pointer-events-auto absolute bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[96vw]">
        <div className="w-max max-w-[96vw] flex items-center gap-2 sm:gap-2.5 p-2 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {/* Header icon & Title */}
          <div className="flex items-center gap-2 px-2.5 py-1 border-r border-slate-700 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
            <span className="text-xs font-black tracking-wide text-sky-400 uppercase whitespace-nowrap">
              So Sánh Quy Hoạch
            </span>
          </div>

          {/* Bộ chọn khu vực quy hoạch */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <label className="text-[11px] font-bold text-slate-300 hidden md:inline whitespace-nowrap">
              Khu vực:
            </label>
            <select
              value={activeDistrictName}
              onChange={(e) => {
                const found = SAMPLE_PLANNING_DISTRICTS.find(
                  (d) => d.name === e.target.value,
                );
                if (found && onSelectDistrict) {
                  onSelectDistrict(found);
                }
              }}
              className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-600 focus:outline-none focus:border-sky-400 cursor-pointer"
            >
              {SAMPLE_PLANNING_DISTRICTS.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nút Đảo chiều (Trái ⇋ Phải) */}
          <button
            type="button"
            onClick={handleSwapSides}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-200 hover:text-white rounded-xl border border-slate-600 transition-all cursor-pointer flex-shrink-0"
            title="Đảo vị trí Hiện trạng và Quy hoạch giữa 2 bên màn hình"
          >
            <FaExchangeAlt className="text-[11px] text-purple-400" />
            <span className="hidden sm:inline whitespace-nowrap">Đảo bên</span>
          </button>

          {/* Huy hiệu hiển thị vị trí thanh trượt chia đôi */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 flex-shrink-0"
            title="Vị trí đường chia đôi màn hình (kéo núm tròn ↔ trên bản đồ để di chuyển)"
          >
            <FaArrowsAltH className="text-sky-400 text-xs flex-shrink-0" />
            <span className="text-[11px] font-bold text-slate-300 whitespace-nowrap hidden sm:inline">
              Chia:
            </span>
            <span className="px-1.5 py-0.2 text-[11px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded min-w-[34px] text-center">
              {displayPercent}%
            </span>
          </div>

          {/* Component điều chỉnh Độ rõ chuẩn theo mẫu yêu cầu: | Độ rõ QH: ○──────────── 0% | */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700/70 flex-shrink-0"
            style={{ width: "205px", minWidth: "205px", maxWidth: "205px" }}
            title="Điều chỉnh độ rõ nét bản đồ quy hoạch (0% - 100%)"
          >
            {/* 1. Nhãn cố định bên trái: Độ rõ QH: */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <FaSlidersH className="text-purple-400 text-[10px]" />
              <span className="text-[11px] font-bold text-slate-200 whitespace-nowrap">
                Độ rõ QH:
              </span>
            </div>

            {/* 2. Thanh ray: Khóa cứng đúng 70px, bắt đầu ngay SAU dấu hai chấm và dừng chính xác TRƯỚC số % (tại vạch xanh lá) */}
            <div
              className="flex items-center mx-1 flex-shrink-0"
              style={{ width: "70px", minWidth: "70px", maxWidth: "70px" }}
            >
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(planningOpacity * 100)}
                onChange={(e) => setPlanningOpacity(Number(e.target.value) / 100)}
                className="swipe-opacity-slider cursor-pointer"
                style={{ width: "70px", minWidth: "70px", maxWidth: "70px" }}
                title={`Kéo để chỉnh độ rõ quy hoạch: ${Math.round(planningOpacity * 100)}%`}
              />
            </div>

            {/* 3. Số % cố định bên phải: luôn đứng sau điểm cuối 100% của thanh ray */}
            <span className="text-[11px] font-extrabold text-purple-300 min-w-[28px] text-right flex-shrink-0 ml-auto">
              {Math.round(planningOpacity * 100)}%
            </span>
          </div>

          {/* Nút Đóng / Thoát so sánh */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer ml-1 flex-shrink-0"
            title="Tắt chế độ so sánh chia đôi màn hình"
          >
            <FaTimes className="text-xs" />
            <span>Thoát</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanningSwipeSlider;
