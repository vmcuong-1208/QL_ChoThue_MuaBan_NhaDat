const db = require("../config/db");
const notificationService = require("./notificationService");

/**
 * Kiểm tra các tin đăng nổi bật sắp hết hạn trong vòng 6 tiếng và gửi thông báo nhắc nhở môi giới gia hạn
 * @param {object} io - Socket.io instance để phát thông báo realtime
 */
const checkAndNotifyExpiringFeaturedPosts = async (io = null) => {
  try {
    const promiseDb = db.promise();

    // Tìm các tin đăng:
    // 1. Featured = 1
    // 2. FeaturedEndDate trong khoảng từ bây giờ đến 6 tiếng tiếp theo (0 < TIMESTAMPDIFF(MINUTE, NOW(), FeaturedEndDate) <= 360)
    // 3. Chưa gửi thông báo nhắc nhở loại TIN_NOI_BAT cho bài đăng này trong vòng 12 tiếng qua (tránh spam)
    const sql = `
      SELECT 
        tt.MaTTND, tt.TieuDe, tt.MaNgDung, tt.FeaturedEndDate,
        TIMESTAMPDIFF(MINUTE, NOW(), tt.FeaturedEndDate) AS PhutConLai,
        TIMESTAMPDIFF(HOUR, NOW(), tt.FeaturedEndDate) AS GioConLai,
        u.HoTen
      FROM thongtinnhadat tt
      JOIN nguoidung u ON tt.MaNgDung = u.MaNgDung
      WHERE tt.Featured = 1 
        AND tt.FeaturedEndDate IS NOT NULL
        AND tt.FeaturedEndDate > NOW()
        AND tt.FeaturedEndDate <= DATE_ADD(NOW(), INTERVAL 6 HOUR)
        AND NOT EXISTS (
          SELECT 1 FROM THONGBAO tb 
          WHERE tb.MaNgDung = tt.MaNgDung 
            AND tb.LoaiTB = 'TIN_NOI_BAT'
            AND tb.LienKet LIKE CONCAT('%/quan-ly-bai-dang?highlight=', tt.MaTTND, '%')
            AND tb.NgayTao >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
        )
    `;

    const [expiringPosts] = await promiseDb.query(sql);

    if (expiringPosts.length === 0) {
      return;
    }

    console.log(`[Featured Reminder] Tìm thấy ${expiringPosts.length} tin nổi bật sắp hết hạn cần gửi thông báo.`);

    for (const post of expiringPosts) {
      const hours = Math.floor(post.PhutConLai / 60);
      const minutes = post.PhutConLai % 60;
      let timeText = "";
      if (hours > 0) {
        timeText = `${hours} giờ ${minutes > 0 ? minutes + " phút" : ""}`;
      } else {
        timeText = `${minutes} phút`;
      }

      const tieuDe = `Tin nổi bật #${post.MaTTND} sắp hết thời gian ưu tiên`;
      const noiDung = `Tin đăng "${post.TieuDe}" chỉ còn ${timeText} là kết thúc thời gian nổi bật (hết hạn lúc ${new Date(
        post.FeaturedEndDate
      ).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}). Hãy gia hạn ngay để không bị gián đoạn vị trí đầu trang!`;

      // Tạo thông báo với liên kết đi thẳng đến trang Quản lý bài đăng của môi giới
      await notificationService.createNotification(
        {
          MaNgDung: post.MaNgDung,
          TieuDe: tieuDe,
          NoiDung: noiDung,
          LoaiTB: "TIN_NOI_BAT",
          LienKet: `/quan-ly-bai-dang?highlight=${post.MaTTND}`,
          DuLieuThem: {
            MaTTND: post.MaTTND,
            TieuDe: post.TieuDe,
            FeaturedEndDate: post.FeaturedEndDate,
            PhutConLai: post.PhutConLai,
          },
        },
        io
      );

      console.log(`🔔 [Featured Reminder] Đã gửi thông báo nhắc gia hạn tới Môi giới #${post.MaNgDung} (Tin #${post.MaTTND})`);
    }
  } catch (error) {
    console.error("[Featured Reminder] Lỗi kiểm tra tin nổi bật sắp hết hạn:", error.message);
  }
};

/**
 * Khởi chạy cron job định kỳ (mỗi 10 phút kiểm tra 1 lần)
 * @param {object} io 
 */
const startFeaturedExpirationCron = (io = null) => {
  // Chạy ngay lần đầu sau 10 giây khi server khởi động
  setTimeout(() => {
    checkAndNotifyExpiringFeaturedPosts(io);
  }, 10000);

  // Sau đó lặp lại mỗi 10 phút
  const INTERVAL_MS = 10 * 60 * 1000;
  setInterval(() => {
    checkAndNotifyExpiringFeaturedPosts(io);
  }, INTERVAL_MS);

  console.log("⏰ Đã khởi động dịch vụ tự động nhắc gia hạn tin nổi bật (kiểm tra mỗi 10 phút)");
};

module.exports = {
  checkAndNotifyExpiringFeaturedPosts,
  startFeaturedExpirationCron,
};
