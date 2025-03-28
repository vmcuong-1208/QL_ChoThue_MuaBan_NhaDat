import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react"; // Thêm icon (cần cài thư viện)

const FloatingButton = () => {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="floating-button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link to="/lien-he" className="button">
        <HelpCircle size={28} />
      </Link>
      {hover && <span className="tooltip">Hỗ trợ</span>}
    </div>
  );
};

export default FloatingButton;
