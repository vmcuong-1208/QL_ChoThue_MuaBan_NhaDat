// Cấu hình Google Maps API

export const GOOGLE_MAPS_CONFIG = {
  // API Key từ Google Cloud Console
  apiKey: "AIzaSyDhjP2YOGxpCbsp7HatnQXGsKutiIXwmuo",

  // Libraries cần load
  libraries: ["places", "drawing", "geometry"],

  // Ngôn ngữ
  language: "vi",

  // Region
  region: "VN",

  // Map options mặc định
  defaultMapOptions: {
    zoom: 13,
    center: { lat: 21.0285, lng: 105.8542 }, // Hà Nội
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR,
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT,
    },
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: "greedy",
  },

  // Styles cho các map types
  mapStyles: {
    default: [],
    // Có thể thêm custom styles nếu cần
  },
}

// Tọa độ trung tâm các tỉnh/thành phố lớn
export const PROVINCE_CENTERS = {
  "Hà Nội": { lat: 21.0285, lng: 105.8542 },
  "Hồ Chí Minh": { lat: 10.8231, lng: 106.6297 },
  "Đà Nẵng": { lat: 16.0544, lng: 108.2022 },
  "Hải Phòng": { lat: 20.8449, lng: 106.6881 },
  "Cần Thơ": { lat: 10.0452, lng: 105.7469 },
  "An Giang": { lat: 10.5215, lng: 105.1258 },
  "Bà Rịa - Vũng Tàu": { lat: 10.5417, lng: 107.2429 },
  "Bắc Giang": { lat: 21.2819, lng: 106.1975 },
  "Bắc Kạn": { lat: 22.1474, lng: 105.8348 },
  "Bạc Liêu": { lat: 9.294, lng: 105.7215 },
  "Bắc Ninh": { lat: 21.1861, lng: 106.0763 },
  "Bến Tre": { lat: 10.2433, lng: 106.3757 },
  "Bình Định": { lat: 13.783, lng: 109.2196 },
  "Bình Dương": { lat: 11.3254, lng: 106.477 },
  "Bình Phước": { lat: 11.7511, lng: 106.7234 },
  "Bình Thuận": { lat: 10.9273, lng: 108.1017 },
  "Cà Mau": { lat: 9.1526, lng: 105.196 },
  "Cao Bằng": { lat: 22.6356, lng: 106.2522 },
  "Đắk Lắk": { lat: 12.71, lng: 108.2378 },
  "Đắk Nông": { lat: 12.2646, lng: 107.6098 },
  "Điện Biên": { lat: 21.8042, lng: 103.1076 },
  "Đồng Nai": { lat: 11.0686, lng: 107.1676 },
  "Đồng Tháp": { lat: 10.4938, lng: 105.6881 },
  "Gia Lai": { lat: 13.8078, lng: 108.1094 },
  "Hà Giang": { lat: 22.8025, lng: 104.9784 },
  "Hà Nam": { lat: 20.5835, lng: 105.923 },
  "Hà Tĩnh": { lat: 18.3559, lng: 105.8877 },
  "Hải Dương": { lat: 20.9373, lng: 106.3145 },
  "Hậu Giang": { lat: 9.7579, lng: 105.6412 },
  "Hòa Bình": { lat: 20.6861, lng: 105.3131 },
  "Hưng Yên": { lat: 20.6464, lng: 106.0511 },
  "Khánh Hòa": { lat: 12.2585, lng: 109.0526 },
  "Kiên Giang": { lat: 10.0125, lng: 105.0811 },
  "Kon Tum": { lat: 14.3497, lng: 108.0005 },
  "Lai Châu": { lat: 22.3864, lng: 103.4702 },
  "Lâm Đồng": { lat: 11.5753, lng: 108.1429 },
  "Lạng Sơn": { lat: 21.8537, lng: 106.761 },
  "Lào Cai": { lat: 22.4809, lng: 103.9755 },
  "Long An": { lat: 10.6956, lng: 106.2431 },
  "Nam Định": { lat: 20.4388, lng: 106.1621 },
  "Nghệ An": { lat: 19.2342, lng: 104.92 },
  "Ninh Bình": { lat: 20.2506, lng: 105.9745 },
  "Ninh Thuận": { lat: 11.6738, lng: 108.8629 },
  "Phú Thọ": { lat: 21.268, lng: 105.2045 },
  "Phú Yên": { lat: 13.0882, lng: 109.0929 },
  "Quảng Bình": { lat: 17.6102, lng: 106.3487 },
  "Quảng Nam": { lat: 15.5394, lng: 108.0191 },
  "Quảng Ngãi": { lat: 15.1214, lng: 108.8044 },
  "Quảng Ninh": { lat: 21.0064, lng: 107.2925 },
  "Quảng Trị": { lat: 16.7943, lng: 107.1856 },
  "Sóc Trăng": { lat: 9.6025, lng: 105.9739 },
  "Sơn La": { lat: 21.1022, lng: 103.7289 },
  "Tây Ninh": { lat: 11.3351, lng: 106.0988 },
  "Thái Bình": { lat: 20.4463, lng: 106.3365 },
  "Thái Nguyên": { lat: 21.5671, lng: 105.8252 },
  "Thanh Hóa": { lat: 19.8067, lng: 105.7851 },
  "Thừa Thiên Huế": { lat: 16.4637, lng: 107.5909 },
  "Tiền Giang": { lat: 10.4493, lng: 106.342 },
  "Trà Vinh": { lat: 9.8124, lng: 106.2992 },
  "Tuyên Quang": { lat: 21.7767, lng: 105.228 },
  "Vĩnh Long": { lat: 10.2396, lng: 105.9571 },
  "Vĩnh Phúc": { lat: 21.3609, lng: 105.5474 },
  "Yên Bái": { lat: 21.7168, lng: 104.8986 },
}

/**
 * Lấy tọa độ trung tâm của tỉnh/thành phố
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @returns {object} - {lat, lng}
 */
export const getProvinceCenter = (provinceName) => {
  return PROVINCE_CENTERS[provinceName] || PROVINCE_CENTERS["Hà Nội"]
}
