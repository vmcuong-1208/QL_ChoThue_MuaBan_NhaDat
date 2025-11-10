// Utility để normalize tiếng Việt (xóa dấu)
// Sử dụng trong tìm kiếm để match "hô" với "Hồ Chí Minh"

export const normalizeVietnamese = (text) => {
  // Khử dấu bằng NFD + regex
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Xóa combining marks
    .toLowerCase()
}

// Parse query thành mảng từ (split by comma, space)
export const parseQueryTerms = (query) => {
  return query
    .split(/[,\s]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
}
