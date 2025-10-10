import axios from "axios"

const API_URL = "https://provinces.open-api.vn/api/v1"

const locationService = {
  // Lấy danh sách tỉnh/thành phố
  getProvinces: async () => {
    try {
      const response = await axios.get(`${API_URL}/p`)
      return response.data.map((province) => ({
        MaTinh: province.code,
        TenTinh: province.name,
      }))
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tỉnh/thành phố:", error)
      throw error
    }
  },

  // Lấy danh sách quận/huyện theo tỉnh/thành phố
  getDistricts: async (provinceCode) => {
    try {
      const response = await axios.get(`${API_URL}/p/${provinceCode}?depth=2`)
      return response.data.districts.map((district) => ({
        MaHuyen: district.code,
        TenHuyen: district.name,
      }))
    } catch (error) {
      console.error("Lỗi khi lấy danh sách quận/huyện:", error)
      throw error
    }
  },

  // Lấy danh sách phường/xã theo quận/huyện
  getWards: async (districtCode) => {
    try {
      const response = await axios.get(`${API_URL}/d/${districtCode}?depth=2`)
      return response.data.wards.map((ward) => ({
        MaXa: ward.code,
        TenXa: ward.name,
      }))
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phường/xã:", error)
      throw error
    }
  },
}

export default locationService
