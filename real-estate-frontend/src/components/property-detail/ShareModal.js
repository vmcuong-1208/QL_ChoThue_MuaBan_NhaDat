import { FaTimes } from "react-icons/fa";

const ShareModal = ({
  isOpen,
  onClose,
  onShareFacebook,
  onShareTwitter,
  onShareZalo,
  onCopyLink,
  copySuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 m-4 bg-white shadow-2xl rounded-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Chia sẻ tin đăng
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
            title="Đóng"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <button
            onClick={onShareFacebook}
            className="flex flex-col items-center gap-2 p-3 transition-all rounded-lg hover:bg-blue-50 group"
          >
            <div className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-blue-600 rounded-full group-hover:scale-110">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700">Facebook</span>
          </button>

          <button
            onClick={onShareTwitter}
            className="flex flex-col items-center gap-2 p-3 transition-all rounded-lg hover:bg-sky-50 group"
          >
            <div className="flex items-center justify-center w-12 h-12 text-white transition-transform rounded-full bg-sky-500 group-hover:scale-110">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700">Twitter</span>
          </button>

          <button
            onClick={onShareZalo}
            className="flex flex-col items-center gap-2 p-3 transition-all rounded-lg hover:bg-blue-50 group"
          >
            <div className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-blue-500 rounded-full group-hover:scale-110">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700">Zalo</span>
          </button>

          <button
            onClick={onCopyLink}
            className="flex flex-col items-center gap-2 p-3 transition-all rounded-lg hover:bg-gray-100 group"
          >
            <div className="flex items-center justify-center w-12 h-12 text-white transition-transform bg-gray-600 rounded-full group-hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700">Copy</span>
          </button>
        </div>

        <div className="p-3 rounded-lg bg-gray-50">
          <p className="mb-2 text-xs font-semibold text-gray-700">
            Link chia sẻ
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={typeof window !== "undefined" ? window.location.href : ""}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={onCopyLink}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all ${
                copySuccess ? "bg-green-500" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {copySuccess ? "Đã copy!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
