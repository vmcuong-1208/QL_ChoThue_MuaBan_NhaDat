// Script để parse file KML và tạo JSON Index cho GroundOverlay
// Đã sử dụng logic đệ quy để xử lý GroundOverlay lồng sâu trong nhiều cấp Folder
// node ./src/parseKmlToJson.js ./public/quyhoach/Go_Cong_Tay_2030/doc.kml ./public/quyhoach/Go_Cong_Tay_2030/index.json
const fs = require("fs")
const path = require("path")
const xml2js = require("xml2js")

// Hàm đệ quy để tìm kiếm GroundOverlay trong container
function findGroundOverlaysRecursive(container, groundOverlays, kmlFilePath, baseUrl) {
    // 1. Trích xuất GroundOverlay trực tiếp trong container hiện tại
    if (container.GroundOverlay && Array.isArray(container.GroundOverlay)) {
        container.GroundOverlay.forEach((overlay) => {
            const href = overlay.Icon ? overlay.Icon[0].href[0] : null
            const latLonBox = overlay.LatLonBox ? overlay.LatLonBox[0] : null

            if (href && latLonBox) {
                const bounds = {
                    north: Number.parseFloat(latLonBox.north[0]),
                    south: Number.parseFloat(latLonBox.south[0]),
                    east: Number.parseFloat(latLonBox.east[0]),
                    west: Number.parseFloat(latLonBox.west[0]),
                }

                // Tạo URL tuyệt đối từ thư mục public
                const fileName = path.basename(href)
                const districtName = path.basename(path.dirname(kmlFilePath))
                // Đảm bảo URL bắt đầu bằng baseUrl và có tên huyện
                const imageUrl = `${baseUrl}/${districtName}/files/${fileName}`

                groundOverlays.push({
                    name: overlay.name ? overlay.name[0] : "Unknown",
                    url: imageUrl,
                    bounds,
                })
            }
        })
    }

    // 2. Gọi đệ quy cho các Folder con
    if (container.Folder && Array.isArray(container.Folder)) {
        container.Folder.forEach((folder) => {
            findGroundOverlaysRecursive(folder, groundOverlays, kmlFilePath, baseUrl)
        })
    }
}

// Hàm parse KML file chính
async function parseKmlToJson(kmlFilePath, outputJsonPath, baseUrl = "/quyhoach") {
    try {
        const kmlContent = fs.readFileSync(kmlFilePath, "utf-8")
        const parser = new xml2js.Parser()
        const result = await parser.parseStringPromise(kmlContent)

        const groundOverlays = []
        const document = result.kml.Document[0]

        // Bắt đầu tìm kiếm đệ quy từ thẻ Document
        findGroundOverlaysRecursive(document, groundOverlays, kmlFilePath, baseUrl)

        // Ghi JSON Index
        const jsonData = {
            version: "2.0", // Tăng version để đánh dấu đã sửa lỗi Folder
            timestamp: new Date().toISOString(),
            totalOverlays: groundOverlays.length,
            overlays: groundOverlays,
        }

        fs.writeFileSync(outputJsonPath, JSON.stringify(jsonData, null, 2))
        console.log(`✓ Đã tạo JSON Index: ${outputJsonPath}`)
        console.log(`✓ Tổng số GroundOverlay: ${groundOverlays.length}`)

        return jsonData
    } catch (error) {
        console.error("Lỗi khi parse KML:", error.message)
        process.exit(1)
    }
}

// Chạy script
const kmlFile = process.argv[2]
const outputFile = process.argv[3]

if (!kmlFile || !outputFile) {
    console.log("Cách sử dụng: node parseKmlToJson.js <kml-file> <output-json>")
    console.log(
        "Ví dụ: node parseKmlToJson.js ./public/quyhoach/gocongtay/doc.kml ./public/quyhoach/gocongtay/index.json",
    )
    process.exit(1)
}

parseKmlToJson(kmlFile, outputFile)