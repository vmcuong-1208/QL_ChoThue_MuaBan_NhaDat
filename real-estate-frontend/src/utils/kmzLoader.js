// Utility để load và xử lý file KMZ cho lớp bản đồ quy hoạch
// KMZ files được lưu local trong thư mục public/kmz

export const DISTRICT_TYPES = {
  HUYEN: "huyen",
  THI_XA: "thi-xa",
  THANH_PHO: "thanh-pho",
}

/**
 * Load KMZ file từ local storage (cấp tỉnh)
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @returns {Promise<string>} - URL của KMZ file
 */
export const loadProvinceKMZ = async (provinceName) => {
  try {
    // Chuẩn hóa tên tỉnh để match với tên file
    const normalizedName = normalizeFileName(provinceName)

    // Đường dẫn đến file KMZ trong thư mục public
    const kmzPath = `/kmz/tinh/${normalizedName}.kmz`

    return kmzPath
  } catch (error) {
    console.error("Lỗi khi load KMZ file tỉnh:", error)
    return null
  }
}

/**
 * Load KMZ file cấp huyện/thành phố từ local storage
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @param {string} districtName - Tên huyện/thành phố/thị xã
 * @param {string} districtType - Loại hành chính: 'huyen', 'thi-xa', 'thanh-pho'
 * @returns {Promise<string>} - URL của KMZ file
 */
export const loadDistrictKMZ = async (provinceName, districtName, districtType = DISTRICT_TYPES.HUYEN) => {
  try {
    // Chuẩn hóa tên để match với tên file
    const normalizedProvince = normalizeFileName(provinceName)
    const normalizedDistrict = normalizeFileName(districtName)

    // Đường dẫn đến file KMZ trong thư mục public
    // Format: /kmz/huyen/{tinh}/{loai-hanh-chinh}-{ten-huyen}.kmz
    // Ví dụ: /kmz/huyen/tien-giang/huyen-cai-lay.kmz
    //        /kmz/huyen/tien-giang/thi-xa-cai-lay.kmz
    const kmzPath = `/kmz/huyen/${normalizedProvince}/${districtType}-${normalizedDistrict}.kmz`

    return kmzPath
  } catch (error) {
    console.error("Lỗi khi load KMZ file huyện:", error)
    return null
  }
}

/**
 * Load KMZ file từ local storage
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @returns {Promise<string>} - URL của KMZ file
 */
export const loadKMZFile = async (provinceName) => {
  try {
    // Chuẩn hóa tên tỉnh để match với tên file
    const normalizedName = normalizeFileName(provinceName)

    // Đường dẫn đến file KMZ trong thư mục public
    const kmzPath = `/kmz/${normalizedName}.kmz`

    return kmzPath
  } catch (error) {
    console.error("Lỗi khi load KMZ file:", error)
    return null
  }
}

/**
 * Danh sách các tỉnh/thành có file KMZ quy hoạch
 * Cập nhật danh sách này khi thêm file KMZ mới
 */
export const AVAILABLE_KMZ_PROVINCES = [
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cần Thơ",
  "Cao Bằng",
  "Đà Nẵng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Dương",
  "Hải Phòng",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "Hồ Chí Minh",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái",
]

/**
 * Danh sách các huyện/thành phố có file KMZ
 * Cập nhật danh sách này khi thêm file KMZ mới
 * Format: { tên: 'Tên hiển thị', loai: 'huyen' | 'thi-xa' | 'thanh-pho' }
 */
export const AVAILABLE_DISTRICT_KMZ = {
  "Tiền Giang": [
    { ten: "Mỹ Tho", loai: DISTRICT_TYPES.THANH_PHO },
    { ten: "Gò Công", loai: DISTRICT_TYPES.THANH_PHO },
    { ten: "Cai Lậy", loai: DISTRICT_TYPES.THI_XA },
    { ten: "Cái Bè", loai: DISTRICT_TYPES.HUYEN },
    { ten: "Châu Thành", loai: DISTRICT_TYPES.HUYEN },
    { ten: "Chợ Gạo", loai: DISTRICT_TYPES.HUYEN },
    { ten: "Gò Công Đông", loai: DISTRICT_TYPES.HUYEN },
    { ten: "Gò Công Tây", loai: DISTRICT_TYPES.HUYEN },
    { ten: "Tân Phú Đông", loai: DISTRICT_TYPES.HUYEN },
    { ten: "Tân Phước", loai: DISTRICT_TYPES.HUYEN },
  ],
  // Thêm các tỉnh và huyện khác ở đây
  // Ví dụ:
  // "Hà Nội": [
  //   { ten: "Ba Đình", loai: DISTRICT_TYPES.HUYEN },
  //   { ten: "Hoàn Kiếm", loai: DISTRICT_TYPES.HUYEN },
  //   { ten: "Sơn Tây", loai: DISTRICT_TYPES.THI_XA },
  //   ...
  // ]
}

/**
 * Kiểm tra xem tỉnh có file KMZ không
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @returns {boolean}
 */
export const hasKMZFile = (provinceName) => {
  return AVAILABLE_KMZ_PROVINCES.some((province) => province.toLowerCase() === provinceName.toLowerCase())
}

