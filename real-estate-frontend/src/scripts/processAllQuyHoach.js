// D:\DACS\real-estate-frontend\src\scripts\processAllQuyHoach.js
//  D:\DACS\real-estate-frontend\src\scripts> node ./processAllQuyHoach.js
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

// --- CẤU HÌNH ---
const PROJECT_ROOT = path.resolve(__dirname, '../../');
// Thư mục chứa các thư mục con là tên tỉnh, và bên trong là file KMZ
const SOURCE_DIR = path.join(PROJECT_ROOT, 'kmz_source');
// Thư mục đích cuối cùng
const DEST_DIR = path.join(PROJECT_ROOT, 'public/quyhoach');
const PARSER_SCRIPT = './parseKmlToJson.js';
const KML_STD_FILENAME = 'doc.kml';
const JSON_STD_FILENAME = 'index.json';

/**
 * Hàm chính thực thi toàn bộ quy trình
 */
async function processAll() {
    console.log('--- BẮT ĐẦU TỰ ĐỘNG HÓA QUY TRÌNH QUY HOẠCH (THEO CẤU TRÚC TỈNH) ---');
    console.log(`Đọc file từ thư mục gốc: ${SOURCE_DIR}`);

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`\n❌ LỖI: Thư mục nguồn ${SOURCE_DIR} không tồn tại. Vui lòng tạo thư mục và sắp xếp KMZ vào các thư mục con là tên tỉnh.`);
        return;
    }

    // Lấy danh sách các thư mục con (Tên Tỉnh)
    const provinceFolders = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    if (provinceFolders.length === 0) {
        console.log('Không tìm thấy thư mục tỉnh nào. Vui lòng sắp xếp file KMZ theo thư mục tỉnh.');
        return;
    }

    for (const provinceName of provinceFolders) {
        const currentSourceDir = path.join(SOURCE_DIR, provinceName);
        const sourceFiles = fs.readdirSync(currentSourceDir).filter(f => f.toLowerCase().endsWith('.kmz'));

        if (sourceFiles.length === 0) {
            console.log(`\n⚠️ Bỏ qua tỉnh ${provinceName}: Không có file KMZ nào.`);
            continue;
        }

        for (const kmzFilename of sourceFiles) {
            // KHAI BÁO CÁC BIẾN CẦN TRUY CẬP Ở PHẠM VI NGOÀI TRY/FINALLY
            let zipFilePath, districtFolderPath;
            let kmzFilePath;
            let success = false;

            // Tên Huyện/Dự án là tên file (bỏ đuôi .kmz)
            const districtName = path.parse(kmzFilename).name;

            console.log(`\n--- XỬ LÝ: [${provinceName}] ${districtName} ---`);

            try {
                // 1. Chuẩn bị đường dẫn
                kmzFilePath = path.join(currentSourceDir, kmzFilename); // Gán giá trị
                const zipFilename = districtName + '.zip';
                zipFilePath = path.join(currentSourceDir, zipFilename);
                districtFolderPath = path.join(DEST_DIR, provinceName, districtName);

                // 2. Đổi tên/Sao chép .kmz thành .zip
                fs.copyFileSync(kmzFilePath, zipFilePath);

                // 3. Tạo cấu trúc thư mục đích (ghi đè nếu tồn tại)
                fs.mkdirSync(districtFolderPath, { recursive: true });

                // 4. Giải nén (Ghi đè nếu file tồn tại)
                const zip = new AdmZip(zipFilePath);
                zip.extractAllTo(districtFolderPath, true);
                console.log(`✓ Giải nén thành công vào: ${districtFolderPath}`);

                // 5. Tìm và Chuẩn hóa file KML (doc.kml)
                const extractedFiles = fs.readdirSync(districtFolderPath);

                // Tìm file .kml cần đổi tên (tức là tên khác 'doc.kml', không phân biệt hoa thường)
                const kmlFileToRename = extractedFiles.find(f =>
                    f.toLowerCase().endsWith('.kml') && f.toLowerCase() !== KML_STD_FILENAME
                );
                const finalKmlPath = path.join(districtFolderPath, KML_STD_FILENAME);

                if (kmlFileToRename) {
                    // Trường hợp 1: Tìm thấy file cần đổi tên
                    const oldKmlPath = path.join(districtFolderPath, kmlFileToRename);
                    fs.renameSync(oldKmlPath, finalKmlPath);
                    console.log(`✓ Chuẩn hóa tên KML: ${kmlFileToRename} -> ${KML_STD_FILENAME}`);

                } else if (fs.existsSync(finalKmlPath)) {
                    // Trường hợp 2: File KML đã là 'doc.kml'
                    console.log(`✓ KML đã chuẩn hóa sẵn: ${KML_STD_FILENAME}`);
                } else {
                    // Trường hợp 3: Không tìm thấy KML nào
                    throw new Error(`Không tìm thấy file KML chính (*.kml) trong thư mục giải nén.`);
                }

                // 6. Chạy script Parse JSON
                const kmlRelativePath = path.join('public/quyhoach', provinceName, districtName, KML_STD_FILENAME);
                const jsonRelativePath = path.join('public/quyhoach', provinceName, districtName, JSON_STD_FILENAME);

                // *** SỬA ĐỔI QUAN TRỌNG: Bao bọc đường dẫn bằng dấu nháy kép ***
                // Sử dụng dấu nháy kép để xử lý khoảng trắng trong tên thư mục
                const kmlArg = `../../${kmlRelativePath}`;
                const jsonArg = `../../${jsonRelativePath}`;

                // Tạo lệnh, bao bọc đối số bằng dấu nháy kép
                const command = `node ${PARSER_SCRIPT} "${kmlArg}" "${jsonArg}"`;
                // *** KẾT THÚC SỬA ĐỔI ***

                const output = execSync(command, { encoding: 'utf-8', cwd: __dirname });
                console.log(output.trim());

                success = true; // Đánh dấu xử lý thành công

            } catch (error) {
                // IN RA LỖI RÕ RÀNG TRONG KHỐI CATCH
                console.error(`\n❌ QUY TRÌNH THẤT BẠI cho ${kmzFilename}: ${error.message}`);
            } finally {
                // 7. Dọn dẹp

                // Xóa file ZIP tạm thời
                if (zipFilePath && fs.existsSync(zipFilePath)) {
                    fs.unlinkSync(zipFilePath);
                    console.log(`✓ Đã xóa file ZIP tạm thời.`);
                }

                // Xóa file KMZ gốc nếu thành công
                if (success && kmzFilePath && fs.existsSync(kmzFilePath)) {
                    fs.unlinkSync(kmzFilePath);
                    console.log(`✓ Đã xóa file KMZ gốc: ${kmzFilename} (Thành công).`);
                }
            }
        }
    }

    console.log('\n--- HOÀN TẤT TỰ ĐỘNG HÓA TẤT CẢ QUY HOẠCH ---');
}

processAll();