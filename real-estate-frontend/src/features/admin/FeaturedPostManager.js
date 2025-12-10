import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaCrown,
  FaSearch,
  FaSync,
  FaPauseCircle,
  FaPlayCircle,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaUserCheck,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const FeaturedPostManager = () => {
  const [featuredList, setFeaturedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchFeaturedList = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/featured-posts/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setFeaturedList(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách tin nổi bật:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedList();
  }, []);

  const handleToggleStatus = async (propertyId, currentStatus) => {
    const isActivating = currentStatus !== "ACTIVE";
    const confirmMsg = isActivating
      ? "Bạn có chắc muốn kích hoạt lại tin nổi bật cho bài đăng này?"
      : "Bạn có chắc muốn tạm ngưng tin nổi bật này do vi phạm quy định?";

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(propertyId);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/featured-posts/admin/toggle-status`,
        { propertyId, active: isActivating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        fetchFeaturedList();
      }
    } catch (err) {
      console.error("Lỗi thay đổi trạng thái:", err);
      alert("Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter
  const filteredData = featuredList.filter((item) => {
    const matchesSearch =
      (item.TieuDe && item.TieuDe.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.HoTen && item.HoTen.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.Email && item.Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(item.MaTTND).includes(searchTerm);

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && item.TinhTrangHieuLuc === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <FaCrown className="text-amber-500" />
            <span>Quản lý tin nổi bật ⭐</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Theo dõi danh sách bất động sản đang ghim nổi bật, kiểm tra thời gian hết hạn và xử lý tạm ngưng khi vi phạm.
          </p>
        </div>

        <button
          onClick={fetchFeaturedList}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all self-start sm:self-auto"
        >
          <FaSync className={loading ? "animate-spin" : ""} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo Mã tin, Tiêu đề, Môi giới..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
          >
            <option value="ALL">Tất cả ({featuredList.length})</option>
            <option value="ACTIVE">Đang hiệu lực ({featuredList.filter((x) => x.TinhTrangHieuLuc === "ACTIVE").length})</option>
            <option value="EXPIRED">Đã hết hạn ({featuredList.filter((x) => x.TinhTrangHieuLuc === "EXPIRED").length})</option>
            <option value="PAUSED">Đang tạm ngưng ({featuredList.filter((x) => x.TinhTrangHieuLuc === "PAUSED").length})</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <FaSync className="animate-spin text-2xl mx-auto text-blue-500" />
            <p className="text-xs font-medium">Đang tải danh sách tin nổi bật...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <FaExclamationTriangle className="text-2xl mx-auto text-amber-500" />
            <p className="text-xs font-bold text-slate-600">Không có dữ liệu tin nổi bật</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã BĐS</th>
                  <th className="py-3 px-4">Bài đăng</th>
                  <th className="py-3 px-4">Môi giới sở hữu</th>
                  <th className="py-3 px-4">Gói dịch vụ</th>
                  <th className="py-3 px-4">Thời gian hiệu lực</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((item) => {
                  const isActive = item.TinhTrangHieuLuc === "ACTIVE";
                  const isExpired = item.TinhTrangHieuLuc === "EXPIRED";

                  return (
                    <tr key={item.MaTTND} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        #{item.MaTTND}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          to={`/bat-dong-san/${item.MaTTND}`}
                          target="_blank"
                          className="font-bold text-slate-900 hover:text-blue-600 line-clamp-2"
                        >
                          {item.TieuDe}
                        </Link>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Giá: <span className="font-bold text-blue-600">{Number(item.Gia || 0).toLocaleString("vi-VN")} đ</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.HoTen || "N/A"}</div>
                        <div className="text-[11px] text-slate-500">{item.SoDienThoai || item.Email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[10px]">
                          {item.FeaturedPlan === "3_DAYS"
                            ? "3 ngày"
                            : item.FeaturedPlan === "7_DAYS"
                            ? "7 ngày"
                            : item.FeaturedPlan === "30_DAYS"
                            ? "30 ngày"
                            : "Nổi bật"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <FaClock className="text-slate-400 text-[10px]" />
                          <span>Đến: {item.FeaturedEndDate ? new Date(item.FeaturedEndDate).toLocaleString("vi-VN") : "Vĩnh viễn"}</span>
                        </div>
                        {isActive && item.GioConLai > 0 && (
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            Còn lại: {Math.floor(item.GioConLai / 24)} ngày {item.GioConLai % 24} giờ
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black text-amber-800 bg-amber-100 rounded-full">
                            ⭐ Đang nổi bật
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 rounded-full">
                            Đã hết hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-100 rounded-full">
                            Tạm ngưng
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(item.MaTTND, item.TinhTrangHieuLuc)}
                          disabled={actionLoading === item.MaTTND}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            isActive
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          }`}
                        >
                          {isActive ? (
                            <>
                              <FaPauseCircle />
                              <span>Tạm ngưng</span>
                            </>
                          ) : (
                            <>
                              <FaPlayCircle />
                              <span>Kích hoạt</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedPostManager;
