"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  FaTimes,
  FaShieldAlt,
  FaQrcode,
  FaCopy,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaLock,
  FaRegCheckCircle,
  FaInfoCircle,
  FaCheck,
  FaUniversity,
} from "react-icons/fa";
import api from "../../services/api";

const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  amount = 299000,
  description = "Nâng cấp tài khoản môi giới",
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [vietQrData, setVietQrData] = useState(null);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [copied, setCopied] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("vietqr"); // Mặc định VietQR / SePay ngân hàng
  const [confirmingManual, setConfirmingManual] = useState(false);

  // Reset state khi modal đóng/mở
  useEffect(() => {
    if (!isOpen) {
      setPaymentData(null);
      setVietQrData(null);
      setError("");
      setShowQR(false);
      setLoading(false);
      setIsPolling(false);
      setCopied("");
      setConfirmingManual(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } else {
      // Khi mở modal, lấy sẵn thông tin VietQR ngân hàng (SePay)
      fetchVietQrInfo();
    }
  }, [isOpen]);

  // Lấy thông tin VietQR từ backend
  const fetchVietQrInfo = async () => {
    try {
      const response = await api.get("/sepay/payment-info");
      if (response.data?.success) {
        setVietQrData(response.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin VietQR:", err);
    }
  };

  // Kiểm tra thanh toán SePay / VietQR
  const checkSepayStatus = async () => {
    try {
      const response = await api.get("/sepay/check-status");
      if (response.data?.isPaid) {
        setIsPolling(false);
        if (pollingInterval) clearInterval(pollingInterval);
        alert("Thanh toán thành công qua Ngân hàng! Hồ sơ của bạn đã được chuyển sang trạng thái Chờ xét duyệt.");
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Lỗi kiểm tra SePay:", err);
    }
  };

  // Kiểm tra thanh toán MoMo
  const checkMoMoStatus = async (orderId) => {
    try {
      const response = await api.get(`/momo-payment/check-status/${orderId}`);
      const data = response.data;

      if (data.success && data.transaction.status === "SUCCESS") {
        setIsPolling(false);
        if (pollingInterval) clearInterval(pollingInterval);
        alert("Thanh toán thành công qua MoMo! Hồ sơ của bạn đã được chuyển sang trạng thái Chờ xét duyệt.");
        onSuccess && onSuccess();
        onClose();
      } else if (data.transaction.status === "FAILED") {
        setIsPolling(false);
        if (pollingInterval) clearInterval(pollingInterval);
        alert("Giao dịch thanh toán chưa thành công hoặc đã bị hủy.");
      }
    } catch (error) {
      console.error("Lỗi kiểm tra MoMo:", error);
    }
  };

  // Khởi động kiểm tra tự động (Polling mỗi 3 giây)
  const startPolling = (method, orderId = null) => {
    setIsPolling(true);
    const interval = setInterval(() => {
      if (method === "vietqr") {
        checkSepayStatus();
      } else if (method === "momo" && orderId) {
        checkMoMoStatus(orderId);
      }
    }, 3000);

    setPollingInterval(interval);

    // Dừng polling sau 5 phút
    setTimeout(() => {
      setIsPolling(false);
      clearInterval(interval);
    }, 300000);
  };

  // Tiếp tục với phương thức được chọn
  const handleProceedPayment = async () => {
    setError("");

    if (selectedMethod === "vietqr") {
      // Hiển thị mã QR ngân hàng VietQR SePay
      setShowQR(true);
      startPolling("vietqr");
    } else if (selectedMethod === "momo") {
      // Gọi MoMo sandbox
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Vui lòng đăng nhập để thực hiện thanh toán");

        const response = await api.post("/momo-payment/create-payment", {
          amount: amount,
          orderInfo: description,
          extraData: JSON.stringify({
            service: "upgrade_account",
            userId: JSON.parse(atob(token.split(".")[1])).userId,
          }),
        });

        const data = response.data;
        if (data.success && data.payUrl) {
          setPaymentData(data);
          setShowQR(true);
          startPolling("momo", data.orderId);
        } else {
          throw new Error(data.message || "Không thể tạo liên kết MoMo");
        }
      } catch (err) {
        console.error("Lỗi MoMo:", err);
        setError(err.message || "Không thể khởi tạo thanh toán MoMo.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Nút người dùng tự xác nhận "Tôi đã chuyển khoản"
  const handleConfirmManualTransfer = async () => {
    if (!window.confirm("Bạn đã hoàn tất chuyển khoản chính xác số tiền và nội dung trên ứng dụng ngân hàng?")) {
      return;
    }
    try {
      setConfirmingManual(true);
      const res = await api.post("/sepay/confirm-transfer");
      if (res.data?.success) {
        alert(res.data.message || "Hồ sơ của bạn đã được ghi nhận và chuyển sang trạng thái Chờ xét duyệt!");
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      alert("Lỗi khi xác nhận chuyển khoản: " + (err.response?.data?.message || err.message));
    } finally {
      setConfirmingManual(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(fieldName);
    setTimeout(() => setCopied(""), 2000);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-dialog-title"
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100/80">
              💳
            </div>
            <div>
              <h2 id="payment-dialog-title" className="text-lg font-bold text-slate-900 leading-snug">
                Thanh toán phí dịch vụ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Giao dịch được mã hóa và bảo mật an toàn 256-bit SSL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
            title="Đóng cửa sổ thanh toán"
            aria-label="Đóng cửa sổ"
          >
            <FaTimes className="text-base" />
          </button>
        </header>

        {/* Nội dung thanh toán (Scrollable) */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 text-sm">
          {!showQR ? (
            /* BƯỚC 1: XEM CHI TIẾT HÓA ĐƠN & CHỌN CỔNG THANH TOÁN */
            <section className="space-y-6">
              {/* Box Hóa đơn tóm tắt (Invoice Card) */}
              <article className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Chi tiết hóa đơn
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Chờ thanh toán
                  </span>
                </div>

                <div className="space-y-2.5 text-slate-600 pt-1">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Gói đăng ký:</span>
                    <span className="font-semibold text-slate-900 text-right">{description}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Thời hạn sử dụng:</span>
                    <span className="text-slate-800 font-medium">Vĩnh viễn theo tài khoản</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Phí xác minh hồ sơ:</span>
                    <span className="text-slate-800 font-semibold">{amount.toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-slate-200/90 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Tổng thanh toán:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-700 tracking-tight">
                      {amount.toLocaleString("vi-VN")}
                    </span>
                    <span className="ml-1 text-sm font-bold text-blue-700">VNĐ</span>
                  </div>
                </div>
              </article>

              {/* Lựa chọn phương thức thanh toán */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Chọn phương thức thanh toán (Hỗ trợ 0đ phí API)
                </label>

                {/* Phương thức 1: Chuyển khoản VietQR / SePay (Khuyên dùng) */}
                <div
                  onClick={() => setSelectedMethod("vietqr")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedMethod === "vietqr"
                      ? "border-blue-600 bg-blue-50/25 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center p-1.5 flex-shrink-0">
                      <img
                        src="/images/vietqr-logo.svg"
                        alt="VietQR NAPAS"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Chuyển khoản Ngân hàng (VietQR / SePay)</h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Quét mã QR bằng mọi App Ngân hàng (MB, VCB, ACB, Techcombank...). Tự động duyệt ngay 0đ phí.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center pl-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMethod === "vietqr"
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedMethod === "vietqr" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                  </div>
                </div>

                {/* Phương thức 2: Ví MoMo */}
                <div
                  onClick={() => setSelectedMethod("momo")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedMethod === "momo"
                      ? "border-rose-500 bg-rose-50/25 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-11 rounded-xl bg-pink-50 border border-pink-200/80 flex items-center justify-center p-1.5 flex-shrink-0">
                      <img
                        src="/images/momo-icon.svg"
                        alt="Ví MoMo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Ví Điện Tử MoMo</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Thanh toán qua ví MoMo (Cổng Sandbox test giao dịch).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center pl-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMethod === "momo"
                          ? "border-rose-600 bg-rose-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedMethod === "momo" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông báo lỗi nếu có */}
              {error && (
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2.5">
                  <FaInfoCircle className="text-rose-500 flex-shrink-0 text-base" />
                  <span>{error}</span>
                </div>
              )}

              {/* Nút tiến hành */}
              <button
                onClick={handleProceedPayment}
                disabled={loading}
                className={`w-full py-3.5 px-5 rounded-xl font-bold text-white transition shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm ${
                  selectedMethod === "vietqr"
                    ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                    : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang khởi tạo phiên thanh toán...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {selectedMethod === "vietqr"
                        ? "Tiếp tục quét mã VietQR Ngân hàng"
                        : "Tiếp tục thanh toán với MoMo"}
                    </span>
                    <span className="text-white/80 text-base">→</span>
                  </>
                )}
              </button>

              {/* Bảo mật */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <FaShieldAlt className="text-blue-600 flex-shrink-0" />
                  <span>Chuẩn VietQR NAPAS 247</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaRegCheckCircle className="text-emerald-600 flex-shrink-0" />
                  <span>Xác nhận tự động SePay Webhook</span>
                </div>
              </div>
            </section>
          ) : (
            /* BƯỚC 2: QUÉT MÃ QR (VIETQR HOẶC MOMO) */
            <section className="space-y-4">
              {selectedMethod === "vietqr" ? (
                /* GIAO DIỆN QUÉT MÃ VIETQR NGÂN HÀNG (SEPAY) */
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <FaUniversity className="text-blue-600 text-lg" />
                      <h3 className="font-bold text-slate-900 text-base">
                        Quét mã VietQR bằng App Ngân hàng
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Mở ứng dụng ngân hàng bất kỳ (MBBank, Vietcombank, Techcombank, VPBank,...) để quét mã tự động điền số tiền và nội dung.
                    </p>

                    {/* Mã QR từ VietQR.io */}
                    {vietQrData?.qrCodeUrl && (
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs mb-3">
                        <img
                          src={vietQrData.qrCodeUrl}
                          alt="VietQR Chuyển khoản"
                          className="w-56 h-auto max-w-full rounded-lg"
                        />
                      </div>
                    )}

                    {/* Bảng chi tiết chuyển khoản (Cho người dùng chuyển thủ công) */}
                    <div className="w-full max-w-md bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs text-left">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">Ngân hàng:</span>
                        <strong className="text-slate-800">{vietQrData?.bankId || "MBBank"}</strong>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-sm font-mono">
                            {vietQrData?.accountNo || "0866690965"}
                          </strong>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(vietQrData?.accountNo, "accountNo")}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Sao chép số tài khoản"
                          >
                            {copied === "accountNo" ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">Chủ tài khoản:</span>
                        <strong className="text-slate-800 uppercase">
                          {vietQrData?.accountName || "NGUYEN VAN A"}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">Số tiền:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-blue-700 text-sm">
                            {amount.toLocaleString("vi-VN")} đ
                          </strong>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(String(amount), "amount")}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Sao chép số tiền"
                          >
                            {copied === "amount" ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                        <span className="text-blue-900 font-medium">Nội dung CK:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-rose-600 font-mono text-sm">
                            {vietQrData?.transferContent || "MG1"}
                          </strong>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(vietQrData?.transferContent, "content")}
                            className="text-rose-600 hover:text-rose-800 p-1"
                            title="Sao chép nội dung"
                          >
                            {copied === "content" ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Trạng thái Polling */}
                    {isPolling && (
                      <div className="w-full max-w-md py-2.5 px-3 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 text-xs flex items-center justify-center gap-2 mt-3">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                        <span className="font-medium">Hệ thống SePay đang lắng nghe biến động tài khoản...</span>
                      </div>
                    )}
                  </div>

                  {/* Nút hỗ trợ xác nhận nhanh */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleConfirmManualTransfer}
                      disabled={confirmingManual}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-60"
                    >
                      <FaCheck />
                      <span>{confirmingManual ? "Đang xác nhận..." : "Tôi đã hoàn tất chuyển khoản"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowQR(false)}
                      className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <FaArrowLeft className="text-[10px]" />
                      <span>Quay lại chọn phương thức khác</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* GIAO DIỆN QUÉT MÃ MOMO */
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <FaQrcode className="text-slate-700 text-lg" />
                      <h3 className="font-bold text-slate-900 text-base">
                        Quét mã QR MoMo
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Mở ứng dụng <strong className="text-slate-700">MoMo</strong> để quét mã thanh toán
                    </p>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs mb-3">
                      <QRCodeSVG
                        value={paymentData?.payUrl || ""}
                        size={200}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    <div className="w-full max-w-xs space-y-1.5 text-xs text-slate-600 pb-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Số tiền:</span>
                        <strong className="text-rose-600 font-bold text-sm">
                          {amount.toLocaleString("vi-VN")} VNĐ
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nội dung:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[180px]">
                          {description}
                        </span>
                      </div>
                    </div>

                    {isPolling && (
                      <div className="w-full max-w-xs py-2 px-3 rounded-lg bg-pink-50 border border-pink-200/80 text-rose-700 text-xs flex items-center justify-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                        <span className="font-medium">Đang chờ MoMo phản hồi...</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentData?.payUrl, "momoUrl")}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <FaCopy className={copied === "momoUrl" ? "text-emerald-600" : "text-slate-400"} />
                      <span>{copied === "momoUrl" ? "Đã sao chép!" : "Sao chép link MoMo"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => paymentData?.payUrl && window.open(paymentData.payUrl, "_blank")}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <FaExternalLinkAlt className="text-xs text-slate-300" />
                      <span>Mở cổng MoMo</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowQR(false)}
                    className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <FaArrowLeft className="text-[10px]" />
                    <span>Quay lại chọn phương thức khác</span>
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer bảo đảm an toàn */}
        <footer className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <FaLock className="text-slate-400" />
            <span>Mã hóa thông tin giao dịch</span>
          </div>
          <span>Bất Động Sản © 2026</span>
        </footer>
      </div>
    </div>
  );
};

export default PaymentModal;
