// src/pages/shipper/dashboard/LSP01Home.jsx
import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";

const LSP01Home = () => {
  const { user } = useContext(AuthContext);
  // Label động — KHÔNG hardcode "Shipper Lấy Hàng"
  const labelLoai = user?.lshipper_ten || "Shipper";

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <span className="material-symbols-outlined text-4xl">
            inventory_2
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Xin chào {user?.shipper_ten || "Shipper"}!
        </h2>
        <p className="text-gray-500 mb-1">
          Loại: <b className="text-green-600">{labelLoai}</b>
        </p>
        <p className="text-gray-500 mb-6">
          Xem các đơn bạn được phân công và xác nhận lấy hàng.
        </p>
        <Link
          to="/shipper/don-cho-lay"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
        >
          <span className="material-symbols-outlined">inventory</span>
          Xem đơn chờ lấy
        </Link>
      </div>
    </div>
  );
};

export default LSP01Home;
