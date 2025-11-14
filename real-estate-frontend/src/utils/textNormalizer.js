// Utility để normalize tiếng Việt (xóa dấu)
// Sử dụng trong tìm kiếm để match "hô" với "Hồ Chí Minh"

export const normalizeVietnamese = (text) => {
  // Chuyển tất cả về chữ thường trước để đơn giản hóa logic
  let result = text.toLowerCase();

  // 1. Xử lý ký tự 'đ' (Tiếng Việt) thành 'd' (chuẩn hóa)
  result = result.replace(/đ/g, 'd');

  // 2. Khử dấu bằng NFD + regex (xử lý á, ả, ã, ạ, etc.)
  result = result
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Xóa combining marks

  return result;
}

// Hàm parseQueryTerms (Giữ nguyên)
export const parseQueryTerms = (query) => {
  return query
    .split(/[,\s]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
}