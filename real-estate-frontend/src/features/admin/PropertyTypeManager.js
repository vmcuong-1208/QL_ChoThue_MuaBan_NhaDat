"use client";

import { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaHome,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import axios from "axios";
import { API_URL } from "../../services/api";

const PropertyTypeManager = () => {
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    TenLoai: "",
    MoTa: "",
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch property types
  useEffect(() => {
    fetchPropertyTypes();
  }, []);

  // Filter property types based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = propertyTypes.filter(
        (type) =>
          type.TenLoai.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.MoTa?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTypes(filtered);
    } else {
      setFilteredTypes(propertyTypes);
    }
  }, [searchTerm, propertyTypes]);

  const fetchPropertyTypes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/property-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPropertyTypes(response.data);
      setFilteredTypes(response.data);
    } catch (error) {
      console.error("Error fetching property types:", error);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(false);
    setFormData({
      TenLoai: "",
      MoTa: "",
    });
  };

  const handleEdit = (type) => {
    setIsEditing(true);
    setIsAdding(false);
    setCurrentType(type);
    setFormData({
      TenLoai: type.TenLoai,
      MoTa: type.MoTa,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setCurrentType(null);
    setFormData({
      TenLoai: "",
      MoTa: "",
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      if (isAdding) {
        const response = await axios.post(
          `${API_URL}/property-types`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPropertyTypes([...propertyTypes, response.data]);
      } else if (isEditing && currentType) {
        const response = await axios.put(
          `${API_URL}/property-types/${currentType.MaLoai}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const updatedTypes = propertyTypes.map((type) =>
          type.MaLoai === currentType.MaLoai ? response.data : type
        );
        setPropertyTypes(updatedTypes);
      }

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      handleCancel();
    } catch (error) {
      console.error("Error saving property type:", error);
      alert("Có lỗi xảy ra khi lưu. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/property-types/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedTypes = propertyTypes.filter((type) => type.MaLoai !== id);
      setPropertyTypes(updatedTypes);
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting property type:", error);
      alert("Có lỗi xảy ra khi xóa. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-fadeIn">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-semibold text-gray-700">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 animate-fadeIn">
        <div className="flex items-start gap-3 p-6 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg max-w-md">
          <FaExclamationTriangle className="text-2xl text-red-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-red-700 mb-1">
              Có lỗi xảy ra
            </h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 bg-green-500 text-white rounded-lg shadow-2xl animate-slideInRight">
          <FaCheckCircle className="text-2xl" />
          <div>
            <p className="font-bold">Thành công!</p>
            <p className="text-sm">Đã lưu thay đổi</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fadeInUp">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <FaHome className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Quản lý loại nhà đất
            </h2>
            <p className="text-sm text-gray-500">
              Tổng cộng:{" "}
              <span className="font-bold text-blue-600">
                {propertyTypes.length}
              </span>{" "}
              loại
            </p>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={isAdding || isEditing}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <FaPlus />
          <span>Thêm loại mới</span>
        </button>
      </div>

      {/* Form Section */}
      {(isAdding || isEditing) && (
        <div className="overflow-hidden bg-white border-2 border-blue-200 rounded-2xl shadow-xl animate-scaleIn">
          {/* Form Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {isAdding ? (
                <>
                  <FaPlus /> Thêm loại nhà đất mới
                </>
              ) : (
                <>
                  <FaEdit /> Chỉnh sửa loại nhà đất
                </>
              )}
            </h3>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="TenLoai"
                className="block text-sm font-bold text-gray-700"
              >
                Tên loại nhà đất <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="TenLoai"
                name="TenLoai"
                value={formData.TenLoai}
                onChange={handleChange}
                placeholder="Ví dụ: Căn hộ chung cư, Nhà riêng..."
                className="w-full px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-300 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-blue-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="MoTa"
                className="block text-sm font-bold text-gray-700"
              >
                Mô tả
              </label>
              <textarea
                id="MoTa"
                name="MoTa"
                value={formData.MoTa}
                onChange={handleChange}
                placeholder="Nhập mô tả chi tiết về loại nhà đất này..."
                rows="4"
                className="w-full px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-300 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-blue-400 resize-none"
              ></textarea>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95"
              >
                <FaTimes />
                <span>Hủy</span>
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <FaSave />
                <span>Lưu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Section */}
      <div
        className="flex flex-col gap-3 md:flex-row md:items-center animate-fadeInUp"
        style={{ animationDelay: "100ms" }}
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 text-sm font-medium text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none hover:border-blue-400"
          />
        </div>

        <button className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl hover:border-blue-400 hover:scale-105 active:scale-95">
          <FaFilter />
          <span>Bộ lọc</span>
        </button>
      </div>

      {/* Table Section */}
      <div
        className="overflow-hidden bg-white rounded-2xl shadow-xl animate-fadeInUp"
        style={{ animationDelay: "200ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-200">
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-700 uppercase">
                  ID
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-700 uppercase">
                  Tên loại
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-700 uppercase">
                  Mô tả
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTypes.length > 0 ? (
                filteredTypes.map((type, index) => (
                  <tr
                    key={type.MaLoai}
                    className="transition-all duration-300 hover:bg-blue-50 animate-fadeInUp"
                    style={{ animationDelay: `${(index + 3) * 50}ms` }}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">
                      #{type.MaLoai}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                          <FaHome className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          {type.TenLoai}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      <p className="line-clamp-2">
                        {type.MoTa || "Chưa có mô tả"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(type)}
                          disabled={isAdding || isEditing}
                          className="flex items-center justify-center w-9 h-9 text-blue-600 transition-all duration-300 bg-blue-100 rounded-lg hover:bg-blue-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          title="Chỉnh sửa"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(type.MaLoai)}
                          disabled={isAdding || isEditing}
                          className="flex items-center justify-center w-9 h-9 text-red-600 transition-all duration-300 bg-red-100 rounded-lg hover:bg-red-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                        <FaSearch className="text-2xl text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">
                        Không tìm thấy kết quả nào
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn">
          <div className="w-full max-w-md p-6 mx-4 bg-white rounded-2xl shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-red-100 rounded-full">
                <FaExclamationTriangle className="text-xl text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Xác nhận xóa
                </h3>
                <p className="text-sm text-gray-600">
                  Bạn có chắc chắn muốn xóa loại nhà đất này?
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 rounded-xl hover:bg-gray-200 hover:scale-105 active:scale-95"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-6 py-3 text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-red-600 to-red-500 rounded-xl hover:shadow-lg hover:scale-105 active:scale-95"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyTypeManager;
