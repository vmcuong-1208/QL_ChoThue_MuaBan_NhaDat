"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaStar,
  FaRegStar,
  FaCheckCircle,
  FaExclamationCircle,
  FaPaperPlane,
  FaUser,
  FaInfoCircle,
  FaCommentDots,
} from "react-icons/fa";
import { API_URL, SERVER_URL } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const STAR_LABELS = {
  1: "★☆☆☆☆ Rất không hài lòng",
  2: "★★☆☆☆ Chưa hài lòng",
  3: "★★★☆☆ Bình thường",
  4: "★★★★☆ Hài lòng / Tư vấn nhanh chóng",
  5: "★★★★★ Rất hài lòng / Hỗ trợ nhiệt tình",
};

const QUICK_TAGS = [
  "Môi giới tư vấn nhiệt tình",
  "Cung cấp thông tin chính xác",
  "Hỗ trợ xem nhà nhanh chóng",
  "Thái độ phục vụ rất tốt",
  "Pháp lý minh bạch, an toàn",
  "Đàm phán giá tốt",
];

const ReviewModal = ({
  isOpen,
  onClose,
  broker,
  onSuccess,
  onOpenContactModal,
}) => {
  const { currentUser } = useAuth();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("Rất hài lòng");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [eligibility, setEligibility] = useState({
    canReview: false,
    reason: "",
    hasContacted: false,
    existingReview: null,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Kiểm tra điều kiện đánh giá khi modal mở
  useEffect(() => {
    if (!isOpen || !broker) return;

    setErrorMsg("");
    setSuccessMsg("");

    if (!currentUser) {
      setEligibility({
        canReview: false,
        reason: "Vui lòng đăng nhập tài khoản để gửi đánh giá chất lượng dịch vụ của nhà môi giới.",
        hasContacted: false,
        existingReview: null,
      });
      setChecking(false);
      return;
    }

    const check = async () => {
      try {
        setChecking(true);
        const res = await axios.get(
          `${API_URL}/broker-reviews/${broker.MaNgDung}/eligibility`,
          { headers: getAuthHeaders() }
        );
        const data = res.data;
        setEligibility(data);

        // Nếu đã từng đánh giá trước đó, điền sẵn thông tin cũ
        if (data.existingReview) {
          setRating(data.existingReview.SoSao || 5);
          setComment(data.existingReview.NoiDung || "");
          setTitle(data.existingReview.TieuDe || "Rất hài lòng");
        } else {
          setRating(5);
          setComment("");
          setTitle("Rất hài lòng");
        }
      } catch (err) {
        console.warn("Lỗi kiểm tra điều kiện đánh giá:", err.message);
        setEligibility({
          canReview: false,
          reason: err.response?.data?.message || "Không thể kiểm tra điều kiện đánh giá.",
          hasContacted: false,
          existingReview: null,
        });
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [isOpen, broker, currentUser]);

  if (!isOpen || !broker) return null;

  const brokerName = broker.HoTen || broker.TenDangNhap || broker.Email || "Nhà môi giới";
  const avatarUrl = broker.Avatar || broker.AnhDaiDien;

  const handleSelectStar = (s) => {
    setRating(s);
    if (s === 5) setTitle("Rất hài lòng");
    else if (s === 4) setTitle("Hài lòng");
    else if (s === 3) setTitle("Bình thường");
    else if (s === 2) setTitle("Chưa hài lòng");
    else setTitle("Không hài lòng");
  };

  const handleAddTag = (tag) => {
    if (!comment.includes(tag)) {
      setComment((prev) => (prev ? `${prev}. ${tag}` : tag));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setErrorMsg("Vui lòng chọn số sao đánh giá (1 - 5 sao)!");
      return;
    }
    if (!comment.trim()) {
      setErrorMsg("Vui lòng nhập nhận xét của bạn về nhà môi giới!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await axios.post(
        `${API_URL}/broker-reviews`,
        {
          MaMoiGioi: broker.MaNgDung,
          SoSao: rating,
          NoiDung: comment.trim(),
          TieuDe: title,
        },
        { headers: getAuthHeaders() }
      );

      setSuccessMsg(res.data?.message || "Gửi đánh giá thành công!");
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Lỗi khi gửi đánh giá. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans text-slate-800">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {eligibility.existingReview ? "Cập nhật đánh giá môi giới" : "Đánh giá chất lượng môi giới"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chia sẻ trải nghiệm tư vấn thực tế giúp xây dựng cộng đồng minh bạch
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm"
          >
            <FaTimes />
          </button>
        </div>

        {/* Thông tin Môi giới tóm tắt */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl.startsWith("http") ? avatarUrl : `${SERVER_URL}${avatarUrl}`}
              alt={brokerName}
              className="w-12 h-12 rounded-full object-cover border border-slate-200"
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=48&width=48";
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
              {brokerName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <span className="truncate">{brokerName}</span>
              {broker.TrangThaiXacMinhMoiGioi === "VERIFIED" && (
                <FaCheckCircle className="text-emerald-600 text-xs flex-shrink-0" title="Đã xác minh" />
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Chuyên viên tư vấn &amp; môi giới bất động sản
            </div>
          </div>
        </div>

        {/* Trạng thái Loading hoặc Kiểm tra điều kiện */}
        {checking ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang kiểm tra điều kiện đánh giá...
          </div>
        ) : !eligibility.canReview ? (
          /* Khách hàng không đủ điều kiện (chưa từng liên hệ hoặc tự đánh giá mình) */
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3">
            <div className="flex items-start gap-2">
              <FaInfoCircle className="text-amber-600 text-base flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Quy định đánh giá minh bạch</div>
                <div className="mt-1 leading-relaxed">{eligibility.reason}</div>
              </div>
            </div>

            {!currentUser ? (
              <a
                href="/auth"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors"
              >
                Đăng nhập để đánh giá
              </a>
            ) : !eligibility.hasContacted ? (
              <div className="pt-2 border-t border-amber-200 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenContactModal) onOpenContactModal();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <FaPaperPlane className="text-[10px]" />
                  <span>Gửi yêu cầu liên hệ ngay</span>
                </button>
                <span className="text-[11px] text-amber-800">
                  (Sau khi gửi, bạn sẽ được quyền đánh giá)
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          /* Form Đánh Giá Đầy Đủ */
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Chọn số sao tương tác */}
            <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="text-xs font-semibold text-slate-600 mb-1.5">
                Mức độ hài lòng của bạn về môi giới:
              </div>

              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleSelectStar(star)}
                      className="text-2xl transition-transform hover:scale-125 focus:outline-none"
                    >
                      {isFilled ? (
                        <FaStar className="text-amber-400 drop-shadow-xs" />
                      ) : (
                        <FaRegStar className="text-slate-300" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs font-bold text-amber-600 mt-2 h-4">
                {STAR_LABELS[hoverRating || rating]}
              </div>
            </div>

            {/* Gợi ý nhận xét nhanh */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5">
                Gợi ý nhận xét nhanh:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleAddTag(tag)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Ô nhập nhận xét chi tiết */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nội dung nhận xét chi tiết *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Ví dụ: Môi giới tư vấn nhiệt tình, cung cấp thông tin chính xác và hỗ trợ xem nhà nhanh chóng..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Thông báo lỗi / thành công */}
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                <FaExclamationCircle className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5 animate-fadeIn">
                <FaCheckCircle className="flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || Boolean(successMsg)}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs inline-flex items-center gap-1.5"
              >
                <FaStar className="text-[10px]" />
                <span>
                  {loading
                    ? "Đang gửi..."
                    : eligibility.existingReview
                    ? "Cập nhật đánh giá"
                    : "Gửi đánh giá"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
