import React from "react";
import { Link } from "react-router-dom";
import "../styles/global.css";
const Navbar = () => {
  return (
    <nav className="navbar">
      <h1>🏡 Thuận Cường</h1>
      <div>
        <Link to="/">Trang Chủ</Link>
        <Link to="/bat-dong-san">Bất Động Sản</Link>
        <Link to="/lien-he">Liên Hệ</Link>
        <Link to="/ho-so">Hồ Sơ</Link>
        <Link to="/auth">Đăng Nhập | Đăng Ký</Link>
      </div>
    </nav>
  );
};

export default Navbar;
