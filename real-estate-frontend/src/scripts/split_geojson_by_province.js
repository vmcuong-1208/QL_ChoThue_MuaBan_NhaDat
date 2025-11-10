const fs = require('fs');
const path = require('path');

// --- Cấu hình Đường dẫn ---
const INPUT_FILE = path.join(__dirname, '../data/gadm41_VNM_3.json');
const OUTPUT_DIR = path.join(__dirname, '../public/data/gis/level3s');
// --- Cấu hình Đường dẫn ---

/**
 * Hàm chuẩn hóa tên tỉnh: Loại bỏ dấu, khoảng trắng, và xử lý 'Đ/đ' để tạo tên file hợp lệ.
 * ĐÃ KHẮC PHỤC: Thêm xử lý cho ký tự 'Đ' và 'đ'.
 * @param {string} name - Tên tỉnh/thành phố (Ví dụ: "Đà Nẵng", "Bà Rịa-Vũng Tàu").
 */
const normalizeName = (name) => {
    // 1. Thay thế trực tiếp 'Đ' và 'đ' bằng 'D' và 'd'
    let tempName = name.replace(/Đ/g, 'D').replace(/đ/g, 'd');

    // 2. Loại bỏ các ký tự không phải chữ, số (bao gồm cả khoảng trắng, dấu gạch ngang, v.v.)
    // '\u00C0-\u1EF9' là dải ký tự chữ cái tiếng Việt có dấu.
    let cleanedName = tempName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '');

    // 3. Chuyển sang không dấu (sử dụng normalize('NFD'))
    let noDiacritics = cleanedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 4. Chuẩn hóa cuối cùng: Chuyển sang chữ thường
    return noDiacritics.toLowerCase(); 
};

async function splitGeoJsonByProvince() {
    console.log(`Đang đọc file đầu vào: ${INPUT_FILE}...`);
    
    // 1. Đọc và phân tích cú pháp (parse) GeoJSON lớn
    let geoJson;
    try {
        const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
        geoJson = JSON.parse(rawData);
    } catch (error) {
        console.error("❌ Lỗi khi đọc hoặc phân tích cú pháp file GeoJSON:", error);
        return;
    }

    // 2. Kiểm tra và tạo thư mục đầu ra
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Đã tạo thư mục đầu ra: ${OUTPUT_DIR}`);
    }

    // 3. Nhóm các Feature (Xã/Phường) theo Tỉnh (NAME_1)
    const provincesMap = new Map();
    const crs = geoJson.crs; // Lấy thông tin CRS để giữ lại cho các file con

    geoJson.features.forEach(feature => {
        const properties = feature.properties;
        const provinceName = properties.NAME_1;
        
        // SỬ DỤNG TÊN ĐÃ CHUẨN HÓA LÀM KEY
        const key = normalizeName(provinceName); 
        // Ví dụ: "Đà Nẵng" -> "danang", "Bình Dương" -> "binhduong"

        if (!provincesMap.has(key)) {
            provincesMap.set(key, { name: provinceName, features: [] });
        }
        provincesMap.get(key).features.push(feature);
    });

    console.log(`Đã tìm thấy ${provincesMap.size} tỉnh/thành phố cần phân mảnh.`);

    // 4. Ghi từng nhóm Feature ra file riêng
    provincesMap.forEach((provinceData, key) => {
        const features = provinceData.features;
        // Giữ nguyên cấu trúc GeoJSON FeatureCollection cho mỗi file nhỏ
        const outputGeoJson = {
            type: "FeatureCollection",
            name: `gadm41_VNM_3_${key}`,
            crs: crs, // Giữ nguyên thông tin hệ tọa độ
            features: features // CHỈ CHỨA CÁC FEATURES CẤP LEVEL 3 CỦA TỈNH NÀY
        };

        // ĐƯỜNG DẪN TỆP CHỈ SỬ DỤNG KEY (TÊN TỈNH ĐÃ CHUẨN HÓA)
        const fileName = path.join(OUTPUT_DIR, `${key}.json`); 
        
        // Ghi file JSON vào thư mục đích
        fs.writeFileSync(fileName, JSON.stringify(outputGeoJson));
        console.log(`-> Đã ghi file ${fileName} (${features.length} xã/phường) - Tỉnh gốc: ${provinceData.name}`);
    });

    console.log('✅ Hoàn tất quá trình phân mảnh GeoJSON theo tỉnh/thành phố.');
}

splitGeoJsonByProvince().catch(console.error);