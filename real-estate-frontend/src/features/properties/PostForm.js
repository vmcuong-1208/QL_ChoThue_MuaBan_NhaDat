"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaUpload, FaTrash, FaInfoCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import locationService from "../../services/locationService";
import CoordinateInput from "../map-gis/CoordinateInput";
import LeafletMapComponent from "../map-gis/LeafletMapComponent";
import GPSLocationPicker from "../map-gis/GPSLocationPicker";
import ImagePreviewModal from "./ImagePreviewModal";
import { API_URL } from "../../services/api";

// --- HELPER FORMAT TIỀN TỆ & GỢI Ý BANKING STYLE ---
const formatChipText = (amount) => {
  if (amount >= 1e9) {
    const val = amount / 1e9;
    return (Number.isInteger(val) ? val : parseFloat(val.toFixed(2))) + " tỷ";
  }
  if (amount >= 1e6) {
    const val = amount / 1e6;
    return (Number.isInteger(val) ? val : parseFloat(val.toFixed(2))) + " triệu";
  }
  if (amount >= 1e3) {
    const val = amount / 1e3;
    return (Number.isInteger(val) ? val : parseFloat(val.toFixed(2))) + " nghìn";
  }
  return amount + " đ";
};

const getPriceSuggestions = (inputVal) => {
  if (!inputVal) return [];
  const val = parseFloat(inputVal);
  if (isNaN(val) || val <= 0 || val >= 100000) return [];

  let rawValues = [];
  if (val < 10) {
    rawValues = [val * 1e6, val * 10e6, val * 100e6, val * 1e9];
  } else if (val < 100) {
    rawValues = [val * 1e6, val * 10e6, val * 100e6, val * 1e9];
  } else if (val < 1000) {
    rawValues = [val * 1e6, val * 10e6, val * 100e6];
  } else if (val < 10000) {
    rawValues = [val * 1e6, val * 10e6];
  }

  const seen = new Set();
  return rawValues
    .map((v) => ({
      text: formatChipText(Math.round(v)),
      value: Math.round(v),
    }))
    .filter((s) => {
      if (seen.has(s.value)) return false;
      seen.add(s.value);
      return true;
    });
};

