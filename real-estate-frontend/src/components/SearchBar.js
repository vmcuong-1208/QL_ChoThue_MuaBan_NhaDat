import React from "react";
import "../styles/global.css";

const SearchBar = () => {
  return (
    <div className="search-bar">
      <input type="text" placeholder="Tìm kiếm theo khu vực, giá, diện tích..." />
      <button>Tìm kiếm</button>
    </div>
  );
};

export default SearchBar;
