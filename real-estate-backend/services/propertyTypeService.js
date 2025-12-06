const db = require("../config/db");

const getAllPropertyTypes = async () => {
  const [types] = await db
    .promise()
    .query(
      "SELECT MaLoaiND AS MaLoai, TenLoaiND AS TenLoai, MoTa FROM LOAINHADAT ORDER BY TenLoaiND"
    );
  return types;
};

const createPropertyType = async (TenLoai, MoTa) => {
  const [result] = await db
    .promise()
    .query("INSERT INTO LOAINHADAT (TenLoaiND, MoTa) VALUES (?, ?)", [
      TenLoai,
      MoTa,
    ]);
  return { MaLoai: result.insertId, TenLoai, MoTa };
};

const updatePropertyType = async (id, TenLoai, MoTa) => {
  await db
    .promise()
    .query("UPDATE LOAINHADAT SET TenLoaiND = ?, MoTa = ? WHERE MaLoaiND = ?", [
      TenLoai,
      MoTa,
      id,
    ]);
  return { MaLoai: Number.parseInt(id), TenLoai, MoTa };
};

const deletePropertyType = async (id) => {
  await db
    .promise()
    .query("DELETE FROM LOAINHADAT WHERE MaLoaiND = ?", [id]);
  return true;
};

module.exports = {
  getAllPropertyTypes,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
};