const formatVNDWords = (num) => {
  if (!num || isNaN(num) || num <= 0) return "";
  num = Math.round(Number(num));
  if (num < 1000) return num.toLocaleString("vi-VN") + " đ";

  const ty = Math.floor(num / 1e9);
  const trieu = Math.floor((num % 1e9) / 1e6);
  const nghin = Math.floor((num % 1e6) / 1e3);
  const dong = num % 1e3;

  let parts = [];
  if (ty > 0) parts.push(ty + " tỷ");
  if (trieu > 0) parts.push(trieu + " triệu");
  if (nghin > 0) parts.push(nghin + " nghìn");
  if (dong > 0 && parts.length === 0) parts.push(dong + " đồng");

  return parts.join(" ") + " VNĐ";
};

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
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});

  // Tự động đóng thông báo lỗi sau 6 giây
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

    // Xóa viền đỏ của trường nếu người dùng bắt đầu nhập / chọn
    if (invalidFields[name]) {
      setInvalidFields((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
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
    if (invalidFields.ToaDoVN2000) {
      setInvalidFields((prev) => {
        const updated = { ...prev };
        delete updated.ToaDoVN2000;
        return updated;
      });
    }
    if (invalidFields.DienTich) {
      setInvalidFields((prev) => {
        const updated = { ...prev };
        delete updated.DienTich;
        return updated;
      });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles([...imageFiles, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...newPreviews]);
    if (invalidFields.HinhAnh) {
      setInvalidFields((prev) => {
        const updated = { ...prev };
        delete updated.HinhAnh;
        return updated;
      });
    }
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

    // --- VALIDATION CÁC TRƯỜNG BẮT BUỘC & VIỀN ĐỎ ---
    const newInvalidFields = {};
    let firstErrorField = null;
    let firstErrorMessage = "";

    // 1. Tiêu đề
    if (!formData.TieuDe || !formData.TieuDe.trim()) {
      newInvalidFields.TieuDe = true;
      if (!firstErrorField) {
        firstErrorField = "TieuDe";
        firstErrorMessage = "Vui lòng nhập tiêu đề bài đăng.";
      }
    }

    // 2. Mô tả
    if (!formData.MoTa || !formData.MoTa.trim()) {
      newInvalidFields.MoTa = true;
      if (!firstErrorField) {
        firstErrorField = "MoTa";
        firstErrorMessage = "Vui lòng nhập mô tả chi tiết bất động sản.";
      }
    }

    // 3. Loại BĐS
    if (!formData.MaLoaiND) {
      newInvalidFields.MaLoaiND = true;
      if (!firstErrorField) {
        firstErrorField = "MaLoaiND";
        firstErrorMessage = "Vui lòng chọn loại bất động sản.";
      }
    }

    // 4. Giá
    if (!formData.Gia || parseFloat(formData.Gia) <= 0) {
      newInvalidFields.Gia = true;
      if (!firstErrorField) {
        firstErrorField = "Gia";
        firstErrorMessage =
          formData.TrangThai === "cho thuê"
            ? "Vui lòng nhập giá thuê hợp lệ."
            : "Vui lòng nhập giá bán hợp lệ.";
      }
    }

    // 5. Diện tích
    if (!formData.DienTich || parseFloat(formData.DienTich) <= 0) {
      newInvalidFields.DienTich = true;
      if (!firstErrorField) {
        firstErrorField = "DienTich";
        firstErrorMessage = "Vui lòng nhập diện tích hợp lệ.";
      }
    }

    // 6. Tỉnh/Thành phố
    if (!formData.MaTinh) {
      newInvalidFields.MaTinh = true;
      if (!firstErrorField) {
        firstErrorField = "MaTinh";
        firstErrorMessage = "Vui lòng chọn Tỉnh/Thành phố.";
      }
    }

    // 7. Quận/Huyện
    if (!formData.MaHuyen) {
      newInvalidFields.MaHuyen = true;
      if (!firstErrorField) {
        firstErrorField = "MaHuyen";
        firstErrorMessage = "Vui lòng chọn Quận/Huyện.";
      }
    }

    // 8. Phường/Xã
    if (!formData.MaXa) {
      newInvalidFields.MaXa = true;
      if (!firstErrorField) {
        firstErrorField = "MaXa";
        firstErrorMessage = "Vui lòng chọn Phường/Xã.";
      }
    }

    // 9. Địa chỉ chi tiết
    if (!formData.DiaChi || !formData.DiaChi.trim()) {
      newInvalidFields.DiaChi = true;
      if (!firstErrorField) {
        firstErrorField = "DiaChi";
        firstErrorMessage = "Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường...).";
      }
    }

    // 10. Tọa độ VN2000 (bắt buộc nếu là tin bán)
    const isRental = formData.TrangThai === "cho thuê";
    if (
      !isRental &&
      (!formData.ToaDoVN2000 ||
        !formData.ToaDoVN2000.coordinates ||
        formData.ToaDoVN2000.coordinates.length < 3)
    ) {
      newInvalidFields.ToaDoVN2000 = true;
      if (!firstErrorField) {
        firstErrorField = "ToaDoVN2000";
        firstErrorMessage =
          "Vui lòng nhập tối thiểu 3 điểm tọa độ VN2000 và bấm Tính toán & Chuyển đổi.";
      }
    }

    // 11. Hình ảnh (bắt buộc tối thiểu 1 ảnh BĐS nếu là bài đăng mới)
    if (
      !isEditing &&
      imageFiles.length === 0 &&
      (!formData.HinhAnh || formData.HinhAnh.length === 0)
    ) {
      newInvalidFields.HinhAnh = true;
      if (!firstErrorField) {
        firstErrorField = "HinhAnh";
        firstErrorMessage = "Vui lòng tải lên ít nhất 1 hình ảnh bất động sản.";
      }
    }

    if (firstErrorField) {
      setInvalidFields(newInvalidFields);
      setError(firstErrorMessage);
      setLoading(false);

      // Tự động cuộn mượt về phần đang thiếu thông tin và focus
      setTimeout(() => {
        const el = document.getElementById(`field-${firstErrorField}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          if (typeof el.focus === "function") {
            el.focus({ preventScroll: true });
          }
        }
      }, 50);
      return;
    }

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

  const priceSuggestions = getPriceSuggestions(formData.Gia);
  const numericPrice = parseFloat(formData.Gia) || 0;
  const depositSuggestions = getPriceSuggestions(formData.TienDatCoc);
  const numericDeposit = parseFloat(formData.TienDatCoc) || 0;

  // --- RENDER (SỬ DỤNG GIAO DIỆN CỦA BẠN - STASHED CHANGES) ---
  return (
    <div className="min-h-screen py-6 pt-24 bg-slate-50">
      <div className="container max-w-screen-xl px-4 mx-auto">
        {/* Toast thông báo lỗi bay từ trái qua, cố định trên màn hình (không cần lướt lên đầu) */}
        {error && (
          <div className="fixed top-24 left-4 sm:left-6 z-[70] max-w-md p-4 bg-white border-l-4 border-red-500 rounded-r-xl shadow-2xl animate-slideInLeft flex items-start gap-3 border border-gray-100">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600">
              <FaExclamationCircle className="text-lg" />
            </div>
            <div className="flex-1 pr-1">
              <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide">
                Thiếu thông tin hoặc có lỗi
              </h4>
              <p className="mt-0.5 text-xs font-medium text-gray-700 leading-relaxed">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <FaTimes size={13} />
            </button>
          </div>
        )}
        {success && (
          <div className="fixed top-24 left-4 sm:left-6 z-[70] max-w-md p-4 bg-white border-l-4 border-emerald-500 rounded-r-xl shadow-2xl animate-slideInLeft flex items-start gap-3 border border-gray-100">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold">
              ✓
            </div>
            <div className="flex-1 pr-1">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Thành công
              </h4>
              <p className="mt-0.5 text-xs font-medium text-gray-700 leading-relaxed">
                {isEditing ? "Cập nhật bài đăng thành công!" : "Đăng tin thành công!"}
              </p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <form noValidate onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CỘT TRÁI (7/12): Thông tin chi tiết, Nội dung & Media */}
              <div className="lg:col-span-7 space-y-4">
                {/* === PHÂN LOẠI NHU CẦU: BÁN HOẶC CHO THUÊ (PHONG CÁCH CHỢ TỐT) === */}
              <div
                className="p-5 transition-all duration-200 bg-white border shadow-sm border-gray-200/80 rounded-xl hover:shadow-md animate-fadeInUp"
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
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-lg w-full sm:w-auto border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleTransactionTypeChange("đang bán")}
                      className={`flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                        formData.TrangThai === "đang bán" || formData.TrangThai === "đã bán"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/70"
                      }`}
                    >
                      <span>🏷️</span> Cần bán
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTransactionTypeChange("cho thuê")}
                      className={`flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                        formData.TrangThai === "cho thuê" || formData.TrangThai === "đã cho thuê"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/70"
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
                      id="field-TieuDe"
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
                      className={`w-full px-3 py-2 text-xs font-medium text-gray-800 transition-all border rounded-lg focus:ring-2 focus:outline-none ${
                        invalidFields.TieuDe
                          ? "border-red-500 ring-2 ring-red-100 bg-red-50/20"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="field-MoTa"
                      name="MoTa"
                      value={formData.MoTa}
                      onChange={handleChange}
                      placeholder="Mô tả chi tiết về bất động sản..."
                      rows="4"
                      required
                      className={`w-full px-3 py-2 text-xs font-medium text-gray-800 transition-all border rounded-lg focus:ring-2 focus:outline-none ${
                        invalidFields.MoTa
                          ? "border-red-500 ring-2 ring-red-100 bg-red-50/20"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400"
                      }`}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="relative group">
                      <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                        Loại BĐS <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="field-MaLoaiND"
                        name="MaLoaiND"
                        value={formData.MaLoaiND}
                        onChange={handleChange}
                        required
                        className={`w-full px-3 py-2 pr-8 text-xs font-medium text-gray-800 transition-all bg-white border rounded-lg appearance-none focus:ring-2 focus:outline-none ${
                          invalidFields.MaLoaiND
                            ? "border-red-500 ring-2 ring-red-100 bg-red-50/20"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400"
                        }`}
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
                          className="w-full px-3 py-2 pr-8 text-xs font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none hover:border-gray-400"
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      {formData.TrangThai === "cho thuê" ? "Giá thuê (VNĐ/tháng)" : "Giá bán (VNĐ)"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-Gia"
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
                      className={`w-full px-3 py-2 text-xs font-medium text-gray-800 transition-all border rounded-lg focus:ring-2 focus:outline-none ${
                        invalidFields.Gia
                          ? "border-red-500 ring-2 ring-red-100 bg-red-50/20"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400"
                      }`}
                    />

                    {/* Gợi ý nhanh banking style hoặc Bằng chữ khi đã nhập số lớn */}
                    {priceSuggestions.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 animate-fadeIn">
                        <span className="text-[11px] font-medium text-gray-400">
                          Gợi ý:
                        </span>
                        {priceSuggestions.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                Gia: s.value.toString(),
                              }));
                              if (invalidFields.Gia) {
                                setInvalidFields((prev) => {
                                  const updated = { ...prev };
                                  delete updated.Gia;
                                  return updated;
                                });
                              }
                            }}
                            className="px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200/80 rounded transition-colors cursor-pointer"
                          >
                            {s.text}
                          </button>
                        ))}
                      </div>
                    ) : numericPrice >= 100000 ? (
                      <div className="flex items-center justify-between gap-1.5 mt-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200/70 rounded animate-fadeIn">
                        <div className="flex items-center gap-1 truncate">
                          <span className="font-bold text-emerald-600">✓</span>
                          <span>
                            Bằng chữ: <strong>{formatVNDWords(formData.Gia)}</strong>
                          </span>
                          <span className="font-normal text-gray-400">
                            ({Number(formData.Gia).toLocaleString("vi-VN")} đ)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, Gia: "" }))}
                          className="text-xs text-gray-400 transition-colors cursor-pointer hover:text-red-500 ml-1"
                          title="Xóa để nhập lại"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        Nhập số để nhận gợi ý nhanh (VD: 6 ra 6 triệu, 60 triệu, 6 tỷ...)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                      Diện tích (m²) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-DienTich"
                      type="number"
                      name="DienTich"
                      value={formData.DienTich}
                      onChange={handleChange}
                      placeholder="VD: 100"
                      min="0"
                      required
                      className={`w-full px-3 py-2 text-xs font-medium text-gray-800 transition-all border rounded-lg focus:ring-2 focus:outline-none ${
                        invalidFields.DienTich
                          ? "border-red-500 ring-2 ring-red-100 bg-red-50/20"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400"
                      }`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Tự động tính từ tọa độ VN2000 nếu nhập đầy đủ
                    </p>
                  </div>
                </div>

                {/* Phần thông tin bổ sung ĐẶC THÙ CHO THUÊ (Kiểu Chợ Tốt) */}
                {formData.TrangThai === "cho thuê" && (
                  <div className="pt-6 mt-6 border-t border-gray-200">
                    <h3 className="flex items-center gap-2 mb-4 text-base font-bold text-green-800">
                      <span>🔑</span> Chi tiết cho thuê (Chợ Tốt Style)
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
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
                          className="w-full px-3 py-2 text-xs font-medium text-gray-800 transition-all border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none hover:border-gray-400"
                        />
                        {/* Gợi ý cọc */}
                        {depositSuggestions.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 animate-fadeIn">
                            <span className="text-[11px] font-medium text-gray-400">
                              Gợi ý:
                            </span>
                            {depositSuggestions.map((s, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    TienDatCoc: s.value.toString(),
                                  }))
                                }
                                className="px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200/80 rounded transition-colors cursor-pointer"
                              >
                                {s.text}
                              </button>
                            ))}
                          </div>
                        ) : numericDeposit >= 100000 ? (
                          <div className="flex items-center justify-between gap-1.5 mt-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200/70 rounded animate-fadeIn">
                            <div className="flex items-center gap-1 truncate">
                              <span className="font-bold text-emerald-600">✓</span>
                              <span>
                                Bằng chữ: <strong>{formatVNDWords(formData.TienDatCoc)}</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, TienDatCoc: "" }))
                              }
                              className="text-xs text-gray-400 transition-colors cursor-pointer hover:text-red-500 ml-1"
                              title="Xóa để nhập lại"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                          Thời hạn hợp đồng thuê
                        </label>
                        <select
                          name="ThoiHanThue"
                          value={formData.ThoiHanThue}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-xs font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none hover:border-gray-400"
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
                          className="w-full px-3 py-2 text-xs font-medium text-gray-800 transition-all bg-white border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none hover:border-gray-400"
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
                          className="w-full px-3 py-2 text-xs font-medium text-gray-800 transition-all border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none hover:border-gray-400"
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

                <label className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-blue-600 transition-colors border-2 border-blue-200 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400">
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

                <div className="grid grid-cols-2 gap-3 mt-3 md:grid-cols-3 lg:grid-cols-4">
                  {documentImagePreview.length > 0 ? (
                    documentImagePreview.map((src, index) => (
                      <div
                        key={index}
                        onClick={() => setPreviewModalImage({ src, title: `Ảnh giấy tờ pháp lý #${index + 1}` })}
                        className="relative overflow-hidden transition-all bg-gray-100 border border-gray-200 rounded-lg group hover:border-blue-400 hover:shadow-md cursor-zoom-in"
                        title="Click để xem phóng to"
                      >
                        <img
                          src={src}
                          alt={`Giấy tờ ${index + 1}`}
                          className="object-cover w-full h-28 transition-transform duration-200 group-hover:scale-105"
                        />
                        {/* Overlay kính lúp khi hover */}
                        <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black/20 opacity-0 group-hover:opacity-100 pointer-events-none">
                          <span className="p-1.5 text-xs text-white bg-gray-900/80 rounded-full shadow">
                            🔍
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDocumentImage(index);
                          }}
                          className="absolute p-1.5 text-white transition-all bg-red-600 rounded-full opacity-0 top-1.5 right-1.5 hover:bg-red-700 group-hover:opacity-100 active:scale-95 shadow-sm"
                          title="Xóa ảnh này"
                        >
                          <FaTrash size={11} />
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
                id="field-HinhAnh"
                tabIndex="-1"
                className={`p-5 transition-all duration-200 bg-white border rounded-xl shadow-sm hover:shadow-md animate-fadeInUp ${
                  invalidFields.HinhAnh
                    ? "border-2 border-red-500 ring-4 ring-red-100"
                    : "border-gray-200/80"
                }`}
                style={{ animationDelay: "500ms" }}
              >
                <h2 className="flex items-center gap-2 mb-3 text-base font-bold text-gray-800">
                  <span className="text-lg">📷</span> Hình ảnh & Video BĐS
                </h2>
                <p className="mb-4 text-sm font-bold text-gray-600">
                  Tải ảnh chụp thực tế (Tối đa 10 ảnh, JPG/PNG, max 5MB/ảnh)
                </p>

                <label className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-blue-600 transition-colors border-2 border-blue-200 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400">
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

                <div className="grid grid-cols-2 gap-3 mt-3 md:grid-cols-3 lg:grid-cols-4">
                  {imagePreview.length > 0 ? (
                    imagePreview.map((src, index) => (
                      <div
                        key={index}
                        onClick={() => setPreviewModalImage({ src, title: `Ảnh thực tế BĐS #${index + 1}` })}
                        className="relative overflow-hidden transition-all bg-gray-100 border border-gray-200 rounded-lg group hover:border-blue-400 hover:shadow-md cursor-zoom-in"
                        title="Click để xem phóng to"
                      >
                        <img
                          src={src}
                          alt={`BĐS ${index + 1}`}
                          className="object-cover w-full h-28 transition-transform duration-200 group-hover:scale-105"
                        />
                        {/* Overlay kính lúp khi hover */}
                        <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black/20 opacity-0 group-hover:opacity-100 pointer-events-none">
                          <span className="p-1.5 text-xs text-white bg-gray-900/80 rounded-full shadow">
                            🔍
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute p-1.5 text-white transition-all bg-red-600 rounded-full opacity-0 top-1.5 right-1.5 hover:bg-red-700 group-hover:opacity-100 active:scale-95 shadow-sm"
                          title="Xóa ảnh này"
                        >
                          <FaTrash size={11} />
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
                    <label className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-gray-600 transition-colors border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-400">
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
                        className="flex items-center gap-1.5 px-3 py-1.5 mt-2.5 text-xs font-semibold text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 active:bg-red-800"
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
                  className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-white transition-colors rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm disabled:opacity-50"
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
                      id="field-MaTinh"
                      name="MaTinh"
                      value={formData.MaTinh}
                      onChange={handleChange}
                      required
                      disabled={loadingLocations}
                      className={`w-full px-3 py-2 pr-8 text-xs font-medium text-gray-800 transition-all bg-white border rounded-lg appearance-none focus:ring-2 focus:outline-none disabled:bg-gray-100 ${
                        invalidFields.MaTinh
                          ? "border-red-500 ring-2 ring-red-100 bg-red-50/20"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400"
                      }`}
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
                      id="field-MaHuyen"
                      name="MaHuyen"
                      value={formData.MaHuyen}
                      onChange={handleChange}
                      required
                      disabled={!formData.MaTinh || loadingLocations}
                      className={`w-full px-3 py-2 pr-8 text-xs font-medium text-gray-800 transition-all bg-white border rounded-lg appearance-none focus:ring-2 focus:outline-none disabled:bg-gray-100 ${
                        invalidFields.MaHuyen
                          ? "border-red-500 ring-2 ring-red-100 bg-red-50/20"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400"
                      }`}
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
                      id="field-MaXa"
                      name="MaXa"
                      value={formData.MaXa}
                      onChange={handleChange}
                      required
                      disabled={!formData.MaHuyen || loadingLocations}
                      className={`w-full px-3 py-2 pr-8 text-xs font-medium text-gray-800 transition-all bg-white border rounded-lg appearance-none focus:ring-2 focus:outline-none disabled:bg-gray-100 ${
                        invalidFields.MaXa
                          ? "border-red-500 ring-2 ring-red-100 bg-red-50/20"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400"
                      }`}
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
                    id="field-DiaChi"
                    type="text"
                    name="DiaChi"
                    value={formData.DiaChi}
                    onChange={handleChange}
                    placeholder="Số nhà, tên đường..."
                    required
                    className={`w-full px-3 py-2 text-xs font-medium text-gray-800 transition-all border rounded-lg focus:ring-2 focus:outline-none ${
                      invalidFields.DiaChi
                        ? "border-red-500 ring-2 ring-red-100 bg-red-50/20"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 hover:border-gray-400"
                    }`}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
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
                  id="field-ToaDoVN2000"
                  tabIndex="-1"
                  className={`bg-white border rounded-xl shadow-sm hover:shadow-md animate-fadeInUp overflow-hidden transition-all ${
                    invalidFields.ToaDoVN2000
                      ? "border-2 border-red-500 ring-4 ring-red-100"
                      : "border-gray-200/80"
                  }`}
                  style={{ animationDelay: "300ms" }}
                >
                  <CoordinateInput
                    value={formData.ToaDoVN2000?.coordinates || []}
                    onChange={handleCoordinateChange}
                    provinceName={selectedProvinceName}
                  />

                  {formData.ToaDoVN2000?.wgs84Coordinates &&
                    formData.ToaDoVN2000.wgs84Coordinates.length >= 3 && (
                      <div className="p-5 pt-0 animate-scaleIn">
                        <h4 className="mb-3 text-base font-bold text-gray-800">
                          Xem trước khung viền:
                        </h4>
                        <LeafletMapComponent
                          center={formData.ToaDoVN2000.wgs84Coordinates[0]}
                          zoom={18}
                          propertyBoundary={
                            formData.ToaDoVN2000.wgs84Coordinates
                          }
                          propertyArea={formData.ToaDoVN2000.area}
                          height="350px"
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

      {/* Modal xem trước và zoom ảnh (Giấy tờ pháp lý & Ảnh BĐS) */}
      {previewModalImage && (
        <ImagePreviewModal
          src={previewModalImage.src}
          title={previewModalImage.title}
          onClose={() => setPreviewModalImage(null)}
        />
      )}
    </div>
  );
};

export default PostForm;
