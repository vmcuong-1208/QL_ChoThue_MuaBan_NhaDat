import React, { useState } from "react";
import "../styles/LoginRegister.css";

const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? "Đăng nhập" : "Đăng ký"}</h2>
        <form>
          {/* Nếu là Đăng ký, hiển thị 2 ô riêng biệt */}
          {!isLogin && (
            <>
              <input type="text" placeholder="Số điện thoại" required />
              <input type="email" placeholder="Email" required />
            </>
          )}
          {/* Ô nhập số điện thoại hoặc email khi đăng nhập */}
          {isLogin && <input type="text" placeholder="Số điện thoại hoặc Email" required />}
          <input type="password" placeholder="Mật khẩu" required />
          <button type="submit">{isLogin ? "Đăng nhập" : "Đăng ký"}</button>
        </form>
        <p onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
        </p>
      </div>
    </div>
  );
};

export default LoginRegister;
