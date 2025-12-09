"use client";

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../services/api";

import MediaGallery from "./property-detail/MediaGallery";
import FullscreenViewer from "./property-detail/FullscreenViewer";
import PropertyMainInfo from "./property-detail/PropertyMainInfo";
import PropertyRentalInfo from "./property-detail/PropertyRentalInfo";
import PropertyDescription from "./property-detail/PropertyDescription";
import PropertyLegalDocs from "./property-detail/PropertyLegalDocs";
import PropertyMapSection from "./property-detail/PropertyMapSection";
import SellerCard from "./property-detail/SellerCard";
import ShareModal from "./property-detail/ShareModal";
import ReportListingModal from "./property-detail/ReportListingModal";
import PromotionalPopup from "../common/PromotionalPopup";
import usePropertyDetail from "../../hooks/usePropertyDetail";

const PropertyDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Custom Hook for Property Detail Logic
  const {
    property,
    seller,
    loading,
    error,
    isFavorite,
    locationNames,
    planningData,
    toggleFavorite,
  } = usePropertyDetail(id, currentUser, navigate);

  // Media state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState([]);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [fullscreenMediaType, setFullscreenMediaType] = useState("property");

  // Legal documents state
  const [currentDocumentImageIndex, setCurrentDocumentImageIndex] = useState(0);
  const [showDocumentImages, setShowDocumentImages] = useState(false);

  // Seller phone & promotional popup
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [showPromotionalPopup, setShowPromotionalPopup] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Combine media (images + video)
  useEffect(() => {
    if (property) {
      const items = [];
      if (property.HinhAnh && property.HinhAnh.length > 0) {
        property.HinhAnh.forEach((img) =>
          items.push({ type: "image", url: img })
        );
      }
      if (property.VideoThuaDat) {
        items.push({ type: "video", url: property.VideoThuaDat });
      }
      setMediaItems(items);
    }
  }, [property]);

  // Check promotional popup
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!currentUser && !token) {
      const timer = setTimeout(() => {
        const tokenCheck = localStorage.getItem("token");
        if (!tokenCheck) setShowPromotionalPopup(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowPromotionalPopup(false);
    }
  }, [currentUser]);

  // Helper formatters
  const getFullAddress = () => {
    if (!property) return "";
    const addressParts = [];
    if (property.DiaChi) addressParts.push(property.DiaChi);
    if (locationNames.ward) addressParts.push(locationNames.ward);
    if (locationNames.district) addressParts.push(locationNames.district);
    if (locationNames.province) addressParts.push(locationNames.province);
    return addressParts.join(", ");
  };

  const formatPrice = (price) => {
    if (!price) return "Thỏa thuận";
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " tỷ";
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " triệu";
    }
    return price.toLocaleString() + " VNĐ";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fullscreen handlers
  const openFullscreen = (index, type = "property") => {
    setFullscreenImageIndex(index);
    setFullscreenMediaType(type);
    setShowFullscreenImage(true);
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = () => {
    setShowFullscreenImage(false);
    document.body.style.overflow = "unset";
  };

  const handleOpenChat = async () => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const conversationResponse = await axios.post(
        `${API_URL}/messages/conversations`,
        {
          user2: seller?.MaNgDung || property.MaNgDung,
          propertyId: property.MaTTND,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const convId = conversationResponse.data.property
        ? `u${conversationResponse.data.user.MaNgDung}-p${conversationResponse.data.property.MaTTND}`
        : `u${conversationResponse.data.user.MaNgDung}`;
      navigate(`/tin-nhan/${convId}`, {
        state: { conversation: conversationResponse.data },
      });
    } catch (err) {
      console.error("Lỗi tạo cuộc trò chuyện:", err);
      alert("Lỗi khi mở khung nhắn tin.");
    }
  };

  const handleContactClick = (platform) => {
    if (platform === "zalo" && seller?.SDT) {
      const zaloUrl = `https://zalo.me/${seller.SDT.replace(/\s/g, "")}`;
      window.open(zaloUrl, "_blank");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareToFacebook = () =>
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        window.location.href
      )}`,
      "_blank"
    );

  const shareToTwitter = () =>
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        window.location.href
      )}`,
      "_blank"
    );

  const shareToZalo = () =>
    window.open(
      `https://zalo.me/share?url=${encodeURIComponent(window.location.href)}`,
      "_blank"
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Đang tải thông tin bất động sản...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-red-600">
            {error || "Không tìm thấy thông tin."}
          </p>
          <Link
            to="/bat-dong-san"
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const boundary = property.ToaDoVN2000?.wgs84Coordinates || null;
  const area = property.ToaDoVN2000?.area || property.DienTich;

  return (
    <div className="min-h-screen bg-gray-50">
      {showPromotionalPopup && (
        <PromotionalPopup onClose={() => setShowPromotionalPopup(false)} />
      )}

      <div className="pt-20">
        {/* Breadcrumb Navigation */}
        <div className="px-4 py-3 mx-auto bg-white border-b max-w-7xl animate-fadeIn">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="transition-colors hover:text-blue-600">
              Trang chủ
            </Link>
            <span>&gt;</span>
            <Link
              to="/bat-dong-san"
              className="transition-colors hover:text-blue-600"
            >
              Bất động sản
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium truncate">
              {property?.TieuDe || `Bất động sản #${id}`}
            </span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="px-4 py-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left 2 Columns: Media, Details, Legal Docs, Map */}
            <div className="space-y-6 lg:col-span-2">
              <div className="overflow-hidden transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl animate-fadeInUp">
                <MediaGallery
                  mediaItems={mediaItems}
                  currentImageIndex={currentImageIndex}
                  onPrev={() =>
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? mediaItems.length - 1 : prev - 1
                    )
                  }
                  onNext={() =>
                    setCurrentImageIndex((prev) =>
                      prev === mediaItems.length - 1 ? 0 : prev + 1
                    )
                  }
                  onOpenFullscreen={openFullscreen}
                />
              </div>

              <PropertyMainInfo
                property={property}
                fullAddress={getFullAddress()}
                formatPrice={formatPrice}
                formatDate={formatDate}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onShare={() => setShowShareModal(true)}
                onOpenReportModal={() => setShowReportModal(true)}
              />

              {/* Thông tin cho thuê chuyên sâu (nếu bài đăng là cho thuê hoặc có dữ liệu thuê) */}
              {(property.TrangThai === "cho thuê" ||
                property.TienDatCoc ||
                property.ThoiHanThue ||
                property.TienIch) && (
                <PropertyRentalInfo
                  property={property}
                  formatPrice={formatPrice}
                />
              )}

              <PropertyDescription description={property.MoTa} />

              <PropertyLegalDocs
                documentImages={property.HinhAnhGiayTo || []}
                showDocumentImages={showDocumentImages}
                onToggleShow={() => setShowDocumentImages(!showDocumentImages)}
                currentDocumentImageIndex={currentDocumentImageIndex}
                onSelectIndex={setCurrentDocumentImageIndex}
                onPrev={() =>
                  setCurrentDocumentImageIndex((prev) =>
                    prev === 0
                      ? (property.HinhAnhGiayTo?.length || 1) - 1
                      : prev - 1
                  )
                }
                onNext={() =>
                  setCurrentDocumentImageIndex((prev) =>
                    prev === (property.HinhAnhGiayTo?.length || 1) - 1
                      ? 0
                      : prev + 1
                  )
                }
                onOpenFullscreen={openFullscreen}
              />

              <PropertyMapSection
                property={property}
                fullAddress={getFullAddress()}
                boundary={boundary}
                area={area}
                planningData={planningData}
              />
            </div>

            {/* Right Column: Seller Info Card */}
            <SellerCard
              seller={seller}
              property={property}
              showFullPhone={showFullPhone}
              onTogglePhone={() => setShowFullPhone(!showFullPhone)}
              onOpenChat={handleOpenChat}
              onContactClick={handleContactClick}
              onSuggestedMessageClick={handleOpenChat}
              formatPrice={formatPrice}
              formatDate={formatDate}
              onOpenReportModal={() => setShowReportModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShareFacebook={shareToFacebook}
        onShareTwitter={shareToTwitter}
        onShareZalo={shareToZalo}
        onCopyLink={copyToClipboard}
        copySuccess={copySuccess}
      />

      {/* Report Listing Modal */}
      <ReportListingModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        property={property}
        currentUser={currentUser}
      />

      {/* Fullscreen Media Viewer */}
      <FullscreenViewer
        isOpen={showFullscreenImage}
        onClose={closeFullscreen}
        currentIndex={
          fullscreenMediaType === "property"
            ? fullscreenImageIndex
            : currentDocumentImageIndex
        }
        mediaType={fullscreenMediaType}
        mediaItems={mediaItems}
        documentImages={property.HinhAnhGiayTo || []}
        onPrev={() => {
          if (fullscreenMediaType === "property") {
            setFullscreenImageIndex((prev) =>
              prev === 0 ? mediaItems.length - 1 : prev - 1
            );
          } else {
            setCurrentDocumentImageIndex((prev) =>
              prev === 0
                ? (property.HinhAnhGiayTo?.length || 1) - 1
                : prev - 1
            );
          }
        }}
        onNext={() => {
          if (fullscreenMediaType === "property") {
            setFullscreenImageIndex((prev) =>
              prev === mediaItems.length - 1 ? 0 : prev + 1
            );
          } else {
            setCurrentDocumentImageIndex((prev) =>
              prev === (property.HinhAnhGiayTo?.length || 1) - 1
                ? 0
                : prev + 1
            );
          }
        }}
      />
    </div>
  );
};

export default PropertyDetail;
