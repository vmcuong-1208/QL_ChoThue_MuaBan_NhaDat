"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaUpload, FaTrash, FaInfoCircle } from "react-icons/fa";
import locationService from "../../services/locationService";
import CoordinateInput from "../map-gis/CoordinateInput";
import GoogleMapComponent from "../map-gis/GoogleMapComponent";
import GPSLocationPicker from "../map-gis/GPSLocationPicker";
import { API_URL } from "../../services/api";

const PostForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  // --- STATE & LOGIC TỪ UPSTREAM (Giữ nguyên để đảm bảo chức năng) ---
  const [formData, setFormData] = useState({
    TieuDe: "",
    MoTa: "",
    Gia: "",
    DienTich: "",
    DiaChi: "",
    MaLoaiND: "",
    MaTinh: "",
    MaHuyen: "",
    MaXa: "",
    TrangThai: "đang bán",
    ToaDoVN2000: null,
    GPS_Lat: "",
    GPS_Lng: "",
    VideoThuaDat: "",
    HinhAnh: [],
    HinhAnhGiayTo: [],
    // Các trường đặc thù của tin thuê (Phong cách Chợ Tốt)
    TienDatCoc: "",
    ThoiHanThue: "Dài hạn",
    TienDien: "",
    TienNuoc: "",
    PhiDichVu: "",
    NoiThat: "Đầy đủ",
    TienIch: "",
  });

  // State tiện ích dạng checkbox cho tin thuê
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [documentImageFiles, setDocumentImageFiles] = useState([]);
  const [documentImagePreview, setDocumentImagePreview] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [propertyTypes, setPropertyTypes] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedProvinceName, setSelectedProvinceName] = useState(null);

  // --- EFFECTS ---
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/property-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPropertyTypes(response.data);
        if (!isEditing && response.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            MaLoaiND: response.data[0].MaLoai,
          }));
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách loại nhà đất:", error);
      }
    };
    fetchPropertyTypes();
  }, [isEditing]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingLocations(true);
        const data = await locationService.getProvinces();
        setProvinces(data);
        setLoadingLocations(false);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error);
        setLoadingLocations(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.MaTinh) {
        setDistricts([]);
        return;
      }
      try {
        setLoadingLocations(true);
        const data = await locationService.getDistricts(formData.MaTinh);
        setDistricts(data);
        setLoadingLocations(false);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách quận/huyện:", error);
        setLoadingLocations(false);
      }
    };
    fetchDistricts();
  }, [formData.MaTinh]);

  useEffect(() => {
    const fetchWards = async () => {
      if (!formData.MaHuyen) {
        setWards([]);
        return;
      }
      try {
        setLoadingLocations(true);
        const data = await locationService.getWards(formData.MaHuyen);
        setWards(data);
        setLoadingLocations(false);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách phường/xã:", error);
        setLoadingLocations(false);
      }
    };
    fetchWards();
  }, [formData.MaHuyen]);

  useEffect(() => {
    if (isEditing) {
      const fetchPropertyData = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`${API_URL}/properties/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const property = response.data;
          setFormData({
            TieuDe: property.TieuDe || "",
            MoTa: property.MoTa || "",
            Gia: property.Gia || "",
            DienTich: property.DienTich || "",
            DiaChi: property.DiaChi || "",
            MaLoaiND: property.MaLoaiND || "",
            MaTinh: property.MaTinh || "",
            MaHuyen: property.MaHuyen || "",
            MaXa: property.MaXa || "",
            TrangThai: property.TrangThai || "đang bán",
            ToaDoVN2000: property.ToaDoVN2000
              ? JSON.parse(property.ToaDoVN2000)
              : null,
            GPS_Lat: property.GPS_Lat || "",
            GPS_Lng: property.GPS_Lng || "",
            VideoThuaDat: property.VideoThuaDat || "",
            HinhAnh: property.HinhAnh || [],
            HinhAnhGiayTo: property.HinhAnhGiayTo || [],
          });

          if (property.HinhAnh && property.HinhAnh.length > 0) {
            setImagePreview(property.HinhAnh);
          }
          if (property.HinhAnhGiayTo && property.HinhAnhGiayTo.length > 0) {
            setDocumentImagePreview(property.HinhAnhGiayTo);
          }
          if (property.VideoThuaDat) {
            setVideoPreview(property.VideoThuaDat);
          }
          if (property.MaTinh) {
            const province = provinces.find(
              (p) => p.MaTinh === property.MaTinh
            );
            setSelectedProvinceName(province?.TenTinh || null);
          }
        } catch (error) {
          console.error("Lỗi khi lấy dữ liệu bài đăng:", error);
          setError("Không thể tải dữ liệu bài đăng. Vui lòng thử lại sau.");
        }
      };
      fetchPropertyData();
    }
  }, [id, isEditing, provinces]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["Gia", "DienTich", "GPS_Lat", "GPS_Lng"].includes(name)) {
      const numValue = value === "" ? "" : Number(value);
      setFormData({ ...formData, [name]: numValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (name === "MaTinh") {
      setFormData((prev) => ({
        ...prev,
        MaHuyen: "",
        MaXa: "",
        [name]: value,
      }));
      const province = provinces.find((p) => p.MaTinh === Number(value));
      setSelectedProvinceName(province?.TenTinh || null);
    } else if (name === "MaHuyen") {
      setFormData((prev) => ({ ...prev, MaXa: "", [name]: value }));
    }
  };

  const handleCoordinateChange = (coordinateData) => {
    setFormData({
      ...formData,
      ToaDoVN2000: coordinateData,
      DienTich: coordinateData.area
        ? coordinateData.area.toFixed(2)
        : formData.DienTich,
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles([...imageFiles, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...newPreviews]);
  };

  const handleDocumentImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setDocumentImageFiles([...documentImageFiles, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setDocumentImagePreview([...documentImagePreview, ...newPreviews]);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("Video không được vượt quá 50MB");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = (index) => {
    const newImageFiles = [...imageFiles];
    const newImagePreview = [...imagePreview];
    if (index >= imageFiles.length) {
      const serverImageIndex = index - imageFiles.length;
      const newHinhAnh = formData.HinhAnh.filter(
        (_, i) => i !== serverImageIndex
      );
      setFormData({ ...formData, HinhAnh: newHinhAnh });
      newImagePreview.splice(index, 1);
    } else {
      newImageFiles.splice(index, 1);
      newImagePreview.splice(index, 1);
    }
    setImageFiles(newImageFiles);
    setImagePreview(newImagePreview);
  };

  const handleRemoveDocumentImage = (index) => {
    const newDocumentImageFiles = [...documentImageFiles];
    const newDocumentImagePreview = [...documentImagePreview];
    if (index >= documentImageFiles.length) {
      const serverImageIndex = index - documentImageFiles.length;
      const newHinhAnhGiayTo = formData.HinhAnhGiayTo.filter(
        (_, i) => i !== serverImageIndex
      );
      setFormData({ ...formData, HinhAnhGiayTo: newHinhAnhGiayTo });
      newDocumentImagePreview.splice(index, 1);
    } else {
      newDocumentImageFiles.splice(index, 1);
      newDocumentImagePreview.splice(index, 1);
    }
    setDocumentImageFiles(newDocumentImageFiles);
    setDocumentImagePreview(newDocumentImagePreview);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setFormData({ ...formData, VideoThuaDat: "" });
  };

  const handleGPSLocationChange = (location) => {
    setFormData({
      ...formData,
      GPS_Lat: location.lat,
      GPS_Lng: location.lng,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (currentUser?.LoaiTaiKhoan?.toLowerCase() === "thường" && !isEditing) {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`${API_URL}/properties/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.length >= 1) {
            setError(
              "Tài khoản thường chỉ được đăng tối đa 1 tin. Vui lòng nâng cấp tài khoản để đăng thêm tin."
            );
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error checking post limit:", error);
        }
      }

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth");
        return;
      }

      const postData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (
          key !== "HinhAnh" &&
          key !== "HinhAnhGiayTo" &&
          key !== "ToaDoVN2000"
        ) {
          postData.append(key, formData[key]);
        }
      });

      const isRental = formData.TrangThai === "cho thuê";
      if (
        !isRental &&
        (!formData.ToaDoVN2000 ||
          !formData.ToaDoVN2000.coordinates ||
          formData.ToaDoVN2000.coordinates.length === 0)
      ) {
        setError("Vui lòng nhập tọa độ VN2000 (bắt buộc đối với tin bán).");
        setLoading(false);
        return;
      }

      if (formData.ToaDoVN2000) {
        postData.append("ToaDoVN2000", JSON.stringify(formData.ToaDoVN2000));
      }
      if (formData.HinhAnh && formData.HinhAnh.length > 0) {
        postData.append("HinhAnhCu", JSON.stringify(formData.HinhAnh));
      }
      if (formData.HinhAnhGiayTo && formData.HinhAnhGiayTo.length > 0) {
        postData.append(
          "HinhAnhGiaytoCu",
          JSON.stringify(formData.HinhAnhGiayTo)
        );
      }

      imageFiles.forEach((file) => postData.append("HinhAnh", file));
      documentImageFiles.forEach((file) =>
        postData.append("HinhAnhGiayTo", file)
      );
      if (videoFile) postData.append("VideoThuaDat", videoFile);

      if (isEditing) {
        await axios.put(`${API_URL}/properties/${id}`, postData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axios.post(`${API_URL}/properties`, postData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setSuccess(true);
      setTimeout(() => navigate("/quan-ly-bai-dang"), 2000);
    } catch (error) {
      console.error("Lỗi khi lưu bài đăng:", error);
      setError(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi lưu bài đăng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const statuses = ["đang bán", "cho thuê", "đã bán", "đã cho thuê"];

  const handleTransactionTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      TrangThai: type,
    }));
  };

  // --- RENDER (SỬ DỤNG GIAO DIỆN CỦA BẠN - STASHED CHANGES) ---
  return (
    <div className="min-h-screen py-6 pt-24 bg-slate-50">
      <div className="container max-w-screen-xl px-4 mx-auto">
        {/* Alerts */}
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border-l-4 border-red-500 rounded-lg animate-slideInLeft">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 mb-6 text-green-700 bg-green-100 border-l-4 border-green-500 rounded-lg animate-slideInLeft">
            {isEditing
              ? "Cập nhật bài đăng thành công!"
              : "Đăng tin thành công!"}
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CỘT TRÁI (7/12): Thông tin chi tiết, Nội dung & Media */}
              <div className="lg:col-span-7 space-y-4">
                {/* === PHÂN LOẠI NHU CẦU: BÁN HOẶC CHO THUÊ (PHONG CÁCH CHỢ TỐT) === */}
              <div
                className="p-5 transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl animate-fadeInUp"
                style={{ animationDelay: "0ms" }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Nhu cầu đăng tin <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Chọn đúng hình thức để tiếp cận khách hàng tiềm năng
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-xl w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleTransactionTypeChange("đang bán")}
                      className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                        formData.TrangThai === "đang bán" || formData.TrangThai === "đã bán"
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      <span>🏷️</span> Cần bán
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTransactionTypeChange("cho thuê")}
                      className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                        formData.TrangThai === "cho thuê" || formData.TrangThai === "đã cho thuê"
                          ? "bg-green-600 text-white shadow-md"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      <span>🔑</span> Cho thuê
                    </button>
                  </div>
                </div>
              </div>

                {/* === SECTION 1: THÔNG TIN CƠ BẢN === */}
              <div
                className="p-5 transition-all duration-200 bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md animate-fadeInUp"
                style={{ animationDelay: "50ms" }}
              >
                <h2 className="flex items-center gap-2 mb-3 text-base font-bold text-gray-800">
                  <span className="text-lg">📝</span> Thông tin
                  cơ bản
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="TieuDe"
                      value={formData.TieuDe}
                      onChange={handleChange}
                      placeholder={
                        formData.TrangThai === "cho thuê"
                          ? "VD: Cho thuê căn hộ 2PN Vinhomes Central Park giá tốt"
                          : "VD: Bán nhà mặt tiền đường Lê Lợi, Quận 1"
                      }
                      required
                      className="w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="MoTa"
                      value={formData.MoTa}
                      onChange={handleChange}
                      placeholder="Mô tả chi tiết về bất động sản..."
                      rows="4"
                      required
                      className="w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="relative group">
                      <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                        Loại BĐS <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="MaLoaiND"
                        value={formData.MaLoaiND}
                        onChange={handleChange}
                        required
                        className="w-full px-3.5 py-2.5 pr-10 text-sm font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                      >
                        <option value="">Chọn loại BĐS</option>
                        {propertyTypes.map((type) => (
                          <option key={type.MaLoai} value={type.MaLoai}>
                            {type.TenLoai}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none top-7">
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="relative group">
                        <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                          Tình trạng bài đăng
                        </label>
                        <select
                          name="TrangThai"
                          value={formData.TrangThai}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 pr-10 text-sm font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                        >
                          {formData.TrangThai === "cho thuê" || formData.TrangThai === "đã cho thuê" ? (
                            <>
                              <option value="cho thuê">Đang cho thuê</option>
                              <option value="đã cho thuê">Đã cho thuê</option>
                            </>
                          ) : (
                            <>
                              <option value="đang bán">Đang bán</option>
                              <option value="đã bán">Đã bán</option>
                            </>
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none top-7">
                          <svg
                            className="w-5 h-5 text-gray-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 border rounded-lg bg-gray-50 border-gray-200">
                        <div className="text-sm">
                          <span className="font-bold text-gray-700">Hình thức đang chọn: </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            formData.TrangThai === "cho thuê"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {formData.TrangThai === "cho thuê" ? "🔑 Đang Cho Thuê" : "🏷️ Đang Cần Bán"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

                {/* === SECTION 2: THÔNG TIN CHI TIẾT (GIÁ & DIỆN TÍCH) === */}
              <div
                className="p-5 transition-all duration-200 bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md animate-fadeInUp"
                style={{ animationDelay: "100ms" }}
              >
                <h2 className="flex items-center gap-2 mb-3 text-base font-bold text-gray-800">
                  <span className="text-lg">💰</span> Thông tin
                  chi tiết
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      {formData.TrangThai === "cho thuê" ? "Giá thuê (VNĐ/tháng)" : "Giá bán (VNĐ)"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="Gia"
                      value={formData.Gia}
                      onChange={handleChange}
                      placeholder={
                        formData.TrangThai === "cho thuê"
                          ? "VD: 15000000 (15 triệu/tháng)"
                          : "VD: 5000000000 (5 tỷ)"
                      }
                      min="0"
                      required
                      className="w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      Diện tích (m²) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="DienTich"
                      value={formData.DienTich}
                      onChange={handleChange}
                      placeholder="VD: 100"
                      min="0"
                      required
                      className="w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                    />
                    <p className="mt-1 text-sm font-medium text-gray-500">
                      Tự động tính từ tọa độ VN2000 nếu nhập đầy đủ
                    </p>
                  </div>
                </div>

                {/* Phần thông tin bổ sung ĐẶC THÙ CHO THUÊ (Kiểu Chợ Tốt) */}
                {formData.TrangThai === "cho thuê" && (
                  <div className="pt-6 mt-6 border-t border-gray-200">
                    <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-green-700">
                      <span>🔑</span> Chi tiết cho thuê (Chợ Tốt Style)
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                          Tiền đặt cọc (VNĐ)
                        </label>
                        <input
                          type="number"
                          name="TienDatCoc"
                          value={formData.TienDatCoc}
                          onChange={handleChange}
                          placeholder="VD: 15000000 (Cọc 1 tháng)"
                          min="0"
                          className="w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 transition-all border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none hover:border-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                          Thời hạn hợp đồng thuê
                        </label>
                        <select
                          name="ThoiHanThue"
                          value={formData.ThoiHanThue}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none hover:border-gray-400"
                        >
                          <option value="Dưới 6 tháng">Dưới 6 tháng</option>
                          <option value="6 tháng">6 tháng</option>
                          <option value="1 năm">1 năm</option>
                          <option value="Dài hạn">Dài hạn (Trên 1 năm)</option>
                          <option value="Linh hoạt">Linh hoạt theo thỏa thuận</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                          Tình trạng nội thất
                        </label>
                        <select
                          name="NoiThat"
                          value={formData.NoiThat}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none hover:border-gray-400"
                        >
                          <option value="Đầy đủ">Nội thất cao cấp / Đầy đủ</option>
                          <option value="Cơ bản">Nội thất cơ bản (Bếp, điều hòa, nóng lạnh)</option>
                          <option value="Nhà trống">Nhà trống / Tự decor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                          Chi phí dịch vụ (Điện, nước, phí quản lý)
                        </label>
                        <input
                          type="text"
                          name="PhiDichVu"
                          value={formData.PhiDichVu}
                          onChange={handleChange}
                          placeholder="VD: Điện 3.5k/số, Nước 100k/người, Xe 120k"
                          className="w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 transition-all border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none hover:border-gray-400"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                        Tiện ích phòng & tòa nhà
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 sm:grid-cols-4">
                        {[
                          "Máy lạnh",
                          "Tủ lạnh",
                          "Máy giặt",
                          "Gác lửng",
                          "Có thang máy",
                          "Giờ giấc tự do",
                          "Chỗ để xe riêng",
                          "Bảo vệ 24/7",
                          "Camera an ninh",
                          "Cho nuôi thú cưng",
                          "Ban công thoáng mát",
                          "Bếp riêng",
                        ].map((amenity) => (
                          <label
                            key={amenity}
                            className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-all ${
                              (formData.TienIch || "").includes(amenity)
                                ? "bg-green-50 border-green-500 text-green-800 font-semibold"
                                : "hover:bg-gray-50 border-gray-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={(formData.TienIch || "").includes(amenity)}
                              onChange={(e) => {
                                const current = (formData.TienIch || "")
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                let updated;
                                if (e.target.checked) {
                                  updated = [...current, amenity];
                                } else {
                                  updated = current.filter((item) => item !== amenity);
                                }
                                setFormData((prev) => ({
                                  ...prev,
                                  TienIch: updated.join(", "),
                                }));
                              }}
                              className="text-green-600 rounded focus:ring-green-500"
                            />
                            <span>{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* === SECTION 5: HÌNH ẢNH & VIDEO (Mới từ Upstream, style Stashed) === */}
              {/* Giấy tờ */}
              <div
                className="p-5 transition-all duration-200 bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md animate-fadeInUp"
                style={{ animationDelay: "400ms" }}
              >
                <h2 className="flex items-center gap-2 mb-3 text-base font-bold text-gray-800">
                  <span className="text-lg">📄</span> Hình ảnh
                  giấy tờ
                </h2>
                <p className="mb-4 text-sm font-bold text-gray-600">
                  Tải lên ảnh sổ đỏ, trích đo địa chính (Tối đa 10 ảnh, JPG/PNG,
                  max 5MB/ảnh)
                </p>

                <label className="flex items-center justify-center gap-2 px-6 py-4 text-blue-600 transition-all border-2 border-blue-300 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 hover:scale-105">
                  <FaUpload /> Chọn ảnh giấy tờ
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDocumentImageUpload}
                    className="hidden"
                    disabled={documentImagePreview.length >= 10}
                  />
                </label>

                <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-3 lg:grid-cols-4">
                  {documentImagePreview.length > 0 ? (
                    documentImagePreview.map((src, index) => (
                      <div
                        key={index}
                        className="relative transition-transform duration-300 group hover:scale-105"
                      >
                        <img
                          src={src}
                          alt={`Giấy tờ ${index + 1}`}
                          className="object-cover w-full h-32 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDocumentImage(index)}
                          className="absolute p-2 text-white transition-all bg-red-500 rounded-full opacity-0 top-2 right-2 hover:bg-red-600 group-hover:opacity-100 hover:scale-110"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="font-medium text-center text-gray-400 col-span-full">
                      Chưa có ảnh
                    </p>
                  )}
                </div>
              </div>

              {/* Ảnh BĐS & Video */}
              <div
                className="p-5 transition-all duration-200 bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md animate-fadeInUp"
                style={{ animationDelay: "500ms" }}
              >
                <h2 className="flex items-center gap-2 mb-3 text-base font-bold text-gray-800">
                  <span className="text-lg">📷</span> Hình ảnh &
                  Video BĐS
                </h2>
                <p className="mb-4 text-sm font-bold text-gray-600">
                  Tải ảnh chụp thực tế (Tối đa 10 ảnh, JPG/PNG, max 5MB/ảnh)
                </p>

                <label className="flex items-center justify-center gap-2 px-6 py-4 font-bold text-blue-600 transition-all border-2 border-blue-300 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 hover:scale-105">
                  <FaUpload /> Chọn ảnh BĐS
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={imagePreview.length >= 10}
                  />
                </label>

                <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-3 lg:grid-cols-4">
                  {imagePreview.length > 0 ? (
                    imagePreview.map((src, index) => (
                      <div
                        key={index}
                        className="relative transition-transform duration-300 group hover:scale-105"
                      >
                        <img
                          src={src}
                          alt={`BĐS ${index + 1}`}
                          className="object-cover w-full h-32 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute p-2 text-white transition-all bg-red-500 rounded-full opacity-0 top-2 right-2 hover:bg-red-600 group-hover:opacity-100 hover:scale-110"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="font-medium text-center text-gray-400 col-span-full">
                      Chưa có ảnh
                    </p>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-gray-200">
                  <h3 className="mb-3 text-lg font-bold text-gray-800">
                    Video thửa đất (tùy chọn)
                  </h3>
                  <p className="mb-4 text-sm font-bold text-gray-600">
                    Tối đa 50MB, định dạng MP4/MOV/AVI
                  </p>

                  {!videoPreview ? (
                    <label className="flex items-center justify-center gap-2 px-6 py-4 font-bold text-purple-600 transition-all border-2 border-purple-300 border-dashed rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-500 hover:scale-105">
                      <FaUpload /> Chọn video
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative animate-scaleIn">
                      <video controls className="w-full rounded-lg">
                        <source src={videoPreview} type="video/mp4" />
                      </video>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="flex items-center gap-2 px-4 py-2 mt-3 font-bold text-white transition-all bg-red-500 rounded-lg hover:bg-red-600 hover:scale-105 active:scale-95"
                      >
                        <FaTrash /> Xóa video
                      </button>
                    </div>
                  )}
                </div>
              </div>

                {/* Action Buttons */}
              <div
                className="flex gap-4 animate-fadeInUp"
                style={{ animationDelay: "600ms" }}
              >
                <button
                  type="button"
                  onClick={() => navigate("/quan-ly-bai-dang")}
                  disabled={loading}
                  className="flex-1 px-6 py-3 font-bold text-gray-700 transition-all bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 font-bold text-white transition-all rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {loading
                    ? "Đang xử lý..."
                    : isEditing
                    ? "Cập nhật"
                    : "Đăng tin"}
                </button>
              </div>
              </div>

              {/* CỘT PHẢI (5/12): Vị trí địa lý & Bản đồ VN2000 (Sticky cuộn theo) */}
              <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                {/* === SECTION 3: ĐỊA CHỈ & GPS === */}
              <div
                className="p-5 transition-all duration-200 bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md animate-fadeInUp"
                style={{ animationDelay: "200ms" }}
              >
                <h2 className="flex items-center gap-2 mb-3 text-base font-bold text-gray-800">
                  <span className="text-lg">📍</span> Địa chỉ
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="relative group">
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      Tỉnh/TP <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="MaTinh"
                      value={formData.MaTinh}
                      onChange={handleChange}
                      required
                      disabled={loadingLocations}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:bg-gray-100 hover:border-gray-400"
                    >
                      <option value="">Chọn Tỉnh/TP</option>
                      {provinces.map((province) => (
                        <option key={province.MaTinh} value={province.MaTinh}>
                          {province.TenTinh}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none top-7">
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      Quận/Huyện <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="MaHuyen"
                      value={formData.MaHuyen}
                      onChange={handleChange}
                      required
                      disabled={!formData.MaTinh || loadingLocations}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:bg-gray-100 hover:border-gray-400"
                    >
                      <option value="">Chọn Quận/Huyện</option>
                      {districts.map((district) => (
                        <option key={district.MaHuyen} value={district.MaHuyen}>
                          {district.TenHuyen}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none top-7">
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="MaXa"
                      value={formData.MaXa}
                      onChange={handleChange}
                      required
                      disabled={!formData.MaHuyen || loadingLocations}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:bg-gray-100 hover:border-gray-400"
                    >
                      <option value="">Chọn Phường/Xã</option>
                      {wards.map((ward) => (
                        <option key={ward.MaXa} value={ward.MaXa}>
                          {ward.TenXa}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none top-7">
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                    Địa chỉ chi tiết <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="DiaChi"
                    value={formData.DiaChi}
                    onChange={handleChange}
                    placeholder="Số nhà, tên đường..."
                    required
                    className="w-full px-3.5 py-2.5 text-sm font-medium text-gray-800 transition-all border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
                  />
                </div>

                <div className="mt-6">
                  <GPSLocationPicker
                    onLocationChange={handleGPSLocationChange}
                    initialLat={formData.GPS_Lat}
                    initialLng={formData.GPS_Lng}
                  />
                </div>
              </div>

                {/* === SECTION 4: TỌA ĐỘ VN2000 (Mới từ Upstream, style Stashed) === */}
              {formData.TrangThai !== "cho thuê" ? (
                <div
                  className="p-5 transition-all duration-200 bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md animate-fadeInUp"
                  style={{ animationDelay: "300ms" }}
                >
                  <h2 className="flex items-center gap-2 mb-3 text-base font-bold text-gray-800">
                    <span className="text-lg">🗺️</span> Tọa độ
                    VN2000
                  </h2>
                  <div className="flex items-start gap-2 p-4 mb-4 border-l-4 border-blue-500 rounded-r-lg bg-blue-50">
                    <FaInfoCircle className="flex-shrink-0 mt-1 text-blue-600" />
                    <p className="text-sm font-medium text-gray-700">
                      Nhập tọa độ các điểm góc từ giấy tờ pháp lý (sổ đỏ, trích
                      đo địa chính)
                    </p>
                  </div>

                  <CoordinateInput
                    value={formData.ToaDoVN2000?.coordinates || []}
                    onChange={handleCoordinateChange}
                    provinceName={selectedProvinceName}
                  />

                  {formData.ToaDoVN2000?.wgs84Coordinates &&
                    formData.ToaDoVN2000.wgs84Coordinates.length >= 3 && (
                      <div className="mt-6 animate-scaleIn">
                        <h4 className="mb-3 text-lg font-bold text-gray-800">
                          Xem trước khung viền:
                        </h4>
                        <GoogleMapComponent
                          center={formData.ToaDoVN2000.wgs84Coordinates[0]}
                          zoom={18}
                          propertyBoundary={
                            formData.ToaDoVN2000.wgs84Coordinates
                          }
                          propertyArea={formData.ToaDoVN2000.area}
                          height="400px"
                          showControls={true}
                        />
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 border border-blue-200 bg-blue-50 rounded-xl animate-fadeInUp">
                  <FaInfoCircle className="text-blue-500" />
                  <span className="font-medium text-blue-700">
                    Tin cho thuê không yêu cầu tọa độ VN2000. Bạn chỉ cần nhập
                    thông tin GPS (nếu có).
                  </span>
                </div>
              )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostForm;