/**
 * Kiểm tra xem huyện có file KMZ không
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @param {string} districtName - Tên huyện/thành phố/thị xã
 * @param {string} districtType - Loại hành chính (optional)
 * @returns {boolean}
 */
export const hasDistrictKMZ = (provinceName, districtName, districtType = null) => {
  const districts = AVAILABLE_DISTRICT_KMZ[provinceName]
  if (!districts) return false

  if (districtType) {
    // Kiểm tra cả tên và loại
    return districts.some((d) => d.ten === districtName && d.loai === districtType)
  } else {
    // Chỉ kiểm tra tên
    return districts.some((d) => d.ten === districtName)
  }
}

/**
 * Lấy thông tin đầy đủ của huyện/thành phố
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @param {string} districtName - Tên huyện/thành phố/thị xã
 * @returns {object|null} - Thông tin huyện { ten, loai } hoặc null
 */
export const getDistrictInfo = (provinceName, districtName) => {
  const districts = AVAILABLE_DISTRICT_KMZ[provinceName]
  if (!districts) return null

  return districts.find((d) => d.ten === districtName) || null
}

/**
 * Lấy tên file KMZ cho huyện/thành phố
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @param {string} districtName - Tên huyện/thành phố/thị xã
 * @returns {string|null} - Tên file KMZ hoặc null
 */
export const getDistrictKMZFileName = (provinceName, districtName) => {
  const districtInfo = getDistrictInfo(provinceName, districtName)
  if (!districtInfo) return null

  const normalizedProvince = normalizeFileName(provinceName)
  const normalizedDistrict = normalizeFileName(districtName)

  return `${normalizedProvince}/${districtInfo.loai}-${normalizedDistrict}.kmz`
}

/**
 * Chuẩn hóa tên file (bỏ dấu, chuyển thành kebab-case)
 * @param {string} name - Tên cần chuẩn hóa
 * @returns {string} - Tên đã chuẩn hóa
 */
const normalizeFileName = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu
    .replace(/đ/g, "d")
    .replace(/\s+/g, "-") // Thay space bằng dash
    .replace(/[^a-z0-9-]/g, "") // Chỉ giữ chữ, số và dash
}

/**
 * Load KMZ layer vào Google Maps với options để filter
 * @param {google.maps.Map} map - Google Maps instance
 * @param {string} kmzUrl - URL của file KMZ
 * @param {object} options - Options cho KML layer
 * @returns {google.maps.KmlLayer} - KML Layer instance
 */
export const loadKMZLayer = (map, kmzUrl, options = {}) => {
  try {
    const defaultOptions = {
      url: kmzUrl,
      map: map,
      preserveViewport: true, // Không tự động zoom đến KMZ
      suppressInfoWindows: false, // Hiển thị info windows
      clickable: true,
    }

    const kmlLayer = new window.google.maps.KmlLayer({
      ...defaultOptions,
      ...options,
    })

    // Xử lý lỗi khi load KMZ
    kmlLayer.addListener("status_changed", () => {
      const status = kmlLayer.getStatus()
      if (status !== "OK") {
        console.error("Lỗi khi load KMZ layer:", status)
      }
    })

    return kmlLayer
  } catch (error) {
    console.error("Lỗi khi tạo KMZ layer:", error)
    return null
  }
}

/**
 * Parse KMZ file và lọc chỉ lấy polygon quy hoạch
 * Loại bỏ các thành phần không cần thiết như legend, text, border, scale bar
 *
 * LƯU Ý: Google Maps KmlLayer không cho phép filter trực tiếp
 * Để filter, cần:
 * 1. Download và parse KMZ file thành GeoJSON
 * 2. Filter các features
 * 3. Render bằng Data Layer hoặc Polygon
 *
 * @param {string} kmzUrl - URL của file KMZ
 * @returns {Promise<object>} - GeoJSON đã được filter
 */
