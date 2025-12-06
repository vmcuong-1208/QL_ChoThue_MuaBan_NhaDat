const db = require("../config/db");

const getRecommendationsByUser = async (userId, limit = 20) => {
  const [viewHistory] = await db.promise().query(
    `
    SELECT tt.MaLoaiND, tt.MaTinh, tt.Gia, MAX(lx.NgayXem) as LastViewed
    FROM LICHSUXEM lx
    JOIN THONGTINNHADAT tt ON lx.MaTTND = tt.MaTTND
    WHERE lx.MaNgDung = ? 
    GROUP BY tt.MaLoaiND, tt.MaTinh, tt.Gia
    ORDER BY LastViewed DESC 
    LIMIT 10
  `,
    [userId]
  );

  const [favorites] = await db.promise().query(
    `
    SELECT tt.MaLoaiND, tt.MaTinh, tt.Gia
    FROM YEUTHICH yt
    JOIN THONGTINNHADAT tt ON yt.MaTTND = tt.MaTTND
    WHERE yt.MaNgDung = ?
    GROUP BY tt.MaLoaiND, tt.MaTinh, tt.Gia
  `,
    [userId]
  );

  const userHistory = [...viewHistory, ...favorites];
  let recommendations = [];
  let reason = "Gợi ý cho bạn";

  if (userHistory.length > 0) {
    const propertyTypes = userHistory.map((h) => h.MaLoaiND);
    const provinces = userHistory.map((h) => h.MaTinh);

    const prices = userHistory
      .map((h) => {
        const price = Number.parseFloat(h.Gia);
        return isNaN(price) ? 0 : price;
      })
      .filter((price) => price > 0);

    let minPrice = 0;
    let maxPrice = 999999999999;

    if (prices.length > 0) {
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      minPrice = avgPrice * 0.7;
      maxPrice = avgPrice * 1.5;
    }

    const typeCount = {};
    const provinceCount = {};

    propertyTypes.forEach((type) => {
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    provinces.forEach((province) => {
      provinceCount[province] = (provinceCount[province] || 0) + 1;
    });

    const topTypes = Object.keys(typeCount)
      .sort((a, b) => typeCount[b] - typeCount[a])
      .slice(0, 3);

    const topProvinces = Object.keys(provinceCount)
      .sort((a, b) => provinceCount[b] - provinceCount[a])
      .slice(0, 3);

    const whereConditions = [];
    const queryParams = [userId];

    if (topTypes.length > 0) {
      whereConditions.push(`tt.MaLoaiND IN (${topTypes.map(() => "?").join(",")})`);
      queryParams.push(...topTypes);
    }

    if (topProvinces.length > 0) {
      whereConditions.push(`tt.MaTinh IN (${topProvinces.map(() => "?").join(",")})`);
      queryParams.push(...topProvinces);
    }

    if (prices.length > 0) {
      whereConditions.push(`tt.Gia BETWEEN ? AND ?`);
      queryParams.push(minPrice, maxPrice);
    }

    if (whereConditions.length > 0) {
      const [similarProperties] = await db.promise().query(
        `
        SELECT tt.*, 
               (SELECT DuongDanAnh 
                FROM HINHANHBDS 
                WHERE MaTTND = tt.MaTTND 
                LIMIT 1) AS HinhAnh,
               l.TenLoaiND
        FROM THONGTINNHADAT tt
        LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
        WHERE tt.MaNgDung != ?
        AND tt.TrangThai = 'Đang bán'
        AND (${whereConditions.join(" OR ")})
        ORDER BY tt.SoLuotXem DESC, tt.NgayTao DESC
        LIMIT ?
        `,
        [...queryParams, limit]
      );

      recommendations = similarProperties;
      reason = "Dựa trên sở thích của bạn";
    }
  }

  if (recommendations.length < limit) {
    const remaining = limit - recommendations.length;
    const existingIds = recommendations.map((r) => r.MaTTND);

    let excludeClause = "";
    let excludeParams = [];

    if (existingIds.length > 0) {
      excludeClause = `AND tt.MaTTND NOT IN (${existingIds.map(() => "?").join(",")})`;
      excludeParams = existingIds;
    }

    const [popularProperties] = await db.promise().query(
      `
      SELECT tt.*, 
             (SELECT DuongDanAnh 
              FROM HINHANHBDS 
              WHERE MaTTND = tt.MaTTND 
              LIMIT 1) AS HinhAnh,
             l.TenLoaiND
      FROM THONGTINNHADAT tt
      LEFT JOIN LOAINHADAT l ON tt.MaLoaiND = l.MaLoaiND
      WHERE tt.MaNgDung != ?
      AND tt.TrangThai = 'Đang bán'
      ${excludeClause}
      ORDER BY tt.SoLuotXem DESC, tt.NgayTao DESC
      LIMIT ?
    `,
      [userId, ...excludeParams, remaining]
    );

    recommendations = [...recommendations, ...popularProperties];
    if (userHistory.length === 0) {
      reason = "Bất động sản phổ biến";
    }
  }

  for (const property of recommendations) {
    const [images] = await db
      .promise()
      .query(`SELECT DuongDanAnh FROM HINHANHBDS WHERE MaTTND = ?`, [property.MaTTND]);
    property.HinhAnh = images.map((img) => img.DuongDanAnh);
  }

  return {
    recommendations,
    reason,
    total: recommendations.length,
  };
};

const saveViewHistory = async (userId, propertyId) => {
  await db.promise().query(
    `
      REPLACE INTO LICHSUXEM (MaNgDung, MaTTND, NgayXem) 
      VALUES (?, ?, NOW())
    `,
    [userId, propertyId]
  );
  return true;
};

module.exports = {
  getRecommendationsByUser,
  saveViewHistory,
};
