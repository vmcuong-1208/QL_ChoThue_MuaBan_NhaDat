// Utility để load planning data (index.json) từ thư mục /public/quyhoach/
// Cập nhật: Hỗ trợ cấu trúc nested /quyhoach/[province]/[district_year]/index.json
// Cải tiến: Thử nhiều variants folder để match pattern lung tung (dot/underscore, abbrev prefix từ type)

import unorm from "unorm"

// Map type district → abbrev prefix (Dựa trên tên KMZ đã xử lý)
const DISTRICT_TYPE_ABBREV = {
    "Huyện": "",
    "Thành phố": "TP.", // Ví dụ: 2030.TP.Thuan An
    "Quận": "Quan_", // Ví dụ: 2021.Quan_11
    "Thị xã": "TX.",
    // Thêm nếu có type khác từ sorted.json
}

// Hàm normalize tên (chung cho province/district)
function normalizeName(name, isProvince = false) {
    if (!name) return ""

    let processedName = unorm.nfd(name).replace(/[\u0300-\u036f]/g, "") // Loại dấu

    // Loại bỏ tiền tố hành chính (Quan, Huyen, Thi Xa, Thanh Pho, Tinh)
    const prefixRegex = isProvince ? /^(Tinh|Thanh Pho)\s*/i : /^(Huyen|Thi Xa|Thanh Pho|Quan)\s*/i
    processedName = processedName.replace(prefixRegex, "").trim()

    // 💡 SỬA LỖI: Chuẩn hóa thành Pascal_Underscore (e.g., "Bac Tan Uyen" → "Bac_Tan_Uyen")
    // Giúp cho districtBase luôn là dạng underscore, dễ dàng xử lý khi tạo variants.
    const pascalUnderscore = processedName
        .split(/\s+/) // Tách bằng khoảng trắng
        .map(word => {
            if (!word) return ""
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join("_")

    return pascalUnderscore
}

// Hàm lấy type district từ sorted.json (async load nếu cần)
let sortedDataCache = null
async function getDistrictType(provinceName, districtName) {
    if (!sortedDataCache) {
        try {
            // Lưu ý: Cần đảm bảo đường dẫn này đúng trong môi trường Front-end (e.g., /public/data/sorted.json)
            const response = await fetch("/data/sorted.json")
            if (!response.ok) throw new Error("Failed to load sorted.json")
            sortedDataCache = await response.json()
        } catch (err) {
            console.error("[v1] Error loading sorted.json for type:", err)
            return null
        }
    }

    const normProv = normalizeName(provinceName, true)
    const normDist = normalizeName(districtName)

    // Tìm kiếm trong cấu trúc cache [code, name, type, children]
    for (const l1 of sortedDataCache) {
        // l1[1] là tên Tỉnh
        if (normalizeName(l1[1], true) === normProv) {
            for (const l2 of l1[4]) {
                // l2[1] là tên Huyện, l2[2] là loại
                if (normalizeName(l2[1]) === normDist) {
                    return l2[2] // type e.g., "Huyện"
                }
            }
        }
    }
    return null
}

// Hàm load planning data
export async function loadPlanningData(provinceName, districtName) {
    if (!districtName) {
        console.log("[v1] District name is empty, skipping.")
        return null
    }

    const provinceFolder = provinceName ? normalizeName(provinceName, true) : null
    const districtBase = normalizeName(districtName) // e.g., "Thuan_An"
    console.log(`[v1] Loading for province: ${provinceName || 'None'}, district: ${districtName}`)
    console.log(`[v1] Normalized: province ${provinceFolder || 'None'}, district base ${districtBase}`)

    const possibleYears = ['2020', '2021', '2023', '2024', '2030', '2035', '2025', '2040']
    const distType = await getDistrictType(provinceName, districtName)
    const abbrev = DISTRICT_TYPE_ABBREV[distType] || ""

    const possibleDistrictFolders = []

    // 💡 TÊN KHÔNG DÙNG UNDERSCORE (dot format): Lấy districtBase nhưng bỏ dấu gạch dưới
    const districtBaseNoUnderscore = districtBase.replace(/_/g, '') // e.g., "ThuanAn"

    possibleYears.forEach(year => {
        // Variant 1: Year.[Abbrev]Name (dot, e.g., 2030.TP.ThuanAn) - no underscore
        if (abbrev) possibleDistrictFolders.push(`${year}.${abbrev}${districtBaseNoUnderscore}`)

        // Variant 2: Year.Name (dot, no abbrev, no underscore, e.g., 2030.CuChi)
        possibleDistrictFolders.push(`${year}.${districtBaseNoUnderscore}`)

        // Variant 3: Year.Name (dot, no abbrev, with underscore, e.g., 2030.Bac_Tan_Uyen)
        possibleDistrictFolders.push(`${year}.${districtBase}`)

        // Variant 4: Name.Year (dot, e.g., Cai_Be.2030) - no underscore
        possibleDistrictFolders.push(`${districtBaseNoUnderscore}.${year}`)

        // Variant 5: Name_Year (underscore, e.g., Bac_Tan_Uyen_2030)
        possibleDistrictFolders.push(`${districtBase}_${year}`)

        // Variant 6: Year.Name.Suffix (dot, .QHSDD, e.g., 2021.NhaBe.QHSDD) - no underscore
        possibleDistrictFolders.push(`${year}.${districtBaseNoUnderscore}.QHSDD`)

        // Variant 7: Year.Name_Suffix (dot, _QHSDD, e.g., 2021.NhaBe_QHSDD) - no underscore
        possibleDistrictFolders.push(`${year}.${districtBaseNoUnderscore}_QHSDD`)

        // Variant 8: Year.Name_Suffix (dot, _QHSDD, with underscore, e.g., if have 2021.Binh_Chanh_QHSDD)
        possibleDistrictFolders.push(`${year}.${districtBase}_QHSDD`)
    })

    // Thêm tên folder không có năm (ví dụ: CuChi, Binh_Chanh)
    possibleDistrictFolders.push(districtBaseNoUnderscore)
    possibleDistrictFolders.push(districtBase) // With underscore

    const basePath = provinceFolder ? `/quyhoach/${provinceFolder}` : '/quyhoach'

    for (const districtFolder of possibleDistrictFolders) {
        try {
            const url = `${basePath}/${districtFolder}/index.json`
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                console.log(`[v1] Loaded from: ${url}, overlays: ${data.totalOverlays}`)
                // Xử lý tiền tố cho URL ảnh (giải quyết vấn đề relative path)
                const imageBasePath = `${basePath}/${districtFolder}`
                if (data.overlays && Array.isArray(data.overlays)) {
                    data.overlays = data.overlays.map(overlay => {
                        let cleanUrl = overlay.url.startsWith('/') ? overlay.url.substring(1) : overlay.url;
                        if (cleanUrl.includes('files/')) {
                            cleanUrl = cleanUrl.substring(cleanUrl.indexOf('files/'));
                        }
                        return {
                            ...overlay,
                            url: `${imageBasePath}/${cleanUrl}`
                        }
                    })
                }
                return data
            }
        } catch (error) {
            // Không cần in error message nếu chỉ là lỗi fetch 404
            // console.warn(`[v1] Failed ${url}: ${error.message}`)
        }
    }

    console.log(`[v1] No data found for ${districtName}`)
    return null
}

// loadPlanningDataFromUrl
export async function loadPlanningDataFromUrl(folderPath) {
    if (!folderPath) return null;

    // folderPath là "Tien_Giang/Go_Cong_Tay_2030"
    const imageBasePath = `/quyhoach/${folderPath}`;
    const url = `${imageBasePath}/index.json`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log(`[v1] Loaded from: ${url}`);

            // === 💡 THÊM ĐOẠN NÀY VÀO ===
            if (data.overlays && Array.isArray(data.overlays)) {
                data.overlays = data.overlays.map(overlay => {
                    let cleanUrl = overlay.url.startsWith('/') ? overlay.url.substring(1) : overlay.url;
                    if (cleanUrl.includes('files/')) {
                        cleanUrl = cleanUrl.substring(cleanUrl.indexOf('files/'));
                    }
                    return {
                        ...overlay,
                        url: `${imageBasePath}/${cleanUrl}`
                    };
                });
            }
            // =============================

            return data; // Trả về data đã được xử lý
        }
        return null;
    } catch (error) {
        console.error("[v1] Error from URL:", error);
        return null;
    }
}