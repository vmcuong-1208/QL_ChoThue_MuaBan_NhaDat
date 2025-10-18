// Utility để load planning data (index.json) từ thư mục /public/quyhoach/
// Normalize tên huyện để match với tên folder

import unorm from "unorm"

// Hàm normalize tên đơn vị hành chính để match với tên folder theo PascalCase
// Cải tiến: Tự động loại bỏ tiền tố hành chính (Huyện, Thị xã, Thành phố)
function normalizeDistrictName(districtName) {
  if (!districtName) return ""

  // 1. Tách dấu và loại bỏ tiền tố hành chính (Huyện, Thị xã, Thành phố)
  let processedName = unorm
    .nfd(districtName) // Tách dấu
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu (Ví dụ: "Huyen Go Cong Tay")

  // Loại bỏ tiền tố hành chính: Huyen, Thi Xa, Thanh Pho (case-insensitive)
  // Sử dụng regex với \s* để bắt cả khoảng trắng và dấu gạch dưới nếu có.
  processedName = processedName.replace(/^(Huyen|Thi Xa|Thanh Pho)\s*/i, "") 
  // (Kết quả: "Go Cong Tay" hoặc "My Tho")

  // 2. Chuyển sang Pascal Case (và dùng gạch dưới thay vì khoảng trắng)
  const pascalCase = processedName
    .toLowerCase() // Chuyển sang chữ thường để xử lý các từ
    .replace(/[^a-z0-9\s]/g, "") // Loại bỏ ký tự đặc biệt, giữ lại khoảng trắng
    .trim() 
    .split(/\s+/) // Tách các từ bằng khoảng trắng
    .map(word => {
      if (!word) return ""
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join("_") // Nối các từ lại bằng dấu gạch dưới

  return pascalCase // Ví dụ: "Huyện Gò Công Tây" -> "Go_Cong_Tay"
}

// Hàm load planning data từ index.json
export async function loadPlanningData(districtName) {
  if (!districtName) {
    console.log("[v0] District name is empty, skipping planning data load")
    return null
  }

  try {
    // Chuỗi sẽ là: Go_Cong_Tay, My_Tho, Cai_Lay (Không có prefix hành chính)
    const folderNameBase = normalizeDistrictName(districtName) 
    console.log(`[v0] Loading planning data for district: ${districtName}`)
    console.log(`[v0] Normalized name (No Prefix, PascalCase): ${folderNameBase}`)

    // Thử load index.json từ folder có tên bắt đầu với normalized name
    // Cấu trúc: /public/quyhoach/[folder-name]/index.json
    // Các pattern này KHÔNG chứa tiền tố hành chính để khớp với Go_Cong_Tay_2030
    const possibleFolders = [
      `${folderNameBase}_2030`, // Ví dụ: Go_Cong_Tay_2030 (Khớp)
      `${folderNameBase}_2035`,
      `${folderNameBase}_2025`,
      `${folderNameBase}`, // Ví dụ: My_Tho (Nếu không có năm)
    ]

    // Thử load từng folder
    for (const folder of possibleFolders) {
      try {
        const response = await fetch(`/quyhoach/${folder}/index.json`)
        if (response.ok) {
          const data = await response.json()
          console.log(`[v0] Successfully loaded planning data from: /quyhoach/${folder}/index.json`)
          console.log(`[v0] Total overlays: ${data.totalOverlays}`)
          return data
        }
      } catch (error) {
        // Tiếp tục thử folder tiếp theo
        continue
      }
    }

    console.log(`[v0] No planning data found for district: ${districtName}`)
    return null
  } catch (error) {
    console.error("[v0] Error loading planning data:", error)
    return null
  }
}

// Hàm load planning data từ URL cụ thể (nếu biết đường dẫn chính xác)
export async function loadPlanningDataFromUrl(folderPath) {
  if (!folderPath) return null

  try {
    const response = await fetch(`/quyhoach/${folderPath}/index.json`)
    if (response.ok) {
      const data = await response.json()
      console.log(`[v0] Successfully loaded planning data from: /quyhoach/${folderPath}/index.json`)
      return data
    }
    return null
  } catch (error) {
    console.error("[v0] Error loading planning data from URL:", error)
    return null
  }
}