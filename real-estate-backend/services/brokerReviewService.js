const db = require("../config/db");
const notificationService = require("./notificationService");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * 1. Lấy danh sách đánh giá & thống kê trung bình của môi giới
 */
const getBrokerReviews = async (brokerId, options = {}) => {
  const { star = "all", page = 1, limit = 20 } = options;

  let whereClauses = ["d.MaMoiGioi = ?", "d.TrangThai = 'HIEN_THI'"];
  const params = [brokerId];

  if (star && star !== "all") {
    whereClauses.push("d.SoSao = ?");
    params.push(Number(star));
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  // Thống kê tổng hợp (tính điểm trung bình và phân bổ số sao)
  const statsRows = await queryAsync(
    `SELECT 
       COUNT(*) AS total,
       COALESCE(AVG(SoSao), 0) AS avgRating,
       SUM(CASE WHEN SoSao = 5 THEN 1 ELSE 0 END) AS star5,
       SUM(CASE WHEN SoSao = 4 THEN 1 ELSE 0 END) AS star4,
       SUM(CASE WHEN SoSao = 3 THEN 1 ELSE 0 END) AS star3,
       SUM(CASE WHEN SoSao = 2 THEN 1 ELSE 0 END) AS star2,
       SUM(CASE WHEN SoSao = 1 THEN 1 ELSE 0 END) AS star1
     FROM DANHGIAMOIGIOI
     WHERE MaMoiGioi = ? AND TrangThai = 'HIEN_THI'`,
    [brokerId]
  );

  const stats = statsRows[0] || {};
  const totalReviews = Number(stats.total) || 0;
  const avgRating = totalReviews > 0 ? Number(stats.avgRating).toFixed(1) : "5.0";

  const distribution = {
    5: Number(stats.star5) || 0,
    4: Number(stats.star4) || 0,
    3: Number(stats.star3) || 0,
    2: Number(stats.star2) || 0,
    1: Number(stats.star1) || 0,
  };

  const percentages = {
    5: totalReviews > 0 ? Math.round((distribution[5] / totalReviews) * 100) : 0,
    4: totalReviews > 0 ? Math.round((distribution[4] / totalReviews) * 100) : 0,
    3: totalReviews > 0 ? Math.round((distribution[3] / totalReviews) * 100) : 0,
    2: totalReviews > 0 ? Math.round((distribution[2] / totalReviews) * 100) : 0,
    1: totalReviews > 0 ? Math.round((distribution[1] / totalReviews) * 100) : 0,
  };

  // Lấy danh sách đánh giá có phân trang
  const offset = (Number(page) - 1) * Number(limit);
  const dataParams = [...params, Number(limit), Number(offset)];

  const items = await queryAsync(
    `SELECT d.MaDG, d.MaMoiGioi, d.MaKhachHang, d.SoSao, d.NoiDung, d.TieuDe, d.NgayTao, d.NgayCapNhat,
            COALESCE(u.HoTen, u.TenDangNhap, u.Email) AS TenKhachHang,
            u.AnhDaiDien AS AvatarKhachHang
     FROM DANHGIAMOIGIOI d
     LEFT JOIN NGUOIDUNG u ON d.MaKhachHang = u.MaNgDung
     ${whereSql}
     ORDER BY d.NgayTao DESC
     LIMIT ? OFFSET ?`,
    dataParams
  );

  return {
    summary: {
      totalReviews,
      avgRating: Number(avgRating),
      distribution,
      percentages,
    },
    items,
    page: Number(page),
    limit: Number(limit),
  };
};

/**
 * 2. Kiểm tra điều kiện đánh giá của khách hàng đối với môi giới
 * Điều kiện:
 * - Không tự đánh giá chính mình
 * - Đã từng gửi yêu cầu liên hệ HOẶC đã có tin nhắn trao đổi qua hệ thống
 */
const checkEligibility = async (customerId, brokerId) => {
  if (!customerId) {
    return {
      canReview: false,
      reason: "Bạn cần đăng nhập để đánh giá nhà môi giới này.",
      hasContacted: false,
      existingReview: null,
    };
  }

  if (String(customerId) === String(brokerId)) {
    return {
      canReview: false,
      reason: "Bạn không thể tự đánh giá hồ sơ của chính mình.",
      hasContacted: false,
      existingReview: null,
    };
  }

  // 1. Kiểm tra đã có yêu cầu liên hệ trong YEUCAULIENHE chưa
  const contactRows = await queryAsync(
    `SELECT MaYCLH FROM YEUCAULIENHE WHERE MaNgGui = ? AND MaMoiGioi = ? LIMIT 1`,
    [customerId, brokerId]
  );
  const hasContactRequest = contactRows.length > 0;

  // 2. Kiểm tra đã có tin nhắn trong TINNHAN chưa
  const messageRows = await queryAsync(
    `SELECT MaTN FROM TINNHAN 
     WHERE (MaNgMua = ? AND MaNgBan = ?) OR (MaNgMua = ? AND MaNgBan = ?) 
     LIMIT 1`,
    [customerId, brokerId, brokerId, customerId]
  );
  const hasMessaged = messageRows.length > 0;

  const hasContacted = hasContactRequest || hasMessaged;

  // 3. Kiểm tra xem người dùng đã từng gửi đánh giá trước đó chưa
  const existingRows = await queryAsync(
    `SELECT * FROM DANHGIAMOIGIOI 
     WHERE MaKhachHang = ? AND MaMoiGioi = ? AND TrangThai = 'HIEN_THI' 
     LIMIT 1`,
    [customerId, brokerId]
  );
  const existingReview = existingRows.length > 0 ? existingRows[0] : null;

  if (!hasContacted) {
    return {
      canReview: false,
      reason: "Để đảm bảo tính xác thực, bạn cần gửi yêu cầu liên hệ hoặc trao đổi tư vấn với môi giới này trước khi gửi đánh giá.",
      hasContacted: false,
      existingReview,
    };
  }

  return {
    canReview: true,
    reason: existingReview
      ? "Bạn đã từng đánh giá môi giới này. Bạn có thể cập nhật lại nhận xét của mình."
      : "Bạn đủ điều kiện để đánh giá chất lượng dịch vụ của nhà môi giới này.",
    hasContacted: true,
    existingReview,
  };
};

/**
 * 3. Thêm mới hoặc Cập nhật đánh giá
 */
const createOrUpdateReview = async (reviewData, io = null) => {
  const { MaKhachHang, MaMoiGioi, SoSao, NoiDung, TieuDe = null } = reviewData;

  if (!MaKhachHang || !MaMoiGioi) {
    throw new Error("Thông tin khách hàng hoặc môi giới không hợp lệ!");
  }

  const numStars = Number(SoSao);
  if (!numStars || numStars < 1 || numStars > 5) {
    throw new Error("Số sao đánh giá phải từ 1 đến 5 sao!");
  }

  if (!NoiDung || !NoiDung.trim()) {
    throw new Error("Nội dung nhận xét đánh giá không được để trống!");
  }

  // Kiểm tra điều kiện đánh giá
  const eligibility = await checkEligibility(MaKhachHang, MaMoiGioi);
  if (!eligibility.canReview) {
    throw new Error(eligibility.reason);
  }

  // Lấy thông tin khách hàng và môi giới
  const [customer] = await queryAsync(
    `SELECT HoTen, TenDangNhap, Email FROM NGUOIDUNG WHERE MaNgDung = ?`,
    [MaKhachHang]
  );
  const customerName = customer?.HoTen || customer?.TenDangNhap || customer?.Email || "Khách hàng";

  let resultReviewId;
  let isUpdate = false;

  if (eligibility.existingReview) {
    // Cập nhật đánh giá cũ
    isUpdate = true;
    resultReviewId = eligibility.existingReview.MaDG;
    await queryAsync(
      `UPDATE DANHGIAMOIGIOI
       SET SoSao = ?, NoiDung = ?, TieuDe = ?, NgayCapNhat = NOW()
       WHERE MaDG = ?`,
      [numStars, NoiDung.trim(), TieuDe ? TieuDe.trim() : null, resultReviewId]
    );
  } else {
    // Tạo đánh giá mới
    const insertRes = await queryAsync(
      `INSERT INTO DANHGIAMOIGIOI (MaMoiGioi, MaKhachHang, SoSao, NoiDung, TieuDe)
       VALUES (?, ?, ?, ?, ?)`,
      [MaMoiGioi, MaKhachHang, numStars, NoiDung.trim(), TieuDe ? TieuDe.trim() : null]
    );
    resultReviewId = insertRes.insertId;

    // Gửi thông báo đến Môi giới qua hệ thống THONGBAO
    const starsString = "⭐".repeat(numStars);
    const notifContent = `Khách hàng ${customerName} vừa gửi đánh giá dịch vụ của bạn.\n\nĐánh giá: ${numStars}/5 ${starsString}\nNhận xét: "${NoiDung.trim()}"`;

    try {
      await notificationService.createNotification(
        {
          MaNgDung: MaMoiGioi,
          TieuDe: `Khách hàng ${customerName} vừa đánh giá dịch vụ (${numStars} sao)`,
          NoiDung: notifContent,
          LoaiTB: "DANH_GIA",
          LienKet: `/profile/${MaMoiGioi}`,
          DuLieuThem: {
            MaDG: resultReviewId,
            MaKhachHang,
            HoTenKhachHang: customerName,
            SoSao: numStars,
            NoiDung: NoiDung.trim(),
          },
        },
        io
      );
    } catch (notifErr) {
      console.warn("[BrokerReviewService] Không thể tạo thông báo:", notifErr.message);
    }
  }

  const [saved] = await queryAsync(
    `SELECT d.*, u.HoTen AS TenKhachHang, u.AnhDaiDien AS AvatarKhachHang
     FROM DANHGIAMOIGIOI d
     LEFT JOIN NGUOIDUNG u ON d.MaKhachHang = u.MaNgDung
     WHERE d.MaDG = ?`,
    [resultReviewId]
  );

  return {
    ...saved,
    isUpdate,
  };
};

/**
 * 4. Xóa đánh giá
 */
const deleteReview = async (reviewId, userId, userRole = "") => {
  const [review] = await queryAsync(`SELECT * FROM DANHGIAMOIGIOI WHERE MaDG = ?`, [reviewId]);
  if (!review) {
    throw new Error("Không tìm thấy đánh giá cần xóa!");
  }

  const isAdmin = (userRole || "").toLowerCase() === "admin";
  const isOwner = String(review.MaKhachHang) === String(userId);

  if (!isAdmin && !isOwner) {
    throw new Error("Bạn không có quyền xóa nhận xét đánh giá này!");
  }

  await queryAsync(`DELETE FROM DANHGIAMOIGIOI WHERE MaDG = ?`, [reviewId]);
  return { success: true, message: "Đã xóa đánh giá thành công." };
};

/**
 * 5. Lấy danh sách đánh giá của khách hàng hiện tại
 */
const getMyReviews = async (customerId) => {
  const reviews = await queryAsync(
    `SELECT d.MaDG, d.MaMoiGioi, d.MaKhachHang, d.SoSao, d.NoiDung, d.TieuDe, d.NgayTao, d.NgayCapNhat,
            COALESCE(u.HoTen, u.TenDangNhap, u.Email) AS TenMoiGioi,
            u.AnhDaiDien AS AvatarMoiGioi,
            u.SDT AS SDTMoiGioi,
            u.Email AS EmailMoiGioi
     FROM DANHGIAMOIGIOI d
     LEFT JOIN NGUOIDUNG u ON d.MaMoiGioi = u.MaNgDung
     WHERE d.MaKhachHang = ? AND d.TrangThai = 'HIEN_THI'
     ORDER BY d.NgayTao DESC`,
    [customerId]
  );
  return reviews;
};

module.exports = {
  getBrokerReviews,
  checkEligibility,
  createOrUpdateReview,
  deleteReview,
  getMyReviews,
};
