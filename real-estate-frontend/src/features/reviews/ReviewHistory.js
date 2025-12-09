"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaStar,
  FaRegStar,
  FaEdit,
  FaTrash,
  FaUserTie,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaComments,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { API_URL, SERVER_URL } from "../../services/api";

const ReviewHistory = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal edit state
  const [editingReview, setEditingReview] = useState(null);
  const [editStars, setEditStars] = useState(5);
  const [editHoverStars, setEditHoverStars] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Modal delete state
  const [deletingId, setDeletingId] = useState(null);

  const fetchMyReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/broker-reviews/user/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setReviews(response.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi lấy lịch sử đánh giá:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  // Open Edit Modal
  const handleOpenEdit = (review) => {
    setEditingReview(review);
    setEditStars(review.SoSao || 5);
    setEditComment(review.NoiDung || "");
    setEditTitle(review.TieuDe || "");
  };

  // Submit Edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editComment.trim()) {
      toast.warning("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    try {
      setSubmittingEdit(true);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_URL}/broker-reviews`,
        {
          MaMoiGioi: editingReview.MaMoiGioi,
          SoSao: editStars,
          NoiDung: editComment.trim(),
          TieuDe: editTitle.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data?.message || "Cập nhật đánh giá thành công!");
      setEditingReview(null);
      fetchMyReviews();
    } catch (err) {
      console.error("Lỗi cập nhật đánh giá:", err);
      toast.error(err.response?.data?.message || "Không thể cập nhật đánh giá!");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete review
  const handleDeleteReview = async () => {
    if (!deletingId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/broker-reviews/${deletingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Đã xóa đánh giá thành công!");
      setDeletingId(null);
      setReviews((prev) => prev.filter((r) => r.MaDG !== deletingId));
    } catch (err) {
      console.error("Lỗi xóa đánh giá:", err);
      toast.error(err.response?.data?.message || "Không thể xóa đánh giá!");
    }
  };

  const renderAvatar = (avatar) => {
    if (!avatar) return "/placeholder.svg?height=80&width=80";
    if (avatar.startsWith("http")) return avatar;
    return `${SERVER_URL}${avatar}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Breadcrumb */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl font-bold">
                  ⭐
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                    Lịch sử đánh giá môi giới
                  </h1>
                  <p className="text-sm md:text-base text-slate-500 mt-1">
                    Xem lại, chỉnh sửa hoặc quản lý các nhận xét & đánh giá bạn đã gửi cho các chuyên viên môi giới
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Tổng cộng: {reviews.length} đánh giá
              </span>
            </div>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-semibold text-slate-500">Đang tải lịch sử đánh giá...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            <FaExclamationTriangle className="mx-auto text-3xl mb-2 text-red-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchMyReviews}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
              ✍️
            </div>
            <h3 className="text-lg font-bold text-slate-800">Bạn chưa gửi đánh giá nào</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
              Sau khi liên hệ tư vấn hoặc giao dịch bất động sản thành công, bạn có thể gửi đánh giá cho các môi giới để giúp cộng đồng có thêm thông tin tham khảo.
            </p>
            <Link
              to="/tim-kiem"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
            >
              Khám phá tin bất động sản
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((item) => (
              <div
                key={item.MaDG}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Broker info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={renderAvatar(item.AvatarMoiGioi)}
                      alt={item.TenMoiGioi || "Môi giới"}
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${item.MaMoiGioi}`}
                          className="font-bold text-lg text-slate-900 hover:text-blue-600 transition flex items-center gap-1.5"
                        >
                          {item.TenMoiGioi || "Môi giới BĐS"}
                          <FaExternalLinkAlt size={12} className="text-slate-400" />
                        </Link>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Môi giới
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {item.SDTMoiGioi && (
                          <span className="flex items-center gap-1">
                            <FaPhoneAlt className="text-slate-400" size={11} />
                            {item.SDTMoiGioi}
                          </span>
                        )}
                        {item.EmailMoiGioi && (
                          <span className="flex items-center gap-1">
                            <FaEnvelope className="text-slate-400" size={11} />
                            {item.EmailMoiGioi}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      title="Chỉnh sửa đánh giá"
                    >
                      <FaEdit size={13} />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => setDeletingId(item.MaDG)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                      title="Xóa đánh giá"
                    >
                      <FaTrash size={13} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* Rating & Content */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          size={18}
                          className={star <= item.SoSao ? "text-amber-400" : "text-slate-200"}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-700">
                      {item.SoSao}/5 sao
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <FaClock size={11} /> {formatDate(item.NgayTao)}
                      {item.NgayCapNhat && item.NgayCapNhat !== item.NgayTao && (
                        <span className="italic text-slate-400">(đã chỉnh sửa)</span>
                      )}
                    </span>
                  </div>

                  {item.TieuDe && (
                    <h4 className="font-bold text-base text-slate-900 mb-1.5">
                      {item.TieuDe}
                    </h4>
                  )}

                  <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    "{item.NoiDung}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL EDIT REVIEW */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <div className="flex items-center gap-2 font-bold text-lg">
                <FaEdit />
                <span>Chỉnh sửa đánh giá</span>
              </div>
              <button
                onClick={() => setEditingReview(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  Đánh giá cho môi giới:{" "}
                  <strong className="text-slate-900">{editingReview.TenMoiGioi}</strong>
                </p>

                {/* Rating stars */}
                <div className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                  <span className="text-sm font-semibold text-slate-700 mr-2">Chọn số sao:</span>
                  <div className="flex items-center gap-1 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setEditStars(star)}
                        onMouseEnter={() => setEditHoverStars(star)}
                        onMouseLeave={() => setEditHoverStars(0)}
                        className="text-2xl focus:outline-none transition transform hover:scale-125"
                      >
                        <FaStar
                          className={
                            star <= (editHoverStars || editStars)
                              ? "text-amber-400"
                              : "text-slate-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-amber-700 ml-2">
                    {editStars} sao
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tiêu đề (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ví dụ: Rất hài lòng, Tư vấn tận tâm..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Comment Content */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nội dung nhận xét <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về thái độ phục vụ, mức độ hỗ trợ của môi giới..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {submittingEdit ? "Đang lưu..." : "Cập nhật đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200 animate-scaleUp">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
              <FaTrash />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa đánh giá?</h3>
            <p className="text-sm text-slate-500 mt-2">
              Hành động này sẽ xóa vĩnh viễn nhận xét đánh giá của bạn cho môi giới này. Bạn có chắc chắn không?
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-md"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewHistory;
