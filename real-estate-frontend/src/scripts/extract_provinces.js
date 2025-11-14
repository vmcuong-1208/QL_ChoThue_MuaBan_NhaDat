const fs = require('fs');
const path = require('path');

// Hàm chuẩn hóa tên (Cần thiết để loại bỏ tiền tố)
const normalizeVietnamese = (str) => {
    if (!str) return '';
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    return str.trim();
};

const extractProvinceMap = () => {
    // ⚠️ ĐƯỜNG DẪN ĐƯỢC CHỈNH SỬA: 
    // Từ src/scripts, cần đi lên 1 cấp (..) rồi vào public/data
    const filePath = path.join(__dirname, '..', '..', 'public', 'data', 'sorted.json');

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const sortedData = JSON.parse(data);

        const provinceMap = {};

        for (const l1 of sortedData) {
            // Cấu trúc: [ID, Tên, ...]
            const [l1_id, l1_name] = l1; 

            if (l1_id && l1_name) {
                provinceMap[l1_name.trim()] = {
                    id: l1_id,
                    name: l1_name.trim()
                };
            }
        }

        console.log("✅ Dữ liệu Tỉnh/Thành phố và ID đã trích xuất thành công:");
        console.log("----------------------------------------------------------------");
        console.log(JSON.stringify(provinceMap, null, 2));
        console.log("----------------------------------------------------------------");
        console.log(`Tổng số: ${Object.keys(provinceMap).length}`);

    } catch (error) {
        console.error("❌ Lỗi khi đọc hoặc phân tích sorted.json:", error.message);
        console.log(`Vui lòng đảm bảo file sorted.json nằm tại: ${filePath}`);
    }
};

extractProvinceMap();