"use client"

import { useState, useEffect } from "react"
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa"
import axios from "axios"

const API_URL = "http://localhost:5000/api"

const PropertyTypeManager = () => {
  const [propertyTypes, setPropertyTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentType, setCurrentType] = useState(null)
  const [formData, setFormData] = useState({
    TenLoai: "",
    MoTa: "",
  })
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Lấy danh sách loại nhà đất
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_URL}/property-types`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setPropertyTypes(response.data)
      } catch (error) {
        console.error("Error fetching property types:", error)
        setError("Unable to load property types. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyTypes()
  }, [])

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Xử lý thêm mới
  const handleAdd = () => {
    setIsAdding(true)
    setIsEditing(false)
    setFormData({
      TenLoai: "",
      MoTa: "",
    })
  }

  // Xử lý chỉnh sửa
  const handleEdit = (type) => {
    setIsEditing(true)
    setIsAdding(false)
    setCurrentType(type)
    setFormData({
      TenLoai: type.TenLoai,
      MoTa: type.MoTa,
    })
  }

  // Xử lý hủy
  const handleCancel = () => {
    setIsAdding(false)
    setIsEditing(false)
    setCurrentType(null)
    setFormData({
      TenLoai: "",
      MoTa: "",
    })
  }

  // Xử lý lưu
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token")

      if (isAdding) {
        const response = await axios.post(`${API_URL}/property-types`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setPropertyTypes([...propertyTypes, response.data])
      } else if (isEditing && currentType) {
        const response = await axios.put(`${API_URL}/property-types/${currentType.MaLoai}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const updatedTypes = propertyTypes.map((type) =>
          type.MaLoai === currentType.MaLoai ? response.data : type,
        )
        setPropertyTypes(updatedTypes)
      }

      // Reset form
      handleCancel()
    } catch (error) {
      console.error("Error saving property type:", error)
      alert("An error occurred while saving. Please try again.")
    }
  }

  // Xử lý xóa
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${API_URL}/property-types/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const updatedTypes = propertyTypes.filter((type) => type.MaLoai !== id)
      setPropertyTypes(updatedTypes)
      setConfirmDelete(null)
    } catch (error) {
      console.error("Error deleting property type:", error)
      alert("An error occurred while deleting. Please try again.")
    }
  }

  if (loading) {
    return <div className="admin-loading">Đang tải dữ liệu...</div>
  }

  if (error) {
    return <div className="admin-error">{error}</div>
  }

  return (
    <div className="property-type-manager">
      <div className="manager-header">
        <button className="add-button" onClick={handleAdd} disabled={isAdding || isEditing}>
          <FaPlus /> Thêm loại nhà đất
        </button>
      </div>

      {(isAdding || isEditing) && (
        <div className="type-form">
          <h3>{isAdding ? "Thêm loại nhà đất mới" : "Chỉnh sửa loại nhà đất"}</h3>
          <div className="form-group">
            <label htmlFor="TenLoai">Tên loại nhà đất</label>
            <input
              type="text"
              id="TenLoai"
              name="TenLoai"
              value={formData.TenLoai}
              onChange={handleChange}
              placeholder="Nhập tên loại nhà đất"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="MoTa">Mô tả</label>
            <textarea
              id="MoTa"
              name="MoTa"
              value={formData.MoTa}
              onChange={handleChange}
              placeholder="Nhập mô tả"
              rows="3"
            ></textarea>
          </div>
          <div className="form-actions">
            <button className="admin-cancel-button" onClick={handleCancel}>
              <FaTimes /> Hủy
            </button>
            <button className="admin-save-button" onClick={handleSave}>
              <FaSave /> Lưu
            </button>
          </div>
        </div>
      )}

      <div className="type-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên loại</th>
              <th>Mô tả</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {propertyTypes.map((type) => (
              <tr key={type.MaLoai}>
                <td>{type.MaLoai}</td>
                <td>{type.TenLoai}</td>
                <td>{type.MoTa}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="admin-edit-button"
                      onClick={() => handleEdit(type)}
                      disabled={isAdding || isEditing}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="admin-delete-button"
                      onClick={() => setConfirmDelete(type.MaLoai)}
                      disabled={isAdding || isEditing}
                    >
                      <FaTrash />
                    </button>

                    {confirmDelete === type.MaLoai && (
                      <div className="delete-confirm">
                        <p>Xác nhận xóa?</p>
                        <div>
                          <button className="confirm-yes" onClick={() => handleDelete(type.MaLoai)}>
                            Có
                          </button>
                          <button className="confirm-no" onClick={() => setConfirmDelete(null)}>
                            Không
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PropertyTypeManager
