const propertyTypeService = require("../services/propertyTypeService");

const getAll = async (req, res) => {
  try {
    const types = await propertyTypeService.getAllPropertyTypes();
    res.json(types);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách loại nhà đất:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const create = async (req, res) => {
  const { TenLoai, MoTa } = req.body;
  if (!TenLoai) {
    return res.status(400).json({ message: "Vui lòng nhập tên loại nhà đất." });
  }

  try {
    const newType = await propertyTypeService.createPropertyType(TenLoai, MoTa);
    res.status(201).json(newType);
  } catch (error) {
    console.error("Lỗi khi thêm loại nhà đất:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { TenLoai, MoTa } = req.body;

  try {
    const updated = await propertyTypeService.updatePropertyType(id, TenLoai, MoTa);
    res.json(updated);
  } catch (error) {
    console.error("Lỗi khi cập nhật loại nhà đất:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;
  try {
    await propertyTypeService.deletePropertyType(id);
    res.json({ message: "Đã xóa loại nhà đất thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa loại nhà đất:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
