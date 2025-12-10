import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaCrown,
  FaCheckCircle,
  FaQrcode,
  FaCopy,
  FaSync,
  FaCalendarAlt,
  FaArrowRight,
  FaShieldAlt,
  FaBolt,
  FaCheck,
} from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const FeaturedPostModal = ({ isOpen, onClose, property, onSuccess }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("7_DAYS");
  const [loading, setLoading] = useState(false);
  const [registerData, setRegisterData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Lấy danh sách gói
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setRegisterData(null);
      setPaymentSuccess(false);

      axios
        .get(`${API_URL}/featured-posts/plans`)
        .then((res) => {
          if (res.data.success) {
            setPlans(res.data.data);
          }
        })
        .catch((err) => {
          console.error("Lỗi tải gói:", err);
          // Fallback mặc định
          setPlans([
            { planId: "3_DAYS", name: "Gói 3 ngày", days: 3, price: 30000, description: "Hiển thị ưu tiên 3 ngày" },
            { planId: "7_DAYS", name: "Gói 7 ngày", days: 7, price: 60000, description: "Hiển thị ưu tiên 7 ngày (Khuyên dùng)" },
            { planId: "30_DAYS", name: "Gói 30 ngày", days: 30, price: 200000, description: "Hiển thị trọn vẹn 30 ngày (Tiết kiệm nhất)" },
          ]);
        });
    }
  }, [isOpen]);

  // Polling tự động khi đã tạo mã QR
  useEffect(() => {
    let timer = null;
    if (registerData?.registrationId && !paymentSuccess) {
      timer = setInterval(async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(
            `${API_URL}/featured-posts/check-status/${registerData.registrationId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data.success && res.data.data.isPaid) {
            setPaymentSuccess(true);
            clearInterval(timer);
            if (onSuccess) onSuccess();
          }
        } catch (e) {
          console.error("Lỗi polling status:", e);
        }
      }, 3000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [registerData, paymentSuccess, onSuccess]);

  if (!isOpen || !property) return null;

  // Bước 2 -> 3: Tạo đơn đăng ký và lấy mã QR
  const handleRegister = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/featured-posts/register`,
        {
          propertyId: property.MaTTND,
          planId: selectedPlanId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setRegisterData(res.data.data);
      } else {
        setErrorMsg(res.data.message || "Không thể tạo đơn đăng ký");
      }
    } catch (err) {
      console.error("Lỗi tạo đơn:", err);
      setErrorMsg(err.response?.data?.message || "Đã xảy ra lỗi khi tạo mã thanh toán");
    } finally {
      setLoading(false);
    }
  };

  // Nút bấm "Tôi đã hoàn tất chuyển khoản" (Thủ công / Test Mode)
  const handleConfirmManual = async () => {
    if (!registerData?.registrationId) return;
    setVerifying(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/featured-posts/confirm-manual`,
        { registrationId: registerData.registrationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setPaymentSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.data.message || "Xác nhận không thành công");
      }
    } catch (err) {
      console.error("Lỗi xác nhận:", err);
      setErrorMsg(err.response?.data?.message || "Lỗi kiểm tra giao dịch");
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner text-amber-200 text-lg">
              <FaCrown />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Đăng ký tin nổi bật ⭐
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Tối ưu khả năng tiếp cận khách hàng tiềm năng gấp 5 lần
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Nội dung thân Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Tóm tắt tin đăng */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
              <img
                src={
                  property.HinhAnh && property.HinhAnh.length > 0
                    ? `http://localhost:5000${property.HinhAnh[0]}`
                    : "/placeholder.svg?height=100&width=100"
                }
                alt={property.TieuDe}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=100&width=100";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                Bất động sản được chọn
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {property.TieuDe}
              </h4>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                Mã tin: #{property.MaTTND} • Giá: {Number(property.Gia || 0).toLocaleString("vi-VN")} đ
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* TRƯỜNG HỢP: ĐÃ THANH TOÁN THÀNH CÔNG */}
          {paymentSuccess ? (
            <div className="py-8 text-center space-y-4 animate-scaleUp">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                <FaCheck />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800">
                  Kích hoạt tin nổi bật thành công!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Tin đăng của bạn đã được gắn nhãn <span className="font-bold text-amber-600">⭐ Tin nổi bật</span> và ưu tiên hiển thị ngay trên đầu Trang chủ và Kết quả tìm kiếm.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onSuccess) onSuccess();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Đã hiểu, quay lại quản lý
              </button>
            </div>
          ) : !registerData ? (
            /* BƯỚC 2: CHỌN GÓI DỊCH VỤ */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <FaCalendarAlt className="text-amber-500" />
                  Bước 1: Lựa chọn gói tin nổi bật
                </h4>
                <span className="text-xs font-medium text-slate-400">Ưu tiên vị trí hiển thị</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.planId;
                  return (
                    <div
                      key={p.planId}
                      onClick={() => setSelectedPlanId(p.planId)}
                      className={`relative cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/50 shadow-md scale-[1.02]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      {p.planId === "7_DAYS" && (
                        <div className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                          Phổ biến
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">{p.name}</span>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-amber-500 bg-amber-500" : "border-slate-300"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                        <div className="mt-3 text-lg font-black text-amber-600">
                          {Number(p.price).toLocaleString("vi-VN")} đ
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          Thời hạn: {p.days} ngày
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[10px] text-slate-500 leading-relaxed">
                        {p.description || "Ưu tiên trang chủ & tìm kiếm"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quyền lợi hiển thị */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <FaBolt className="text-amber-600" />
                  Quyền lợi đặc biệt của tin nổi bật:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-800 font-medium">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-amber-600 flex-shrink-0" />
                    <span>Gắn huy hiệu <strong>⭐ Tin nổi bật</strong> độc quyền</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-amber-600 flex-shrink-0" />
                    <span>Ưu tiên xuất hiện đầu Trang chủ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-amber-600 flex-shrink-0" />
                    <span>Xếp trước các tin thường ở Kết quả tìm kiếm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-amber-600 flex-shrink-0" />
                    <span>Tăng tỷ lệ khách liên hệ và chốt đơn</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? (
                    <FaSync className="animate-spin text-sm" />
                  ) : (
                    <>
                      <span>Tiếp tục thanh toán</span>
                      <FaArrowRight className="text-xs" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* BƯỚC 3: QUÉT MÃ VIETQR HOẶC XÁC NHẬN CHUYỂN KHOẢN */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <FaQrcode className="text-blue-600" />
                  Bước 2: Quét mã VietQR chuyển khoản tự động
                </h4>
                <button
                  onClick={() => setRegisterData(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ← Đổi gói khác
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                {/* Ảnh QR */}
                <div className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                    <img
                      src={registerData.paymentInfo.qrCodeUrl}
                      alt="VietQR Chuyển Khoản"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <FaSync className="animate-spin text-blue-500" />
                    <span>Hệ thống đang chờ nhận tiền tự động...</span>
                  </div>
                </div>

                {/* Thông tin số tài khoản */}
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                    <div className="text-[11px] font-medium text-slate-500">Ngân hàng nhận</div>
                    <div className="font-bold text-slate-800 text-sm">
                      {registerData.paymentInfo.bankId}
                    </div>

                    <div className="text-[11px] font-medium text-slate-500 pt-1">Số tài khoản</div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-slate-900 text-sm tracking-wide">
                        {registerData.paymentInfo.accountNo}
                      </span>
                      <button
                        onClick={() => copyToClipboard(registerData.paymentInfo.accountNo)}
                        className="text-blue-600 hover:text-blue-800 p-1 font-bold text-[11px] flex items-center gap-1"
                      >
                        <FaCopy /> {isCopied ? "Đã chép" : "Sao chép"}
                      </button>
                    </div>

                    <div className="text-[11px] font-medium text-slate-500 pt-1">Tên chủ tài khoản</div>
                    <div className="font-bold text-slate-800 uppercase">
                      {registerData.paymentInfo.accountName}
                    </div>

                    <div className="text-[11px] font-medium text-slate-500 pt-1">Số tiền thanh toán</div>
                    <div className="font-black text-amber-600 text-base">
                      {Number(registerData.paymentInfo.amount).toLocaleString("vi-VN")} VNĐ
                    </div>

                    <div className="text-[11px] font-medium text-slate-500 pt-1">Nội dung chuyển khoản chuẩn</div>
                    <div className="flex items-center justify-between bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <span className="font-mono font-black text-amber-800 text-sm tracking-widest">
                        {registerData.paymentInfo.transferContent}
                      </span>
                      <button
                        onClick={() => copyToClipboard(registerData.paymentInfo.transferContent)}
                        className="text-amber-700 hover:text-amber-900 font-bold text-[11px] flex items-center gap-1"
                      >
                        <FaCopy /> Sao chép
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    * Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống kích hoạt tin nổi bật tự động trong 5 giây.
                  </p>

                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={handleConfirmManual}
                      disabled={verifying}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      {verifying ? (
                        <>
                          <FaSync className="animate-spin" />
                          <span>Đang kiểm tra...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle />
                          <span>Tôi đã chuyển khoản xong</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedPostModal;
