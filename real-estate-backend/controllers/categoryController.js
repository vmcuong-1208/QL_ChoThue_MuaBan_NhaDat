const categoryService = require("../services/categoryService");

// 1. LOẠI BĐS
const getPropertyTypes = async (req, res) => {
  try {
    const includeAll = req.query.includeAll === "true" || req.query.includeAll === true || Boolean(req.user);
    const data = await categoryService.getAllPropertyTypes(includeAll);
    res.json(data);
  } catch (err) {
    console.error("Lỗi getPropertyTypes:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const createPropertyType = async (req, res) => {
  try {
    const data = await categoryService.createPropertyType(req.body);
    res.status(201).json({ message: "Thêm loại BĐS thành công", data });
  } catch (err) {
    console.error("Lỗi createPropertyType:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const updatePropertyType = async (req, res) => {
  try {
    const data = await categoryService.updatePropertyType(req.params.id, req.body);
    res.json({ message: "Cập nhật loại BĐS thành công", data });
  } catch (err) {
    console.error("Lỗi updatePropertyType:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const togglePropertyType = async (req, res) => {
  try {
    const data = await categoryService.togglePropertyType(req.params.id);
    res.json({ message: "Cập nhật trạng thái thành công", data });
  } catch (err) {
    console.error("Lỗi togglePropertyType:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const deletePropertyType = async (req, res) => {
  try {
    await categoryService.deletePropertyType(req.params.id);
    res.json({ message: "Đã xóa loại BĐS thành công" });
  } catch (err) {
    console.error("Lỗi deletePropertyType:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

// 2. TỈNH / THÀNH PHỐ
const getProvinces = async (req, res) => {
  try {
    const includeAll = req.query.includeAll === "true" || Boolean(req.user);
    const data = await categoryService.getAllProvinces(includeAll);
    res.json(data);
  } catch (err) {
    console.error("Lỗi getProvinces:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const createProvince = async (req, res) => {
  try {
    const data = await categoryService.createProvince(req.body);
    res.status(201).json({ message: "Thêm tỉnh/thành phố thành công", data });
  } catch (err) {
    console.error("Lỗi createProvince:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const updateProvince = async (req, res) => {
  try {
    const data = await categoryService.updateProvince(req.params.code, req.body);
    res.json({ message: "Cập nhật tỉnh/thành phố thành công", data });
  } catch (err) {
    console.error("Lỗi updateProvince:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const toggleProvince = async (req, res) => {
  try {
    const data = await categoryService.toggleProvince(req.params.code);
    res.json({ message: "Cập nhật trạng thái thành công", data });
  } catch (err) {
    console.error("Lỗi toggleProvince:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const deleteProvince = async (req, res) => {
  try {
    await categoryService.deleteProvince(req.params.code);
    res.json({ message: "Đã xóa tỉnh/thành phố thành công" });
  } catch (err) {
    console.error("Lỗi deleteProvince:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

// 3. QUẬN / HUYỆN
const getDistricts = async (req, res) => {
  try {
    const { provinceCode = "", search = "", includeAll } = req.query;
    const isAll = includeAll === "true" || Boolean(req.user);
    const data = await categoryService.getAllDistricts({
      provinceCode,
      search,
      includeAll: isAll,
    });
    res.json(data);
  } catch (err) {
    console.error("Lỗi getDistricts:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const createDistrict = async (req, res) => {
  try {
    const data = await categoryService.createDistrict(req.body);
    res.status(201).json({ message: "Thêm quận/huyện thành công", data });
  } catch (err) {
    console.error("Lỗi createDistrict:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const updateDistrict = async (req, res) => {
  try {
    const data = await categoryService.updateDistrict(req.params.code, req.body);
    res.json({ message: "Cập nhật quận/huyện thành công", data });
  } catch (err) {
    console.error("Lỗi updateDistrict:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const toggleDistrict = async (req, res) => {
  try {
    const data = await categoryService.toggleDistrict(req.params.code);
    res.json({ message: "Cập nhật trạng thái thành công", data });
  } catch (err) {
    console.error("Lỗi toggleDistrict:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const deleteDistrict = async (req, res) => {
  try {
    await categoryService.deleteDistrict(req.params.code);
    res.json({ message: "Đã xóa quận/huyện thành công" });
  } catch (err) {
    console.error("Lỗi deleteDistrict:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

// 4. DỰ ÁN BẤT ĐỘNG SẢN (PROJECTS)
const getProjects = async (req, res) => {
  try {
    const { provinceCode = "", districtCode = "", status = "all", search = "" } = req.query;
    const data = await categoryService.getAllProjects({
      provinceCode,
      districtCode,
      status,
      search,
    });
    res.json(data);
  } catch (err) {
    console.error("Lỗi getProjects:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const getProjectDetail = async (req, res) => {
  try {
    const data = await categoryService.getProjectById(req.params.id);
    res.json(data);
  } catch (err) {
    console.error("Lỗi getProjectDetail:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    const data = await categoryService.createProject(req.body);
    res.status(201).json({ message: "Thêm dự án thành công", data });
  } catch (err) {
    console.error("Lỗi createProject:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const data = await categoryService.updateProject(req.params.id, req.body);
    res.json({ message: "Cập nhật dự án thành công", data });
  } catch (err) {
    console.error("Lỗi updateProject:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const toggleProject = async (req, res) => {
  try {
    const data = await categoryService.toggleProject(req.params.id);
    res.json({ message: "Cập nhật trạng thái thành công", data });
  } catch (err) {
    console.error("Lỗi toggleProject:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    await categoryService.deleteProject(req.params.id);
    res.json({ message: "Đã xóa dự án thành công" });
  } catch (err) {
    console.error("Lỗi deleteProject:", err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

module.exports = {
  // Types
  getPropertyTypes,
  createPropertyType,
  updatePropertyType,
  togglePropertyType,
  deletePropertyType,
  // Provinces
  getProvinces,
  createProvince,
  updateProvince,
  toggleProvince,
  deleteProvince,
  // Districts
  getDistricts,
  createDistrict,
  updateDistrict,
  toggleDistrict,
  deleteDistrict,
  // Projects
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  toggleProject,
  deleteProject,
};