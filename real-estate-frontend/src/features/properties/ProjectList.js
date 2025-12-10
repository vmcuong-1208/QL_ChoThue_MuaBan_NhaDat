import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaSearch,
  FaCheckCircle,
  FaChevronDown,
  FaLayerGroup,
  FaClock,
} from "react-icons/fa";
import locationService from "../../services/locationService";
import { API_URL, SERVER_URL } from "../../services/api";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projRes, provData] = await Promise.all([
          axios.get(`${API_URL}/categories/projects`),
          locationService.getProvinces(),
        ]);
        setProjects(projRes.data?.data || []);
        setProvinces(provData || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách dự án:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchKw =
      !searchKeyword.trim() ||
      p.TenDuAn?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.ChuDauTu?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.DiaChi?.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchProv = !selectedProvince || String(p.MaTinh) === String(selectedProvince);
    const matchStatus = !selectedStatus || p.TrangThai === selectedStatus;

    return matchKw && matchProv && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "đang mở bán":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "sắp mở bán":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "đã bàn giao":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen py-8 pt-24 bg-gradient-to-b from-slate-100 to-indigo-100/30">
      <div className="max-w-7xl px-4 mx-auto">
        {/* Banner Header Dự Án */}
        <div className="mb-6 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded-full mb-2">
                <FaBuilding />
                Dự án bất động sản
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Khám phá các Dự án Bất động sản nổi bật
              </h1>
              <p className="mt-1 text-xs md:text-sm text-slate-500 font-medium">
                Thông tin quy hoạch, chủ đầu tư uy tín và tiến độ các dự án đô thị hàng đầu
              </p>
            </div>
            <div className="text-sm font-bold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 self-start md:self-auto">
              Tổng số: <span className="text-blue-600 font-black">{filteredProjects.length}</span> dự án
            </div>
          </div>

          {/* Form tìm kiếm & bộ lọc chuyên biệt cho Dự Án */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* 1. Ô tìm kiếm theo tên hoặc CĐT */}
            <div className="relative md:col-span-2">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Tìm theo tên dự án, chủ đầu tư, địa chỉ..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            {/* 2. Lọc theo Tỉnh/Thành */}
            <div className="relative">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer"
              >
                <option value="">Tất cả Tỉnh / Thành</option>
                {provinces.map((p) => (
                  <option key={p.MaTinh} value={p.MaTinh}>
                    {p.TenTinh}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Lọc theo Trạng thái dự án */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="đang mở bán">Đang mở bán</option>
                <option value="sắp mở bán">Sắp mở bán</option>
                <option value="đã bàn giao">Đã bàn giao</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danh sách Dự Án */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Đang tải danh sách dự án...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-2xl mx-auto mb-3">
              <FaBuilding />
            </div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy dự án phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1">
              Vui lòng thử thay đổi từ khóa hoặc bộ lọc khu vực để tìm thấy dự án khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <div
                key={p.MaDuAn}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col group"
              >
                {/* Ảnh dự án */}
                <div className="relative h-52 overflow-hidden bg-slate-100">
                  <img
                    src={p.HinhAnh || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"}
                    alt={p.TenDuAn}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Badge trạng thái */}
                  <span
                    className={`absolute top-3 left-3 px-3 py-1 text-xs font-black rounded-full border shadow-sm backdrop-blur-md ${getStatusBadge(
                      p.TrangThai
                    )}`}
                  >
                    {p.TrangThai || "Đang mở bán"}
                  </span>
                </div>

                {/* Thông tin dự án */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {p.TenDuAn}
                    </h3>
                    <div className="text-xs font-bold text-amber-600 mt-0.5">
                      Chủ đầu tư: {p.ChuDauTu || "Đang cập nhật"}
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium mt-2">
                      <FaMapMarkerAlt className="text-red-500 text-xs mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{p.DiaChi || `${p.TenHuyen || ""}, ${p.TenTinh || ""}`}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1 border-t border-slate-100">
                    {p.MoTa || "Dự án sở hữu vị trí đắc địa với đầy đủ tiện ích nội khu cao cấp."}
                  </p>

                  <div className="pt-2">
                    <Link
                      to={`/tim-kiem?keyword=${encodeURIComponent(p.TenDuAn)}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Xem tin đăng thuộc dự án ({p.SoTinDang || 0})</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
