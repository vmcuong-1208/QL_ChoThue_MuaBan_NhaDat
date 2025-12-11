"use client";

import React, { useState, useMemo } from "react";
import {
  FaTimes,
  FaSearch,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaLayerGroup,
  FaBookOpen,
  FaFilter,
} from "react-icons/fa";

export const LAND_USE_CATEGORIES = [
  { id: "all", name: "Tất cả" },
  { id: "residential", name: "Đất ở (ODT/ONT)" },
  { id: "commercial", name: "Thương mại & CN" },
  { id: "public", name: "Công cộng & Đường sá" },
  { id: "agriculture", name: "Nông nghiệp" },
];

export const LAND_USE_TYPES = [
  // 1. Nhóm Đất ở
  {
    code: "ODT",
    name: "Đất ở tại đô thị",
    category: "residential",
    color: "#ff3377",
    description: "Đất xây dựng nhà ở, công trình phục vụ sinh hoạt dân cư trong khu vực nội thành, nội thị.",
    note: "Được phép xin giấy phép xây dựng kiên cố theo quy chuẩn kiến trúc của đô thị. Giá trị gia tăng và tính thanh khoản cao nhất.",
    status: "safe",
    legalTip: "Được cấp sổ hồng lâu dài, chuyển nhượng tự do.",
  },
  {
    code: "ONT",
    name: "Đất ở tại nông thôn",
    category: "residential",
    color: "#ff7f7f",
    description: "Đất xây dựng nhà ở, công trình phục vụ đời sống dân cư tại xã, thôn xóm nông thôn.",
    note: "Được phép xây dựng nhà ở và công trình sinh hoạt; đất vườn ao liền kề có thể xin chuyển mục đích lên ONT.",
    status: "safe",
    legalTip: "Mật độ xây dựng theo quy hoạch điểm dân cư nông thôn.",
  },

  // 2. Nhóm Thương mại, Công nghiệp, Sản xuất
  {
    code: "TMD",
    name: "Đất thương mại, dịch vụ",
    category: "commercial",
    color: "#ff9900",
    description: "Xây dựng các cơ sở kinh doanh thương mại, trung tâm thương mại, siêu thị, văn phòng, khách sạn.",
    note: "Không dùng để đăng ký hộ khẩu thường trú lâu dài. Thường có thời hạn sử dụng 50 năm (hoặc 70 năm tùy dự án).",
    status: "notice",
    legalTip: "Khả năng sinh lời từ cho thuê mặt bằng rất cao.",
  },
  {
    code: "SKK",
    name: "Đất khu công nghiệp",
    category: "commercial",
    color: "#9933cc",
    description: "Đất xây dựng cụm công nghiệp, khu công nghiệp, khu chế xuất và khu sản xuất tập trung.",
    note: "Chỉ phục vụ mục đích xây dựng nhà máy, kho xưởng sản xuất có đăng ký đầu tư.",
    status: "notice",
    legalTip: "Giao đất hoặc thuê đất trả tiền hàng năm/một lần theo vòng đời dự án.",
  },
  {
    code: "SKC",
    name: "Đất cơ sở sản xuất phi nông nghiệp",
    category: "commercial",
    color: "#8a2be2",
    description: "Cơ sở sản xuất tiểu thủ công nghiệp, kho bãi độc lập nằm ngoài khu công nghiệp.",
    note: "Có thể xin chuyển đổi một phần sang TMD tùy kế hoạch sử dụng đất hàng năm của cấp huyện.",
    status: "notice",
    legalTip: "Cần đảm bảo tiêu chuẩn môi trường và phòng cháy chữa cháy.",
  },

  // 3. Nhóm Công cộng, Giao thông, Công viên (Cần lưu ý kiểm tra lộ giới/quy hoạch)
  {
    code: "DGT",
    name: "Đất giao thông (Lộ giới / Mở đường)",
    category: "public",
    color: "#e11d48",
    description: "Đất dành cho đường bộ, cầu, quảng trường, bến xe, hành lang an toàn giao thông lộ giới.",
    note: "CẢNH BÁO QUAN TRỌNG: Thửa đất hoặc phần diện tích dính quy hoạch DGT có thể bị giải tỏa, mở đường.",
    status: "warning",
    legalTip: "Không được cấp phép xây dựng kiên cố trong phạm vi chỉ giới đường đỏ.",
  },
  {
    code: "DKV",
    name: "Đất công viên, cây xanh, vui chơi",
    category: "public",
    color: "#10b981",
    description: "Khu vực quy hoạch công viên công cộng, dải cây xanh cách ly, hồ sinh thái cảnh quan.",
    note: "CẢNH BÁO: Không được phép chuyển đổi sang đất ở tư nhân. Khi nhà nước thu hồi sẽ bồi thường theo khung giá hiện hành.",
    status: "warning",
    legalTip: "Nên tránh mua đất dính trọn vào quy hoạch công viên cây xanh nếu muốn định cư lâu dài.",
  },
  {
    code: "TSC",
    name: "Đất xây dựng trụ sở cơ quan",
    category: "public",
    color: "#0284c7",
    description: "Trụ sở cơ quan hành chính nhà nước, tổ chức chính trị, cơ quan tư pháp.",
    note: "Tài sản công nhà nước quản lý, không giao dịch mua bán tư nhân.",
    status: "safe",
    legalTip: "Góp phần tạo an ninh trật tự tốt cho khu vực lân cận.",
  },
  {
    code: "DTS",
    name: "Đất công trình sự nghiệp (Y tế, GD...)",
    category: "public",
    color: "#06b6d4",
    description: "Xây dựng trường học công lập, bệnh viện, bảo tàng, trung tâm văn hóa văn nghệ.",
    note: "Phục vụ phúc lợi an sinh xã hội cho khu dân cư.",
    status: "safe",
    legalTip: "Là tiện ích ngoại khu lý tưởng nâng cao giá trị nhà đất xung quanh.",
  },
  {
    code: "NTD",
    name: "Đất nghĩa trang, nghĩa địa",
    category: "public",
    color: "#64748b",
    description: "Khu vực an táng, nhà hỏa táng, nhà lưu cốt, công viên nghĩa trang.",
    note: "LƯU Ý PHONG THỦY: Cần kiểm tra khoảng cách an toàn vệ sinh tối thiểu (100m - 500m) tới nhà dân.",
    status: "warning",
    legalTip: "BĐS gần khu vực này thường có thanh khoản chậm hơn mặt bằng chung.",
  },

  // 4. Nhóm Đất Nông nghiệp
  {
    code: "CLN",
    name: "Đất trồng cây lâu năm",
    category: "agriculture",
    color: "#eab308",
    description: "Trồng các loại cây thân gỗ, cây công nghiệp, vườn cây ăn quả lâu năm (sầu riêng, xoài, dừa, bưởi...).",
    note: "RẤT PHỔ BIẾN TRONG ĐẦU TƯ: Có tiềm năng xin lên thổ cư (ODT/ONT) nếu kế hoạch sử dụng đất cấp huyện cho phép.",
    status: "safe",
    legalTip: "Được phép chuyển nhượng không cần điều kiện trực tiếp sản xuất nông nghiệp.",
  },
  {
    code: "LUC",
    name: "Đất chuyên trồng lúa nước",
    category: "agriculture",
    color: "#facc15",
    description: "Đất trồng từ 2 vụ lúa nước trở lên trong năm, đất đai màu mỡ ven lưu vực sông.",
    note: "Nhà nước bảo vệ nghiêm ngặt an ninh lương thực. Thủ tục chuyển đổi sang đất ở phải qua HĐND tỉnh phê duyệt.",
    status: "notice",
    legalTip: "Một số địa phương yêu cầu người nhận chuyển nhượng phải có hộ khẩu trực tiếp sản xuất nông nghiệp.",
  },
  {
    code: "HNK",
    name: "Đất trồng cây hàng năm khác",
    category: "agriculture",
    color: "#fef08a",
    description: "Trồng các loại cây ngắn ngày dưới 1 năm: rau màu, hoa, ngô, khoai, cỏ chăn nuôi.",
    note: "Khá thuận lợi để chuyển đổi mục đích sử dụng đất hàng năm nếu quy hoạch tổng thể cho phép.",
    status: "safe",
    legalTip: "Chi phí chuyển đổi lên đất ở tương đương giá chênh lệch bảng giá đất nhà nước.",
  },
  {
    code: "NTS",
    name: "Đất nuôi trồng thủy sản",
    category: "agriculture",
    color: "#38bdf8",
    description: "Ao, hồ, đầm nước ngọt hoặc mặn phục vụ nuôi trồng tôm, cá, thủy hải sản.",
    note: "Cần chú ý hệ thống mương cấp thoát nước và hành lang đê điều.",
    status: "notice",
    legalTip: "Thường phải san lấp khi chuyển đổi sang mục đích khác.",
  },
  {
    code: "RSX",
    name: "Đất rừng sản xuất",
    category: "agriculture",
    color: "#22c55e",
    description: "Khu vực rừng trồng phục vụ khai thác gỗ, lâm sản, nguyên liệu giấy.",
    note: "Không được phép xây dựng công trình kiên cố, chu kỳ khai thác và sử dụng đất theo đề án lâm nghiệp.",
    status: "notice",
    legalTip: "Cần kiểm tra kỹ không dính vào ranh giới Rừng phòng hộ (RPH) hoặc Rừng đặc dụng (RDD).",
  },
];

