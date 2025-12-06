import { useState } from "react";
import { SERVER_URL } from "../../../services/api";

export const SafeImage = ({ src, alt = "Hình ảnh", onClick, className = "" }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="flex items-center justify-center px-3 py-2 text-xs italic text-gray-500 bg-gray-100 rounded-lg">
        ⚠️ Hình ảnh không còn tồn tại
      </div>
    );
  }

  const imageUrl = src.startsWith("http") || src.startsWith("blob:") ? src : `${SERVER_URL}${src}`;

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`max-w-xs rounded-xl cursor-pointer transition-all duration-300 hover:opacity-90 hover:scale-105 shadow-md ${className}`}
      onClick={onClick}
      onError={() => setError(true)}
    />
  );
};

export const SafeVideo = ({ src }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="px-3 py-2 text-xs italic text-gray-500 bg-gray-100 rounded-lg">
        ⚠️ Video không còn tồn tại
      </div>
    );
  }

  const videoUrl = src.startsWith("http") || src.startsWith("blob:") ? src : `${SERVER_URL}${src}`;

  return (
    <video
      controls
      className="max-w-xs transition-all duration-300 shadow-md rounded-xl hover:shadow-lg"
      onError={() => setError(true)}
    >
      <source src={videoUrl} type="video/mp4" />
      Trình duyệt không hỗ trợ video
    </video>
  );
};

export const MessageStatus = ({ status, isMe }) => {
  if (!isMe) return null;

  switch (status) {
    case "pending":
      return <span className="ml-1 text-xs text-gray-400 animate-pulse">⏳</span>;
    case "sent":
      return <span className="ml-1 text-xs text-blue-300">✓</span>;
    case "delivered":
      return <span className="ml-1 text-xs text-blue-300">✓✓</span>;
    case "seen":
      return <span className="ml-1 text-xs text-green-400">✓✓</span>;
    default:
      return null;
  }
};

export const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-2 mb-3 animate-fadeIn">
      <div className="flex items-center gap-1 px-4 py-3 shadow-sm bg-gradient-to-r from-gray-200 to-gray-100 rounded-2xl">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></span>
          <span
            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></span>
          <span
            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></span>
        </div>
      </div>
    </div>
  );
};