export const parseAndFilterKMZ = async (kmzUrl) => {
  try {
    // Bước 1: Fetch KMZ file
    const response = await fetch(kmzUrl)
    const blob = await response.blob()

    // Bước 2: Unzip KMZ (KMZ là file ZIP chứa KML)
    // Cần thư viện jszip để unzip
    // npm install jszip
    const JSZip = (await import("jszip")).default
    const zip = await JSZip.loadAsync(blob)

    // Tìm file KML trong ZIP
    let kmlContent = null
    for (const filename in zip.files) {
      if (filename.endsWith(".kml")) {
        kmlContent = await zip.files[filename].async("string")
        break
      }
    }

    if (!kmlContent) {
      throw new Error("Không tìm thấy file KML trong KMZ")
    }

    // Bước 3: Parse KML thành GeoJSON
    // Cần thư viện togeojson để convert
    // npm install @mapbox/togeojson
    const toGeoJSON = (await import("@mapbox/togeojson")).default
    const parser = new DOMParser()
    const kmlDoc = parser.parseFromString(kmlContent, "text/xml")
    const geoJSON = toGeoJSON.kml(kmlDoc)

    // Bước 4: Filter GeoJSON - Chỉ lấy Polygon/MultiPolygon
    // Loại bỏ Point (markers), LineString (borders), và các features không phải polygon
    const filteredFeatures = geoJSON.features.filter((feature) => {
      const geometryType = feature.geometry.type

      // Chỉ giữ Polygon và MultiPolygon
      if (geometryType !== "Polygon" && geometryType !== "MultiPolygon") {
        return false
      }

      // Loại bỏ các polygon có tên chứa từ khóa không mong muốn
      const name = feature.properties.name || ""
      const description = feature.properties.description || ""
      const combinedText = (name + " " + description).toLowerCase()

      // Danh sách từ khóa cần loại bỏ
      const excludeKeywords = [
        "legend",
        "chú giải",
        "khung",
        "border",
        "scale",
        "tỷ lệ",
        "thước",
        "title",
        "tiêu đề",
        "text",
        "label",
        "nhãn",
      ]

      // Nếu chứa từ khóa loại bỏ thì bỏ qua
      if (excludeKeywords.some((keyword) => combinedText.includes(keyword))) {
        return false
      }

      // Loại bỏ polygon quá nhỏ (có thể là decoration)
      // Tính diện tích đơn giản
      if (geometryType === "Polygon") {
        const coords = feature.geometry.coordinates[0]
        if (coords.length < 4) {
          return false // Polygon phải có ít nhất 4 điểm
        }
      }

      return true
    })

    return {
      type: "FeatureCollection",
      features: filteredFeatures,
    }
  } catch (error) {
    console.error("Lỗi khi parse và filter KMZ:", error)
    return null
  }
}

/**
 * Render GeoJSON lên Google Maps bằng Data Layer
 * @param {google.maps.Map} map - Google Maps instance
 * @param {object} geoJSON - GeoJSON data
 * @param {object} styleOptions - Style options cho polygon
 * @returns {google.maps.Data} - Data layer instance
 */
export const renderGeoJSONLayer = (map, geoJSON, styleOptions = {}) => {
  try {
    const dataLayer = new window.google.maps.Data()
    dataLayer.setMap(map)

    // Add GeoJSON data
    dataLayer.addGeoJson(geoJSON)

    // Set style
    const defaultStyle = {
      fillColor: "#FF0000",
      fillOpacity: 0.3,
      strokeColor: "#FF0000",
      strokeWeight: 2,
      clickable: true,
    }

    dataLayer.setStyle({
      ...defaultStyle,
      ...styleOptions,
    })

    return dataLayer
  } catch (error) {
    console.error("Lỗi khi render GeoJSON layer:", error)
    return null
  }
}

/**
 * Lấy URL KMZ cho huyện/thành phố (wrapper function)
 * @param {string} provinceName - Tên tỉnh/thành phố
 * @param {string} districtName - Tên huyện/thành phố/thị xã
 * @param {string} districtType - Loại hành chính: 'huyen', 'thi-xa', 'thanh-pho'
 * @returns {string|null} - URL của KMZ file hoặc null
 */
export const getDistrictKMZUrl = (provinceName, districtName, districtType = DISTRICT_TYPES.HUYEN) => {
  try {
    // Chuẩn hóa tên tỉnh để loại bỏ prefix "Tỉnh ", "Thành phố "
    const normalizedProvinceName = provinceName
      .replace(/^Tỉnh\s+/i, "")
      .replace(/^Thành phố\s+/i, "")
      .replace(/^Thành phố trực thuộc trung ương\s+/i, "")
      .trim()

    // Chuẩn hóa tên huyện để loại bỏ prefix "Huyện ", "Thị xã ", "Thành phố "
    const normalizedDistrictName = districtName
      .replace(/^Huyện\s+/i, "")
      .replace(/^Thị xã\s+/i, "")
      .replace(/^Thành phố\s+/i, "")
      .trim()

    // Tự động xác định loại hành chính từ tên gốc nếu không được cung cấp
    let finalDistrictType = districtType
    if (districtName.toLowerCase().startsWith("thị xã")) {
      finalDistrictType = DISTRICT_TYPES.THI_XA
    } else if (districtName.toLowerCase().startsWith("thành phố")) {
      finalDistrictType = DISTRICT_TYPES.THANH_PHO
    } else if (districtName.toLowerCase().startsWith("huyện")) {
      finalDistrictType = DISTRICT_TYPES.HUYEN
    }

    // Chuẩn hóa tên để match với tên file
    const normalizedProvince = normalizeFileName(normalizedProvinceName)
    const normalizedDistrict = normalizeFileName(normalizedDistrictName)

    // Tạo URL KMZ
    const kmzUrl = `/kmz/huyen/${normalizedProvince}/${finalDistrictType}-${normalizedDistrict}.kmz`

    console.log("[v0] Generated KMZ URL:", {
      originalProvince: provinceName,
      normalizedProvince,
      originalDistrict: districtName,
      normalizedDistrict,
      districtType: finalDistrictType,
      url: kmzUrl,
    })

    return kmzUrl
  } catch (error) {
    console.error("Lỗi khi tạo URL KMZ:", error)
    return null
  }
}
