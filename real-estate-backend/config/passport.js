const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const db = require("./db")

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile)

        // Kiểm tra user đã tồn tại chưa
        const [existingUsers] = await db
          .promise()
          .query("SELECT * FROM NGUOIDUNG WHERE Email = ? OR GoogleID = ?", [profile.emails[0].value, profile.id])

        if (existingUsers.length > 0) {
          // User đã tồn tại, chỉ cập nhật GoogleID nếu chưa có
          const user = existingUsers[0]

          if (!user.GoogleID) {
            await db
              .promise()
              .query("UPDATE NGUOIDUNG SET GoogleID = ? WHERE MaNgDung = ?", [profile.id, user.MaNgDung])

            // Lấy thông tin user đã cập nhật
            const [updatedUsers] = await db
              .promise()
              .query("SELECT * FROM NGUOIDUNG WHERE MaNgDung = ?", [user.MaNgDung])
            return done(null, updatedUsers[0])
          }

          return done(null, user)
        } else {
          // Tạo user mới - chỉ lưu thông tin cơ bản, không lưu avatar
          const [result] = await db.promise().query(
            `INSERT INTO NGUOIDUNG (Email, HoTen, GoogleID, LoaiTaiKhoan) 
             VALUES (?, ?, ?, 'thường')`,
            [profile.emails[0].value, profile.displayName, profile.id],
          )

          // Lấy user vừa tạo
          const [newUsers] = await db.promise().query("SELECT * FROM NGUOIDUNG WHERE MaNgDung = ?", [result.insertId])

          return done(null, newUsers[0])
        }
      } catch (error) {
        console.error("Google Strategy Error:", error)
        return done(error, null)
      }
    },
  ),
)

passport.serializeUser((user, done) => {
  done(null, user.MaNgDung)
})

passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.promise().query("SELECT * FROM NGUOIDUNG WHERE MaNgDung = ?", [id])
    done(null, users[0])
  } catch (error) {
    done(error, null)
  }
})

module.exports = passport
