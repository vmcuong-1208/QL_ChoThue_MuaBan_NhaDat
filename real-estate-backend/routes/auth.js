const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

// Đăng ký tài khoản
router.post('/register', async (req, res) => {
    const { TenDangNhap, Email, MatKhau, SDT } = req.body;

    // Kiểm tra đầu vào
    if (!TenDangNhap || !Email || !MatKhau || !SDT) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    try {
        // Kiểm tra email hoặc SDT đã tồn tại chưa
        const checkUser = "SELECT * FROM NGUOIDUNG WHERE Email = ? OR SDT = ?";
        db.query(checkUser, [Email, SDT], async (err, results) => {
            if (err) return res.status(500).json({ message: "Lỗi server", error: err });

            if (results.length > 0) {
                return res.status(400).json({ message: "Email hoặc số điện thoại đã tồn tại!" });
            }

            // Hash mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(MatKhau, salt);

            // Thêm user vào database
            const sql = `INSERT INTO NGUOIDUNG (TenDangNhap, Email, MatKhau, SDT) VALUES (?, ?, ?, ?)`;
            db.query(sql, [TenDangNhap, Email, hashedPassword, SDT], (err, result) => {
                if (err) return res.status(500).json({ message: "Lỗi khi tạo tài khoản", error: err });

                res.status(201).json({ message: "Đăng ký thành công!" });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
});

module.exports = router;

// Đăng nhập người dùng
router.post("/login", async (req, res) => {
    const { Email, MatKhau } = req.body;

    if (!Email || !MatKhau) {
        return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu!" });
    }

    try {
        // Kiểm tra email có tồn tại không
        const [user] = await db.promise().query("SELECT * FROM NGUOIDUNG WHERE Email = ?", [Email]);
        if (user.length === 0) {
            return res.status(401).json({ message: "Tài khoản không tồn tại!" });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(MatKhau, user[0].MatKhau);
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu không đúng!" });
        }

        // Tạo JWT token
        const token = jwt.sign({ MaNgDung: user[0].MaNgDung, Email }, "SECRET_KEY", { expiresIn: "1h" });

        res.status(200).json({ message: "Đăng nhập thành công!", token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
});

// Cập nhật thông tin cá nhân
router.put('/update', (req, res) => {
    const { MaNgDung, HoTen, DiaChi, AnhDaiDien, MoTaBanThan } = req.body;

    if (!MaNgDung) {
        return res.status(400).json({ message: "Thiếu ID người dùng" });
    }

    const sql = `UPDATE NGUOIDUNG SET 
                    HoTen = ?, 
                    DiaChi = ?, 
                    AnhDaiDien = ?, 
                    MoTaBanThan = ?, 
                    NgayCapNhat = NOW()
                 WHERE MaNgDung = ?`;

    db.query(sql, [HoTen, DiaChi, AnhDaiDien, MoTaBanThan, MaNgDung], (err, result) => {
        if (err) return res.status(500).json({ message: "Lỗi khi cập nhật", error: err });

        res.json({ message: "Cập nhật thành công!" });
    });
});