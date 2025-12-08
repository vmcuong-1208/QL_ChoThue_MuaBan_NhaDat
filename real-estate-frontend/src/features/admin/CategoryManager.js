"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  FaHome,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaBuilding,
  FaPlus,
  FaEdit,
  FaTrash,
  FaLock,
  FaUnlock,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaLayerGroup,
  FaCity,
  FaSortAmountDown,
  FaInfoCircle,
  FaImages,
} from "react-icons/fa";
import { API_URL, SERVER_URL } from "../../services/api";

const CategoryManager = () => {
  // Active sub-domain tab: 'types' | 'provinces' | 'districts' | 'projects'
  const [activeTab, setActiveTab] = useState("types");

  // Data states
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [projects, setProjects] = useState([]);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState("all");
  const [selectedProjectStatusFilter, setSelectedProjectStatusFilter] = useState("all");

  // Modal states for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = add, object = edit

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    domain: "", // 'types' | 'provinces' | 'districts' | 'projects'
    id: null,
    name: "",
  });

  // Form states
  const [formType, setFormType] = useState({
    TenLoai: "",
    MoTa: "",
    ThuTuHienThi: 0,
    TrangThai: "hoạt động",
  });

  const [formProvince, setFormProvince] = useState({
    MaTinh: "",
    TenTinh: "",
    ThuTuHienThi: 0,
    TrangThai: "hoạt động",
  });

  const [formDistrict, setFormDistrict] = useState({
    MaHuyen: "",
    TenHuyen: "",
    MaTinh: "",
    TrangThai: "hoạt động",
  });

  const [formProject, setFormProject] = useState({
    TenDuAn: "",
    ChuDauTu: "",
    DiaChi: "",
    MaTinh: "",
    MaHuyen: "",
    MoTa: "",
    HinhAnh: "",
    TrangThai: "đang mở bán",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  };

  // 1. Fetch data based on tab
  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/categories/property-types?includeAll=true`);
      setPropertyTypes(res.data || []);
    } catch (err) {
      console.error("Error fetching property types:", err);
      showToast("Không thể tải danh sách loại BĐS", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProvinces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/categories/provinces?includeAll=true`);
      setProvinces(res.data || []);
    } catch (err) {
      console.error("Error fetching provinces:", err);
      showToast("Không thể tải danh sách tỉnh/thành phố", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDistricts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/categories/districts`, {
        params: {
          provinceCode: selectedProvinceFilter,
          search: searchTerm,
          includeAll: true,
        },
      });
      setDistricts(res.data || []);
    } catch (err) {
      console.error("Error fetching districts:", err);
      showToast("Không thể tải danh sách quận/huyện", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedProvinceFilter, searchTerm]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/categories/projects`, {
        params: {
          provinceCode: selectedProvinceFilter,
          status: selectedProjectStatusFilter,
          search: searchTerm,
        },
      });
      setProjects(res.data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      showToast("Không thể tải danh sách dự án", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedProvinceFilter, selectedProjectStatusFilter, searchTerm]);

  // Load initial data and when tab changes
  useEffect(() => {
    setSearchTerm("");
    if (activeTab === "types") {
      fetchTypes();
    } else if (activeTab === "provinces") {
      fetchProvinces();
    } else if (activeTab === "districts") {
      if (provinces.length === 0) fetchProvinces();
      fetchDistricts();
    } else if (activeTab === "projects") {
      if (provinces.length === 0) fetchProvinces();
      fetchProjects();
    }
  }, [activeTab, fetchTypes, fetchProvinces, fetchDistricts, fetchProjects]);

  // Filtered types
  const filteredTypes = useMemo(() => {
    if (!searchTerm.trim()) return propertyTypes;
    const s = searchTerm.toLowerCase();
    return propertyTypes.filter(
      (t) =>
        t.TenLoai?.toLowerCase().includes(s) ||
        t.MoTa?.toLowerCase().includes(s) ||
        String(t.MaLoai).includes(s)
    );
  }, [propertyTypes, searchTerm]);

  // Filtered provinces
  const filteredProvinces = useMemo(() => {
    if (!searchTerm.trim()) return provinces;
    const s = searchTerm.toLowerCase();
    return provinces.filter(
      (p) =>
        p.TenTinh?.toLowerCase().includes(s) ||
        p.MaTinh?.toLowerCase().includes(s)
    );
  }, [provinces, searchTerm]);

  // Filtered districts for cascading dropdown inside project modal
  const modalDistricts = useMemo(() => {
    if (!formProject.MaTinh) return [];
    return districts.filter((d) => d.MaTinh === formProject.MaTinh);
  }, [districts, formProject.MaTinh]);

  // When changing province in project modal, fetch its districts if not available
  useEffect(() => {
    if (formProject.MaTinh) {
      axios
        .get(`${API_URL}/categories/districts?provinceCode=${formProject.MaTinh}&includeAll=true`)
        .then((res) => {
          setDistricts((prev) => {
            const map = new Map(prev.map((d) => [d.MaHuyen, d]));
            (res.data || []).forEach((d) => map.set(d.MaHuyen, d));
            return Array.from(map.values());
          });
        })
        .catch((e) => console.warn("Failed fetching districts for project modal", e));
    }
  }, [formProject.MaTinh]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    if (activeTab === "types") {
      setFormType({
        TenLoai: "",
        MoTa: "",
        ThuTuHienThi: propertyTypes.length + 1,
        TrangThai: "hoạt động",
      });
    } else if (activeTab === "provinces") {
      setFormProvince({
        MaTinh: "",
        TenTinh: "",
        ThuTuHienThi: provinces.length + 1,
        TrangThai: "hoạt động",
      });
    } else if (activeTab === "districts") {
      setFormDistrict({
        MaHuyen: "",
        TenHuyen: "",
        MaTinh: provinces[0]?.MaTinh || "79",
        TrangThai: "hoạt động",
      });
    } else if (activeTab === "projects") {
      setFormProject({
        TenDuAn: "",
        ChuDauTu: "",
        DiaChi: "",
        MaTinh: provinces[0]?.MaTinh || "79",
        MaHuyen: "",
        MoTa: "",
        HinhAnh: "",
        TrangThai: "đang mở bán",
      });
    }
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    if (activeTab === "types") {
      setFormType({
        TenLoai: item.TenLoai || item.TenLoaiND || "",
        MoTa: item.MoTa || "",
        ThuTuHienThi: item.ThuTuHienThi || 0,
        TrangThai: item.TrangThai || "hoạt động",
      });
    } else if (activeTab === "provinces") {
      setFormProvince({
        MaTinh: item.MaTinh,
        TenTinh: item.TenTinh,
        ThuTuHienThi: item.ThuTuHienThi || 0,
        TrangThai: item.TrangThai || "hoạt động",
      });
    } else if (activeTab === "districts") {
      setFormDistrict({
        MaHuyen: item.MaHuyen,
        TenHuyen: item.TenHuyen,
        MaTinh: item.MaTinh,
        TrangThai: item.TrangThai || "hoạt động",
      });
    } else if (activeTab === "projects") {
      setFormProject({
        TenDuAn: item.TenDuAn,
        ChuDauTu: item.ChuDauTu || "",
        DiaChi: item.DiaChi || "",
        MaTinh: item.MaTinh || "",
        MaHuyen: item.MaHuyen || "",
        MoTa: item.MoTa || "",
        HinhAnh: item.HinhAnh || "",
        TrangThai: item.TrangThai || "đang mở bán",
      });
    }
    setIsModalOpen(true);
  };

  // Toggle Lock/Unlock item
  const handleToggle = async (id, domain) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let endpoint = "";
      if (domain === "types") endpoint = `${API_URL}/categories/property-types/${id}/toggle`;
      else if (domain === "provinces") endpoint = `${API_URL}/categories/provinces/${id}/toggle`;
      else if (domain === "districts") endpoint = `${API_URL}/categories/districts/${id}/toggle`;
      else if (domain === "projects") endpoint = `${API_URL}/categories/projects/${id}/toggle`;

      const res = await axios.patch(endpoint, {}, config);
      showToast(res.data.message || "Cập nhật trạng thái thành công!");

      if (domain === "types") fetchTypes();
      else if (domain === "provinces") fetchProvinces();
      else if (domain === "districts") fetchDistricts();
      else if (domain === "projects") fetchProjects();
    } catch (err) {
      console.error("Toggle error:", err);
      showToast(err.response?.data?.message || "Lỗi khi cập nhật trạng thái.", "error");
    }
  };

  // Submit Modal Form (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (activeTab === "types") {
        if (editingItem) {
          await axios.put(
            `${API_URL}/categories/property-types/${editingItem.MaLoai}`,
            formType,
            config
          );
          showToast("Cập nhật loại BĐS thành công!");
        } else {
          await axios.post(`${API_URL}/categories/property-types`, formType, config);
          showToast("Thêm loại BĐS mới thành công!");
        }
        fetchTypes();
      } else if (activeTab === "provinces") {
        if (editingItem) {
          await axios.put(
            `${API_URL}/categories/provinces/${editingItem.MaTinh}`,
            formProvince,
            config
          );
          showToast("Cập nhật tỉnh/thành phố thành công!");
        } else {
          await axios.post(`${API_URL}/categories/provinces`, formProvince, config);
          showToast("Thêm tỉnh/thành phố mới thành công!");
        }
        fetchProvinces();
      } else if (activeTab === "districts") {
        if (editingItem) {
          await axios.put(
            `${API_URL}/categories/districts/${editingItem.MaHuyen}`,
            formDistrict,
            config
          );
          showToast("Cập nhật quận/huyện thành công!");
        } else {
          await axios.post(`${API_URL}/categories/districts`, formDistrict, config);
          showToast("Thêm quận/huyện mới thành công!");
        }
        fetchDistricts();
      } else if (activeTab === "projects") {
        if (editingItem) {
          await axios.put(
            `${API_URL}/categories/projects/${editingItem.MaDuAn}`,
            formProject,
            config
          );
          showToast("Cập nhật dự án thành công!");
        } else {
          await axios.post(`${API_URL}/categories/projects`, formProject, config);
          showToast("Thêm dự án mới thành công!");
        }
        fetchProjects();
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      showToast(err.response?.data?.message || "Lỗi khi lưu dữ liệu.", "error");
    }
  };

  // Delete Action Confirm
  const handleConfirmDelete = async () => {
    const { domain, id } = deleteConfirm;
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let endpoint = "";
      if (domain === "types") endpoint = `${API_URL}/categories/property-types/${id}`;
      else if (domain === "provinces") endpoint = `${API_URL}/categories/provinces/${id}`;
      else if (domain === "districts") endpoint = `${API_URL}/categories/districts/${id}`;
      else if (domain === "projects") endpoint = `${API_URL}/categories/projects/${id}`;

      await axios.delete(endpoint, config);
      showToast("Đã xóa danh mục thành công!");
      setDeleteConfirm({ isOpen: false, domain: "", id: null, name: "" });

      if (domain === "types") fetchTypes();
      else if (domain === "provinces") fetchProvinces();
      else if (domain === "districts") fetchDistricts();
      else if (domain === "projects") fetchProjects();
    } catch (err) {
      console.error("Delete error:", err);
      showToast(err.response?.data?.message || "Lỗi khi xóa dữ liệu.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold text-white animate-fadeIn ${
            toast.type === "error"
              ? "bg-rose-600 border border-rose-700"
              : "bg-emerald-600 border border-emerald-700"
          }`}
        >
          {toast.type === "error" ? (
            <FaTimesCircle className="text-base" />
          ) : (
            <FaCheckCircle className="text-base" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header & Intro */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
            Quản lý danh mục hệ thống
          </h2>
          <p className="text-xs text-slate-500">
            Quản lý dữ liệu dùng chung toàn hệ thống: Loại BĐS, Tỉnh/Thành, Quận/Huyện và Dự án
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center self-start gap-2 px-4 py-2 text-xs font-bold text-white transition-all bg-blue-600 rounded-lg shadow-xs hover:bg-blue-700 active:scale-95 sm:self-auto"
        >
          <FaPlus />
          <span>
            {activeTab === "types" && "Thêm loại BĐS"}
            {activeTab === "provinces" && "Thêm Tỉnh/Thành"}
            {activeTab === "districts" && "Thêm Quận/Huyện"}
            {activeTab === "projects" && "Thêm Dự án"}
          </span>
        </button>
      </div>

      {/* 2. Top Domain Tabs (4 Sub-domains) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Tab 1: Loại BĐS */}
        <button
          onClick={() => setActiveTab("types")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3.5 ${
            activeTab === "types"
              ? "bg-blue-50/80 border-blue-400 ring-2 ring-blue-200 shadow-xs"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
              activeTab === "types"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <FaHome />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Loại bất động sản
            </div>
            <div className="text-lg font-bold leading-tight text-slate-900">
              {propertyTypes.length}{" "}
              <span className="text-xs font-normal text-slate-500">loại hình</span>
            </div>
          </div>
        </button>

        {/* Tab 2: Tỉnh / Thành phố */}
        <button
          onClick={() => setActiveTab("provinces")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3.5 ${
            activeTab === "provinces"
              ? "bg-blue-50/80 border-blue-400 ring-2 ring-blue-200 shadow-xs"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
              activeTab === "provinces"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <FaCity />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tỉnh / Thành phố
            </div>
            <div className="text-lg font-bold leading-tight text-slate-900">
              {provinces.length}{" "}
              <span className="text-xs font-normal text-slate-500">tỉnh/thành</span>
            </div>
          </div>
        </button>

        {/* Tab 3: Quận / Huyện */}
        <button
          onClick={() => setActiveTab("districts")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3.5 ${
            activeTab === "districts"
              ? "bg-blue-50/80 border-blue-400 ring-2 ring-blue-200 shadow-xs"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
              activeTab === "districts"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <FaMapMarkerAlt />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Quận / Huyện
            </div>
            <div className="text-lg font-bold leading-tight text-slate-900">
              {districts.length > 0 ? districts.length : "690+"}{" "}
              <span className="text-xs font-normal text-slate-500">quận/huyện</span>
            </div>
          </div>
        </button>

        {/* Tab 4: Dự án bất động sản */}
        <button
          onClick={() => setActiveTab("projects")}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3.5 ${
            activeTab === "projects"
              ? "bg-blue-50/80 border-blue-400 ring-2 ring-blue-200 shadow-xs"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
              activeTab === "projects"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <FaBuilding />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Dự án bất động sản
            </div>
            <div className="text-lg font-bold leading-tight text-slate-900">
              {projects.length}{" "}
              <span className="text-xs font-normal text-slate-500">dự án</span>
            </div>
          </div>
        </button>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute text-xs -translate-y-1/2 text-slate-400 left-3 top-1/2" />
          <input
            type="search"
            placeholder={
              activeTab === "types"
                ? "Tìm theo tên loại BĐS, mô tả..."
                : activeTab === "provinces"
                ? "Tìm theo tên tỉnh, mã tỉnh..."
                : activeTab === "districts"
                ? "Tìm theo tên quận/huyện, tỉnh..."
                : "Tìm theo tên dự án, chủ đầu tư..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Extra filters for Districts & Projects */}
        <div className="flex flex-wrap items-center gap-2">
          {(activeTab === "districts" || activeTab === "projects") && (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-500">Tỉnh/Thành:</span>
              <select
                value={selectedProvinceFilter}
                onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="all">Tất cả tỉnh/thành</option>
                {provinces.map((p) => (
                  <option key={p.MaTinh} value={p.MaTinh}>
                    {p.TenTinh}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-500">Trạng thái:</span>
              <select
                value={selectedProjectStatusFilter}
                onChange={(e) => setSelectedProjectStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="đang mở bán">Đang mở bán</option>
                <option value="sắp mở bán">Sắp mở bán</option>
                <option value="đã bàn giao">Đã bàn giao</option>
                <option value="tạm ngưng">Tạm ngưng</option>
                <option value="khóa">Đã khóa</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. Tab Content Data Presentation */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-blue-600 rounded-full border-3 border-t-transparent animate-spin" />
            <p className="text-xs font-medium text-slate-500">Đang tải dữ liệu danh mục...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: LOẠI BẤT ĐỘNG SẢN */}
          {/* ========================================================================= */}
          {activeTab === "types" && (
            <div className="overflow-hidden bg-white border border-slate-200/90 rounded-xl shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="w-16 px-4 py-3">Thứ tự</th>
                      <th className="w-20 px-4 py-3">Mã</th>
                      <th className="px-4 py-3">Tên loại bất động sản</th>
                      <th className="px-4 py-3">Mô tả đặc điểm</th>
                      <th className="px-4 py-3 text-center w-28">Tin liên kết</th>
                      <th className="px-4 py-3 text-center w-28">Trạng thái</th>
                      <th className="w-32 px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredTypes.length > 0 ? (
                      filteredTypes.map((item) => (
                        <tr key={item.MaLoai} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-500">
                            #{item.ThuTuHienThi || 0}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-400">
                            #{item.MaLoai}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {item.TenLoai || item.TenLoaiND}
                          </td>
                          <td className="max-w-xs px-4 py-3 truncate text-slate-600">
                            {item.MoTa || <span className="italic text-slate-400">Chưa có mô tả</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {item.SoTinDang || 0} tin
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.TrangThai === "khóa" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <FaLock className="text-[10px]" /> Đã khóa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <FaCheckCircle className="text-[10px]" /> Hoạt động
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleToggle(item.MaLoai, "types")}
                                className={`p-1.5 rounded-md text-xs transition-colors ${
                                  item.TrangThai === "khóa"
                                    ? "text-emerald-600 hover:bg-emerald-50"
                                    : "text-amber-600 hover:bg-amber-50"
                                }`}
                                title={item.TrangThai === "khóa" ? "Mở khóa loại BĐS" : "Khóa loại BĐS"}
                              >
                                {item.TrangThai === "khóa" ? <FaUnlock /> : <FaLock />}
                              </button>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Chỉnh sửa loại BĐS"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    domain: "types",
                                    id: item.MaLoai,
                                    name: item.TenLoai || item.TenLoaiND,
                                  })
                                }
                                className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Xóa loại BĐS"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Không tìm thấy loại bất động sản nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TỈNH / THÀNH PHỐ */}
          {/* ========================================================================= */}
          {activeTab === "provinces" && (
            <div className="overflow-hidden bg-white border border-slate-200/90 rounded-xl shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="w-16 px-4 py-3">Thứ tự</th>
                      <th className="px-4 py-3 w-28">Mã tỉnh</th>
                      <th className="px-4 py-3">Tên Tỉnh / Thành phố</th>
                      <th className="w-32 px-4 py-3 text-center">Số Quận/Huyện</th>
                      <th className="px-4 py-3 text-center w-28">Tin liên kết</th>
                      <th className="px-4 py-3 text-center w-28">Trạng thái</th>
                      <th className="w-32 px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredProvinces.length > 0 ? (
                      filteredProvinces.map((item) => (
                        <tr key={item.MaTinh} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-500">
                            #{item.ThuTuHienThi || 0}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">
                            {item.MaTinh}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">{item.TenTinh}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-slate-700">
                              {item.SoQuanHuyen || 0} quận/huyện
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {item.SoTinDang || 0} tin
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.TrangThai === "khóa" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <FaLock className="text-[10px]" /> Đã khóa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <FaCheckCircle className="text-[10px]" /> Hoạt động
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleToggle(item.MaTinh, "provinces")}
                                className={`p-1.5 rounded-md text-xs transition-colors ${
                                  item.TrangThai === "khóa"
                                    ? "text-emerald-600 hover:bg-emerald-50"
                                    : "text-amber-600 hover:bg-amber-50"
                                }`}
                                title={item.TrangThai === "khóa" ? "Mở khóa tỉnh" : "Khóa tỉnh"}
                              >
                                {item.TrangThai === "khóa" ? <FaUnlock /> : <FaLock />}
                              </button>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Chỉnh sửa tỉnh/thành"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    domain: "provinces",
                                    id: item.MaTinh,
                                    name: item.TenTinh,
                                  })
                                }
                                className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Xóa tỉnh/thành"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Không tìm thấy tỉnh/thành phố nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: QUẬN / HUYỆN */}
          {/* ========================================================================= */}
          {activeTab === "districts" && (
            <div className="overflow-hidden bg-white border border-slate-200/90 rounded-xl shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 w-28">Mã huyện</th>
                      <th className="px-4 py-3">Tên Quận / Huyện</th>
                      <th className="px-4 py-3">Thuộc Tỉnh / Thành phố</th>
                      <th className="px-4 py-3 text-center w-28">Tin liên kết</th>
                      <th className="px-4 py-3 text-center w-28">Trạng thái</th>
                      <th className="w-32 px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {districts.length > 0 ? (
                      districts.map((item) => (
                        <tr key={item.MaHuyen} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">
                            {item.MaHuyen}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">{item.TenHuyen}</td>
                          <td className="px-4 py-3 text-slate-600">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {item.TenTinh || `Mã: ${item.MaTinh}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {item.SoTinDang || 0} tin
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.TrangThai === "khóa" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <FaLock className="text-[10px]" /> Đã khóa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <FaCheckCircle className="text-[10px]" /> Hoạt động
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleToggle(item.MaHuyen, "districts")}
                                className={`p-1.5 rounded-md text-xs transition-colors ${
                                  item.TrangThai === "khóa"
                                    ? "text-emerald-600 hover:bg-emerald-50"
                                    : "text-amber-600 hover:bg-amber-50"
                                }`}
                                title={item.TrangThai === "khóa" ? "Mở khóa huyện" : "Khóa huyện"}
                              >
                                {item.TrangThai === "khóa" ? <FaUnlock /> : <FaLock />}
                              </button>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Chỉnh sửa quận/huyện"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    domain: "districts",
                                    id: item.MaHuyen,
                                    name: item.TenHuyen,
                                  })
                                }
                                className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Xóa quận/huyện"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Không có quận/huyện nào trong khu vực này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DỰ ÁN BẤT ĐỘNG SẢN */}
          {/* ========================================================================= */}
          {activeTab === "projects" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {projects.length > 0 ? (
                projects.map((item) => (
                  <div
                    key={item.MaDuAn}
                    className="flex flex-col justify-between p-4 transition-all bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-slate-300"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex items-center justify-center flex-shrink-0 w-16 h-16 overflow-hidden border rounded-lg bg-slate-100 border-slate-200 text-slate-400">
                        {item.HinhAnh ? (
                          <img
                            src={
                              item.HinhAnh.startsWith("http")
                                ? item.HinhAnh
                                : `${SERVER_URL}${item.HinhAnh}`
                            }
                            alt={item.TenDuAn}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.target.src = "/placeholder.svg?height=64&width=64";
                            }}
                          />
                        ) : (
                          <FaBuilding className="text-xl text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] text-slate-400">
                            #{item.MaDuAn}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.TrangThai === "đang mở bán"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.TrangThai === "sắp mở bán"
                                ? "bg-blue-100 text-blue-800"
                                : item.TrangThai === "đã bàn giao"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.TrangThai}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold truncate text-slate-900">
                          {item.TenDuAn}
                        </h3>

                        {item.ChuDauTu && (
                          <p className="text-xs text-blue-700 font-medium truncate mt-0.5">
                            Chủ đầu tư: {item.ChuDauTu}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 truncate">
                          <FaMapMarkerAlt className="text-slate-400 text-[10px] flex-shrink-0" />
                          <span className="truncate">
                            {item.DiaChi || `${item.TenHuyen || ""}, ${item.TenTinh || ""}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.MoTa && (
                      <p className="p-2 mt-3 text-xs border rounded-lg text-slate-600 line-clamp-2 bg-slate-50 border-slate-100">
                        {item.MoTa}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 mt-3 text-xs border-t border-slate-100">
                      <span className="text-slate-500">
                        Tin đăng liên kết:{" "}
                        <strong className="text-blue-700">{item.SoTinDang || 0} tin</strong>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(item.MaDuAn, "projects")}
                          className={`p-1.5 rounded-md transition-colors ${
                            item.TrangThai === "khóa"
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-amber-600 hover:bg-amber-50"
                          }`}
                          title={item.TrangThai === "khóa" ? "Mở khóa dự án" : "Khóa dự án"}
                        >
                          {item.TrangThai === "khóa" ? <FaUnlock /> : <FaLock />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Chỉnh sửa dự án"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              domain: "projects",
                              id: item.MaDuAn,
                              name: item.TenDuAn,
                            })
                          }
                          className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa dự án"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-16 text-xs font-medium text-center bg-white border border-slate-200/90 rounded-xl text-slate-400">
                  Chưa có dự án bất động sản nào phù hợp.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL THÊM / SỬA CHUNG CHO CÁC DANH MỤC */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg p-6 space-y-4 bg-white border shadow-2xl rounded-xl border-slate-200 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                {editingItem ? <FaEdit className="text-blue-600" /> : <FaPlus className="text-blue-600" />}
                <span>
                  {editingItem ? "Chỉnh sửa" : "Thêm mới"}{" "}
                  {activeTab === "types" && "Loại bất động sản"}
                  {activeTab === "provinces" && "Tỉnh / Thành phố"}
                  {activeTab === "districts" && "Quận / Huyện"}
                  {activeTab === "projects" && "Dự án bất động sản"}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              {/* FORM: LOẠI BĐS */}
              {activeTab === "types" && (
                <>
                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Tên loại bất động sản *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Căn hộ chung cư, Nhà phố, Đất nền..."
                      value={formType.TenLoai}
                      onChange={(e) => setFormType({ ...formType, TenLoai: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Mô tả đặc điểm loại hình
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Nhập mô tả tóm tắt..."
                      value={formType.MoTa}
                      onChange={(e) => setFormType({ ...formType, MoTa: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-semibold text-slate-700">
                        Thứ tự hiển thị
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formType.ThuTuHienThi}
                        onChange={(e) =>
                          setFormType({ ...formType, ThuTuHienThi: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold text-slate-700">Trạng thái</label>
                      <select
                        value={formType.TrangThai}
                        onChange={(e) => setFormType({ ...formType, TrangThai: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="hoạt động">Hoạt động</option>
                        <option value="khóa">Khóa (Ẩn)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* FORM: TỈNH / THÀNH */}
              {activeTab === "provinces" && (
                <>
                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Mã Tỉnh / Thành phố *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingItem)}
                      placeholder="VD: 79 (TP.HCM), 01 (Hà Nội)..."
                      value={formProvince.MaTinh}
                      onChange={(e) =>
                        setFormProvince({ ...formProvince, MaTinh: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Tên Tỉnh / Thành phố *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: TP. Hồ Chí Minh, Hà Nội, Đà Nẵng..."
                      value={formProvince.TenTinh}
                      onChange={(e) =>
                        setFormProvince({ ...formProvince, TenTinh: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-semibold text-slate-700">
                        Thứ tự hiển thị
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formProvince.ThuTuHienThi}
                        onChange={(e) =>
                          setFormProvince({
                            ...formProvince,
                            ThuTuHienThi: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold text-slate-700">Trạng thái</label>
                      <select
                        value={formProvince.TrangThai}
                        onChange={(e) =>
                          setFormProvince({ ...formProvince, TrangThai: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="hoạt động">Hoạt động</option>
                        <option value="khóa">Khóa (Ẩn)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* FORM: QUẬN / HUYỆN */}
              {activeTab === "districts" && (
                <>
                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Thuộc Tỉnh / Thành phố *
                    </label>
                    <select
                      required
                      value={formDistrict.MaTinh}
                      onChange={(e) =>
                        setFormDistrict({ ...formDistrict, MaTinh: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {provinces.map((p) => (
                        <option key={p.MaTinh} value={p.MaTinh}>
                          {p.TenTinh}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Mã Quận / Huyện *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingItem)}
                      placeholder="VD: 760, 761, 001..."
                      value={formDistrict.MaHuyen}
                      onChange={(e) =>
                        setFormDistrict({ ...formDistrict, MaHuyen: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Tên Quận / Huyện *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Quận 1, Quận Bình Thạnh, TP. Thủ Đức..."
                      value={formDistrict.TenHuyen}
                      onChange={(e) =>
                        setFormDistrict({ ...formDistrict, TenHuyen: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">Trạng thái</label>
                    <select
                      value={formDistrict.TrangThai}
                      onChange={(e) =>
                        setFormDistrict({ ...formDistrict, TrangThai: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hoạt động">Hoạt động</option>
                      <option value="khóa">Khóa (Ẩn)</option>
                    </select>
                  </div>
                </>
              )}

              {/* FORM: DỰ ÁN BẤT ĐỘNG SẢN */}
              {activeTab === "projects" && (
                <>
                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Tên dự án bất động sản *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Vinhomes Grand Park, Masteri Centre Point..."
                      value={formProject.TenDuAn}
                      onChange={(e) =>
                        setFormProject({ ...formProject, TenDuAn: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Chủ đầu tư
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Tập đoàn Vingroup, Masterise Homes, Gamuda Land..."
                      value={formProject.ChuDauTu}
                      onChange={(e) =>
                        setFormProject({ ...formProject, ChuDauTu: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-semibold text-slate-700">Tỉnh / Thành</label>
                      <select
                        value={formProject.MaTinh}
                        onChange={(e) =>
                          setFormProject({
                            ...formProject,
                            MaTinh: e.target.value,
                            MaHuyen: "",
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Chọn tỉnh/thành</option>
                        {provinces.map((p) => (
                          <option key={p.MaTinh} value={p.MaTinh}>
                            {p.TenTinh}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold text-slate-700">Quận / Huyện</label>
                      <select
                        value={formProject.MaHuyen}
                        onChange={(e) =>
                          setFormProject({ ...formProject, MaHuyen: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Chọn quận/huyện</option>
                        {modalDistricts.map((d) => (
                          <option key={d.MaHuyen} value={d.MaHuyen}>
                            {d.TenHuyen}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Địa chỉ cụ thể
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Xiển & Phước Thiện, P. Long Thạnh Mỹ..."
                      value={formProject.DiaChi}
                      onChange={(e) =>
                        setFormProject({ ...formProject, DiaChi: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Trạng thái dự án
                    </label>
                    <select
                      value={formProject.TrangThai}
                      onChange={(e) =>
                        setFormProject({ ...formProject, TrangThai: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="đang mở bán">Đang mở bán</option>
                      <option value="sắp mở bán">Sắp mở bán</option>
                      <option value="đã bàn giao">Đã bàn giao</option>
                      <option value="tạm ngưng">Tạm ngưng</option>
                      <option value="khóa">Đã khóa (Ẩn)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-slate-700">
                      Mô tả dự án
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Quy mô, tiện ích, vị trí..."
                      value={formProject.MoTa}
                      onChange={(e) =>
                        setFormProject({ ...formProject, MoTa: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold transition-colors rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white transition-colors bg-blue-600 rounded-lg shadow-xs hover:bg-blue-700"
                >
                  {editingItem ? "Lưu thay đổi" : "Tạo danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL XÁC NHẬN XÓA */}
      {/* ========================================================================= */}
      {deleteConfirm.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setDeleteConfirm({ isOpen: false, domain: "", id: null, name: "" })}
        >
          <div
            className="w-full max-w-sm p-6 space-y-4 bg-white border shadow-2xl rounded-xl border-slate-200 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 mx-auto text-xl rounded-full bg-rose-50 text-rose-600">
              <FaTrash />
            </div>

            <div className="space-y-1 text-center">
              <h3 className="text-sm font-bold text-slate-900">Xác nhận xóa danh mục?</h3>
              <p className="text-xs text-slate-600">
                Bạn có chắc chắn muốn xóa: <strong>"{deleteConfirm.name}"</strong>?
              </p>
              <p className="text-[11px] text-amber-600 font-medium">
                Lưu ý: Nếu danh mục đã có tin đăng hoặc khu vực phụ thuộc, hệ thống sẽ từ chối để bảo vệ toàn vẹn dữ liệu.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, domain: "", id: null, name: "" })}
                className="px-4 py-2 text-xs font-semibold transition-colors rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white transition-colors rounded-lg shadow-xs bg-rose-600 hover:bg-rose-700"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;