export default function PlanningLegendPanel({ onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedCode, setExpandedCode] = useState("ODT");
  const [isMinimized, setIsMinimized] = useState(false);

  // Lọc danh sách theo từ khóa & danh mục
  const filteredTypes = useMemo(() => {
    return LAND_USE_TYPES.filter((item) => {
      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  if (isMinimized) {
    return (
      <div className="absolute z-20 bottom-4 left-4 animate-slideInLeft">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 text-slate-800 hover:text-blue-600 transition-all hover:scale-105 active:scale-95 cursor-pointer font-bold text-xs"
        >
          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 animate-pulse" />
          <FaBookOpen className="text-blue-600 text-sm" />
          <span>Mở Chú giải Quy hoạch</span>
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-black">
            {LAND_USE_TYPES.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="absolute z-30 bottom-4 left-4 w-[360px] sm:w-[390px] max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[82vh] animate-slideInLeft"
      style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
    >
      {/* 1. Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
            <FaBookOpen className="text-xs" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5">
              <span>Bảng Chú Giải Quy Hoạch</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/30 text-blue-300 rounded font-normal">
                TT 27/2018
              </span>
            </h3>
            <p className="text-[10px] text-slate-300 font-medium">
              Tra cứu màu sắc & ký hiệu loại đất theo Luật Đất Đai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all text-xs"
            title="Thu nhỏ"
          >
            _
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-md hover:bg-rose-500/20 hover:text-rose-300 flex items-center justify-center text-slate-400 transition-all text-xs"
              title="Đóng bảng"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* 2. Ô tìm kiếm & Bộ lọc nhanh */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 space-y-2">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã (ODT, CLN...) hoặc tên đất..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Category Pill Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
          {LAND_USE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Danh sách ký hiệu & Màu sắc */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {filteredTypes.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-medium">
            Không tìm thấy loại đất phù hợp với từ khóa "{searchTerm}"
          </div>
        ) : (
          filteredTypes.map((item) => {
            const isExpanded = expandedCode === item.code;

            return (
              <div
                key={item.code}
                className={`border rounded-xl transition-all duration-200 bg-white overflow-hidden ${
                  isExpanded
                    ? "border-blue-400 shadow-md ring-1 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                {/* Header hàng */}
                <div
                  onClick={() =>
                    setExpandedCode(isExpanded ? null : item.code)
                  }
                  className="p-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Hộp màu quy hoạch chuẩn */}
                    <div
                      className="w-6 h-6 rounded-lg flex-shrink-0 shadow-inner border border-black/15 flex items-center justify-center font-black text-[9px] text-white"
                      style={{
                        backgroundColor: item.color,
                        textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                      }}
                    >
                      {item.code.slice(0, 1)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-slate-900 tracking-tight">
                          {item.code}
                        </span>
                        <span className="text-slate-400 text-[10px]">•</span>
                        <span className="font-bold text-xs text-slate-800 truncate">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.status === "warning" ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-100 text-rose-700 rounded-md flex items-center gap-1">
                        <FaExclamationTriangle className="text-[8px]" />
                        Lưu ý
                      </span>
                    ) : item.status === "safe" ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-md flex items-center gap-0.5">
                        <FaCheckCircle className="text-[8px]" />
                        An toàn
                      </span>
                    ) : null}

                    {isExpanded ? (
                      <FaChevronUp className="text-slate-400 text-[10px]" />
                    ) : (
                      <FaChevronDown className="text-slate-400 text-[10px]" />
                    )}
                  </div>
                </div>

                {/* Nội dung chi tiết mở rộng */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
                    <p className="text-slate-600 font-medium text-[11px] leading-relaxed">
                      {item.description}
                    </p>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 space-y-1">
                      <div className="flex items-start gap-1.5 text-[11px] font-medium text-slate-700">
                        <FaInfoCircle className="text-blue-500 text-[11px] mt-0.5 flex-shrink-0" />
                        <span>{item.note}</span>
                      </div>
                      {item.legalTip && (
                        <div className="text-[10px] text-slate-500 font-semibold pl-4">
                          👉 Pháp lý: {item.legalTip}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Footer: Mẹo kiểm tra nhanh quy hoạch */}
      <div className="p-2.5 bg-slate-100 border-t border-slate-200 text-[10.5px] text-slate-600 flex items-center justify-between">
        <span className="font-medium text-slate-500">
          💡 <b className="text-slate-700">Màu hồng</b> = Đất ở •{" "}
          <b className="text-slate-700">Màu cam</b> = Thương mại •{" "}
          <b className="text-slate-700">Màu đỏ/xám</b> = Lộ giới
        </span>
        <button
          onClick={() => {
            setSelectedCategory("all");
            setSearchTerm("");
          }}
          className="text-blue-600 hover:underline font-bold text-[10px] flex-shrink-0 ml-2"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
}
