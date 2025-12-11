import L from "leaflet";
import { getMediaUrl } from "../../services/api";

/**
 * Format giá tiền ngắn gọn hiển thị trên Badge Pin (chuẩn Airbnb / Batdongsan)
 * @param {number|string} price - Giá tiền VND
 * @param {string} trangThai - Trạng thái hoặc Loại hình (đang bán, cho thuê...)
 * @returns {string} - "3.5 tỷ", "850 tr", "15 tr/th"
 */
export const formatPriceBadge = (price, trangThai = "") => {
  const num = Number(price || 0);
  const isRent = String(trangThai || "").toLowerCase().includes("thuê");

  if (!num || isNaN(num) || num <= 0) {
    return isRent ? "Thương lượng/th" : "Thương lượng";
  }

  let label = "";
  if (num >= 1e9) {
    const val = num / 1e9;
    label = `${val % 1 === 0 ? val : val.toFixed(1).replace(/\.0$/, "")} tỷ`;
  } else if (num >= 1e6) {
    const val = num / 1e6;
    label = `${val % 1 === 0 ? val : val.toFixed(0)} tr`;
  } else if (num >= 1e3) {
    label = `${(num / 1e3).toFixed(0)} k`;
  } else {
    label = `${num.toLocaleString("vi-VN")} đ`;
  }

  if (isRent) {
    label += "/th";
  }

  return label;
};

/**
 * Lấy URL ảnh thumbnail đầu tiên của BĐS
 */
export const getPropertyFirstImage = (prop) => {
  if (!prop) return "";
  let raw = prop.HinhAnh || prop.hinhAnh || prop.HinhAnhChinh;
  if (!raw) return "";

  try {
    if (typeof raw === "string") {
      if (raw.startsWith("[") || raw.startsWith("{")) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          raw = parsed[0];
        }
      } else if (raw.includes(",")) {
        raw = raw.split(",")[0].trim();
      }
    } else if (Array.isArray(raw) && raw.length > 0) {
      raw = raw[0];
    }
  } catch (err) {
    // raw giữ nguyên
  }

  if (typeof raw === "string" && raw.trim()) {
    return getMediaUrl(raw.trim());
  }
  return "";
};

/**
 * Tạo Leaflet DivIcon biểu tượng Viên thuốc Giá (Price Badge Pin)
 * @param {object} prop - Đối tượng BĐS
 * @param {boolean} isSelected - Trạng thái đang được chọn
 * @returns {L.DivIcon}
 */
export const createPriceBadgeIcon = (prop, isSelected = false) => {
  const isRent = String(prop.TrangThai || prop.LoaiHinh || "").toLowerCase().includes("thuê");
  const isFeatured = !!(prop.Featured === 1 || prop.Featured === true || prop.isFeatured);
  const priceText = formatPriceBadge(prop.Gia, prop.TrangThai || prop.LoaiHinh);

  let pinClass = "pin-sale";
  let iconHtml = "🏠";

  if (isFeatured) {
    pinClass = "pin-vip";
    iconHtml = "⭐";
  } else if (isRent) {
    pinClass = "pin-rent";
    iconHtml = "🔑";
  }

  if (isSelected) {
    pinClass += " pin-selected";
  }

  const html = `
    <div class="price-badge-pin-wrapper ${isSelected ? "is-selected" : ""}" style="transform: translate(-50%, -100%); font-family: 'Roboto', Arial, sans-serif;">
      <div class="price-badge-pin ${pinClass}" style="font-family: 'Roboto', Arial, sans-serif;">
        <span class="price-badge-icon" style="font-size: 11px;">${iconHtml}</span>
        <span class="price-badge-text" style="font-family: 'Roboto', Arial, sans-serif;">${priceText}</span>
      </div>
      <div class="price-badge-arrow"></div>
    </div>
  `;

  return L.divIcon({
    className: "custom-leaflet-price-pin",
    html: html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    tooltipAnchor: [0, -32],
  });
};

/**
 * Tạo HTML xem trước nhanh (Rich Tooltip Card) khi rê chuột vào Marker
 * @param {object} prop - Đối tượng BĐS
 * @returns {string} - HTML tooltip
 */
export const createPropertyTooltipHtml = (prop) => {
  const isRent = String(prop.TrangThai || prop.LoaiHinh || "").toLowerCase().includes("thuê");
  const isFeatured = !!(prop.Featured === 1 || prop.Featured === true || prop.isFeatured);
  const priceText = formatPriceBadge(prop.Gia, prop.TrangThai || prop.LoaiHinh);
  const title = prop.TieuDe || prop.tieuDe || "Bất động sản";
  const address = prop.DiaChi || prop.diaChi || "Đang cập nhật địa chỉ";
  const area = prop.DienTich ? `${Number(prop.DienTich).toLocaleString("vi-VN")} m²` : "";
  const thumbUrl = getPropertyFirstImage(prop);

  const badgeTypeLabel = isFeatured
    ? "Tin nổi bật"
    : isRent
    ? "Cho thuê"
    : "Cần bán";

  const badgeTypeBg = isFeatured
    ? "background: #fef3c7; color: #b45309; border: 1px solid #fde68a;"
    : isRent
    ? "background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;"
    : "background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3;";

  return `
    <div style="
      width: 250px;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(226, 232, 240, 0.9);
      font-family: 'Roboto', Arial, sans-serif;
      text-align: left;
      cursor: pointer;
    ">
      ${
        thumbUrl
          ? `
          <div style="position: relative; width: 100%; height: 110px; background: #f1f5f9; overflow: hidden;">
            <img src="${thumbUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'" />
            <div style="position: absolute; top: 8px; left: 8px; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 800; ${badgeTypeBg}">
              ${badgeTypeLabel}
            </div>
            ${
              area
                ? `<div style="position: absolute; bottom: 8px; right: 8px; background: rgba(15, 23, 42, 0.85); color: #ffffff; padding: 2px 6px; border-radius: 5px; font-size: 10px; font-weight: 700; backdrop-filter: blur(4px);">
                    📐 ${area}
                   </div>`
                : ""
            }
          </div>
          `
          : `
          <div style="position: relative; width: 100%; height: 42px; background: linear-gradient(135deg, #1e293b, #0f172a); display: flex; align-items: center; justify-content: space-between; padding: 0 10px;">
            <span style="font-size: 11px; font-weight: 800; ${badgeTypeBg}; padding: 2px 7px; border-radius: 6px;">
              ${badgeTypeLabel}
            </span>
            ${
              area
                ? `<span style="color: #cbd5e1; font-size: 11px; font-weight: 700;">📐 ${area}</span>`
                : ""
            }
          </div>
          `
      }
      <div style="padding: 10px 12px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 15px; font-weight: 900; color: #dc2626; letter-spacing: -0.3px;">
            ${priceText}
          </span>
        </div>
        <div style="
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.35;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          ${title}
        </div>
        <div style="
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          📍 ${address}
        </div>
        <div style="
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px dashed #e2e8f0;
          font-size: 10px;
          color: #2563eb;
          font-weight: 700;
          text-align: right;
        ">
          Nhấp để xem chi tiết →
        </div>
      </div>
    </div>
  `;
};
