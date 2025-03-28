import React from "react";
import "../styles/PropertyList.css";


const properties = [
  { id: 1, title: "Nhà phố Quận 1", price: "5 tỷ", image: "https://i.ex-cdn.com/vietnamfinance.vn/files/f1/news/bichnga/2020/11/17/%C4%90%C3%B4ng%20TPHCM-1.jpg" },
  { id: 2, title: "Biệt thự Quận 1", price: "2000 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 3, title: "Biệt thự Quận 2", price: "100 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 4, title: "Biệt thự Quận 3", price: "40 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 5, title: "Biệt thự Quận 4", price: "30 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 6, title: "Biệt thự Quận 5", price: "110 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 7, title: "Biệt thự Quận 10", price: "99 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 8, title: "Căn hộ chung cư Quận 2", price: "3 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 9, title: "Căn hộ cao cấp Quận 7", price: "6 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 10, title: "Shophouse Quận 9", price: "15 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 11, title: "Nhà phố Quận Bình Thạnh", price: "7 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 12, title: "Villa Quận 2", price: "120 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 13, title: "Nhà phố Quận Phú Nhuận", price: "10 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 14, title: "Căn hộ mini Quận 4", price: "2 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 15, title: "Penthouse Quận 1", price: "150 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 16, title: "Căn hộ Duplex Quận 7", price: "20 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 17, title: "Nhà phố Quận Gò Vấp", price: "4 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 18, title: "Nhà vườn Quận 12", price: "25 tỷ", image: "https://static1.cafeland.vn/cafelandnew/hinh-anh/2023/01/17/169/image(1).png" },
  { id: 19, title: "Nhà phố Quận Tân Bình", price: "6 tỷ", image: "https://maisonoffice.vn/wp-content/uploads/2023/05/bat-dong-san-thuong-mai-1.jpg" },
  { id: 20, title: "Căn hộ Studio Quận 3", price: "1.5 tỷ", image: "https://maisonoffice.vn/wp-content/uploads/2023/05/bat-dong-san-thuong-mai-1.jpg" },
];


const PropertyList = () => {
  return (
    <div className="property-list">
      {properties.map((property) => (
        <div key={property.id} className="property-item">
          <img src={property.image} alt={property.title} />
          <h3 className="property-title">{property.title}</h3>
          <p className="property-price">{property.price}</p>
        </div>
      ))}
    </div>
  );
};

export default PropertyList;
