import React from "react";
import {
  FaKey,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaCouch,
  FaBolt,
  FaTint,
  FaConciergeBell,
  FaCheckCircle,
  FaCheck,
  FaSnowflake,
  FaClock,
  FaMotorcycle,
  FaShieldAlt,
  FaDog,
  FaUtensils,
  FaBuilding,
} from "react-icons/fa";

// Map icon tương ứng với từng tiện ích
const AMENITY_ICONS = {
  "Máy lạnh": <FaSnowflake className="text-sky-500" />,
  "Tủ lạnh": <span className="text-sm">🧊</span>,
  "Máy giặt": <span className="text-sm">🧺</span>,
  "Gác lửng": <span className="text-sm">🪜</span>,
  "Có thang máy": <FaBuilding className="text-indigo-500" />,
  "Giờ giấc tự do": <FaClock className="text-amber-500" />,
  "Chỗ để xe riêng": <FaMotorcycle className="text-emerald-500" />,
  "Bảo vệ 24/7": <FaShieldAlt className="text-rose-500" />,
  "Camera an ninh": <span className="text-sm">📹</span>,
  "Cho nuôi thú cưng": <FaDog className="text-amber-600" />,
  "Ban công thoáng mát": <span className="text-sm">🌿</span>,
  "Bếp riêng": <FaUtensils className="text-orange-500" />,
};

const PropertyRentalInfo = ({ property, formatPrice }) => {
  if (!property) return null;

  // Danh sách tiện ích
  const amenities = property.TienIch
    ? property.TienIch.split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  // Tính tiền cọc dạng hiển thị
  const depositText = property.TienDatCoc
    ? formatPrice(property.TienDatCoc)
    : "Thỏa thuận";

  return (
    <div className="p-6 transition-all duration-300 bg-white border border-emerald-100 shadow-lg rounded-xl hover:shadow-xl animate-fadeInUp">
      {/* Header Khối cho thuê */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full mb-1.5">
            <FaKey className="text-emerald-600" />
            Thông tin cho thuê BĐS
          </span>
          <h2 className="text-xl font-black text-slate-900 md:text-2xl">
            Chi phí thuê & Tiện ích dịch vụ
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Thông tin chi phí hàng tháng, điều kiện hợp đồng và danh mục trang thiết bị
          </p>
        </div>
      </div>

      {/* Grid 4 Thẻ Chi Phí Thuê Chính */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {/* 1. Giá thuê hàng tháng */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <FaMoneyBillWave />
            Giá thuê
          </p>
          <p className="mt-1.5 text-lg font-black text-emerald-800 leading-none">
            {formatPrice(property.Gia)}
          </p>
          <span className="text-[11px] font-medium text-emerald-600">/ tháng</span>
        </div>

        {/* 2. Tiền đặt cọc */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <FaShieldAlt />
            Tiền đặt cọc
          </p>
          <p className="mt-1.5 text-lg font-black text-blue-900 leading-none">
            {depositText}
          </p>
          <span className="text-[11px] font-medium text-blue-600">
            {property.TienDatCoc && property.Gia && Number(property.Gia) > 0
              ? `(≈ ${(Number(property.TienDatCoc) / Number(property.Gia)).toFixed(0)} tháng cọc)`
              : "Theo thỏa thuận"}
          </span>
        </div>

        {/* 3. Thời hạn thuê */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <FaCalendarCheck />
            Thời hạn thuê
          </p>
          <p className="mt-1.5 text-base font-black text-amber-900 leading-tight">
            {property.ThoiHanThue || "Linh hoạt"}
          </p>
          <span className="text-[11px] font-medium text-amber-600">Hợp đồng thuê</span>
        </div>

        {/* 4. Tình trạng nội thất */}
        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
            <FaCouch />
            Nội thất
          </p>
          <p className="mt-1.5 text-base font-black text-purple-900 leading-tight">
            {property.NoiThat || "Đầy đủ"}
          </p>
          <span className="text-[11px] font-medium text-purple-600">Trang bị sẵn</span>
        </div>
      </div>

      {/* Chi phí sinh hoạt hàng tháng */}
      <div className="p-4 mb-6 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span>⚡</span> Chi phí sinh hoạt & dịch vụ hàng tháng
        </h3>

        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start gap-2.5">
            <FaBolt className="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-500 block">Tiền điện:</span>
              <span className="font-bold text-slate-800">
                {property.TienDien || "Theo giá điện nhà nước"}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start gap-2.5">
            <FaTint className="text-blue-500 text-sm mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-500 block">Tiền nước:</span>
              <span className="font-bold text-slate-800">
                {property.TienNuoc || "Theo giá nước nhà nước"}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start gap-2.5">
            <FaConciergeBell className="text-emerald-500 text-sm mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-500 block">Phí quản lý / dịch vụ:</span>
              <span className="font-bold text-slate-800">
                {property.PhiDichVu || "Miễn phí"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tiện ích phòng & tòa nhà */}
      {amenities.length > 0 && (
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <span>✨</span> Tiện ích phòng & tòa nhà ({amenities.length} tiện ích)
          </h3>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {amenities.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-900 shadow-2xs"
              >
                <span className="flex-shrink-0">
                  {AMENITY_ICONS[item] || <FaCheck className="text-emerald-600 text-xs" />}
                </span>
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyRentalInfo;
