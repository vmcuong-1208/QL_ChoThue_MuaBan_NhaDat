"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  FaTimes,
  FaCheckCircle,
  FaShieldAlt,
  FaBolt,
  FaQrcode,
  FaCopy,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaCreditCard,
} from "react-icons/fa";
import api from "../../services/api";

const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  amount = 500000,
  description = "Nâng cấp tài khoản môi giới",
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reset state khi modal đóng/mở
  useEffect(() => {
    if (!isOpen) {
      setPaymentData(null);
      setError("");
      setShowQR(false);
      setLoading(false);
      setIsPolling(false);
      setCopied(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isOpen]);

  const checkPaymentStatus = async (orderId) => {
    try {
      const response = await api.get(`/momo-payment/check-status/${orderId}`);
      const data = response.data;
      console.log("Payment status:", data);

      if (data.success && data.transaction.status === "SUCCESS") {
        setIsPolling(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        alert("Thanh toán thành công! Tài khoản đã được nâng cấp.");
        onSuccess && onSuccess();
        onClose();
        window.location.reload();
      } else if (data.transaction.status === "FAILED") {
        setIsPolling(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        alert("Thanh toán thất bại!");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };

  const startPolling = (orderId) => {
    setIsPolling(true);
    const interval = setInterval(() => {
      checkPaymentStatus(orderId);
    }, 3000);

    setPollingInterval(interval);

    setTimeout(() => {
      setIsPolling(false);
      clearInterval(interval);
    }, 300000);
  };

  const handleMoMoPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Vui lòng đăng nhập để thanh toán");
      }

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

        // setTimeout(() => {
        //   window.open(data.payUrl, "_blank");
        // }, 2000);

        startPolling(data.orderId);
      } else {
        throw new Error(data.message || "Không thể tạo giao dịch MoMo");
      }
    } catch (error) {
      console.error("Error creating MoMo payment:", error);
      setError(error.message || "Có lỗi xảy ra khi tạo giao dịch");
    } finally {
      setLoading(false);
    }
  };

  const copyPaymentLink = () => {
    if (paymentData?.payUrl) {
      navigator.clipboard.writeText(paymentData.payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openMoMoPage = () => {
    if (paymentData?.payUrl) {
      window.open(paymentData.payUrl, "_blank");
    }
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay với backdrop blur */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        {/* Modal Container */}
        <div
          className="relative w-full max-w-2xl max-h-[95vh] overflow-hidden bg-white shadow-2xl rounded-3xl animate-slideInUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Gradient giống Home.js */}
          <div className="relative px-6 py-6 overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute w-64 h-64 rounded-full -top-10 -left-10 bg-white/20 animate-pulse"></div>
              <div
                className="absolute w-48 h-48 rounded-full -bottom-10 -right-10 bg-white/20 animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center bg-white shadow-lg w-14 h-14 rounded-2xl animate-bounce">
                  <FaCreditCard className="text-3xl text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Thanh toán nâng cấp
                  </h2>
                  <p className="text-sm font-medium text-blue-100">
                    Nâng cấp tài khoản môi giới chuyên nghiệp
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 text-white transition-all duration-300 bg-white/20 rounded-xl hover:bg-white/30 hover:rotate-90 hover:scale-110 active:scale-95"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Amount Display - Card style */}
            <div className="relative p-5 mt-5 overflow-hidden border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-100">
                    Số tiền thanh toán
                  </p>
                  <p className="mt-1 text-4xl font-black text-white">
                    {amount.toLocaleString("vi-VN")}
                    <span className="ml-2 text-2xl font-bold">đ</span>
                  </p>
                </div>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-3xl">💰</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 mt-3 border border-white/30 bg-white/10 rounded-xl">
                <span className="text-sm font-bold text-blue-100">
                  Mục đích: {description}
                </span>
              </div>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="overflow-y-auto max-h-[calc(95vh-280px)] p-6">
            {!showQR ? (
              /* Payment Method Selection */
              <div className="space-y-6 animate-fadeInUp">
                {/* MoMo Payment Section */}
                <div className="p-6 transition-all duration-300 border-2 border-gray-100 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 hover:border-pink-200 hover:shadow-xl group">
                  {/* MoMo Logo */}
                  <div className="flex items-center justify-center mb-6">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                      alt="MoMo Payment"
                      className="h-20 transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  {/* Features List */}
                  <div className="mb-6 space-y-3">
                    <h3 className="mb-4 text-xl font-bold text-center text-gray-800">
                      Thanh toán qua MoMo
                    </h3>

                    <div className="space-y-3">
                      {[
                        {
                          icon: <FaShieldAlt />,
                          text: "Thanh toán an toàn, bảo mật tối đa",
                          color: "text-green-600",
                        },
                        {
                          icon: <FaCheckCircle />,
                          text: "Hỗ trợ nhiều phương thức thanh toán",
                          color: "text-blue-600",
                        },
                        {
                          icon: <FaBolt />,
                          text: "Xử lý giao dịch nhanh chóng",
                          color: "text-orange-600",
                        },
                      ].map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 transition-all duration-300 bg-white border border-gray-100 rounded-xl hover:border-pink-200 hover:shadow-md hover:translate-x-2"
                        >
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 ${feature.color}`}
                          >
                            {feature.icon}
                          </div>
                          <span className="text-sm font-bold text-gray-700">
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 mb-4 border-l-4 border-red-500 rounded-lg bg-red-50 animate-scaleIn">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-red-700">
                            Có lỗi xảy ra
                          </p>
                          <p className="text-xs font-medium text-red-600">
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Button */}
                  <button
                    onClick={handleMoMoPayment}
                    disabled={loading}
                    className="relative w-full px-6 py-4 overflow-hidden text-lg font-bold text-white transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:shadow-2xl hover:scale-105 active:scale-95 group/btn"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg
                          className="w-6 h-6 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Đang tạo giao dịch...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        <FaCreditCard className="text-2xl" />
                        Thanh toán với MoMo
                      </span>
                    )}
                    <span className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-purple-600 to-pink-600 group-hover/btn:opacity-100"></span>
                  </button>
                </div>

                {/* Security Notice */}
                <div
                  className="p-4 border-l-4 border-blue-500 rounded-lg bg-blue-50 animate-fadeInUp"
                  style={{ animationDelay: "100ms" }}
                >
                  <div className="flex items-start gap-3">
                    <FaShieldAlt className="flex-shrink-0 mt-1 text-xl text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">
                        Giao dịch được bảo mật
                      </p>
                      <p className="mt-1 text-xs font-medium text-blue-700">
                        Thông tin thanh toán của bạn được mã hóa và bảo vệ theo
                        tiêu chuẩn quốc tế
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* QR Code Payment View */
              <div className="space-y-6 animate-fadeInUp">
                {/* QR Code Container */}
                <div className="p-6 transition-all duration-300 border-2 border-indigo-100 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <FaQrcode className="text-3xl text-indigo-600 animate-pulse" />
                      <h3 className="text-2xl font-bold text-gray-800">
                        Quét mã QR để thanh toán
                      </h3>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center p-6 mx-auto mb-6 bg-white border-4 border-indigo-200 shadow-2xl w-fit rounded-3xl">
                      <QRCodeSVG
                        value={paymentData.payUrl}
                        size={220}
                        level="M"
                        includeMargin={true}
                        className="transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    {/* Instructions */}
                    <div className="p-4 space-y-2 border border-indigo-200 bg-white/50 rounded-xl">
                      <p className="text-sm font-bold text-gray-700">
                        📱 Mở app MoMo và quét mã QR này
                      </p>
                      <p className="text-xs font-medium text-gray-600">
                        Hoặc sử dụng các nút bên dưới để thanh toán
                      </p>
                    </div>

                    {/* Polling Status */}
                    {isPolling && (
                      <div className="p-3 mt-4 border border-blue-200 bg-blue-50 rounded-xl animate-pulse">
                        <p className="text-sm font-bold text-blue-700">
                          ⏳ Đang chờ xác nhận thanh toán...
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    onClick={copyPaymentLink}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-indigo-400 hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <FaCopy className={copied ? "text-green-500" : ""} />
                    {copied ? "Đã copy!" : "Copy link thanh toán"}
                  </button>

                  <button
                    onClick={openMoMoPage}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all duration-300 shadow-lg rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <FaExternalLinkAlt />
                    Mở trang thanh toán
                  </button>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setShowQR(false)}
                  className="flex items-center justify-center w-full gap-2 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 border-2 border-gray-200 rounded-xl hover:bg-gray-200 hover:border-gray-300 hover:scale-105 active:scale-95"
                >
                  <FaArrowLeft />
                  Quay lại
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentModal;
