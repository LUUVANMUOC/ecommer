// src/pages/shipper/dashboard/LSP03Home.jsx
import { useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";

const LSP03Home = () => {
  const { user } = useContext(AuthContext);
  const labelLoai = user?.lshipper_ten || "Shipper";

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <span className="material-symbols-outlined text-4xl">
            delivery_dining
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Xin chào {user?.shipper_ten || "Shipper"}!
        </h2>
        <p className="text-gray-500 mb-1">
          Loại: <b className="text-blue-600">{labelLoai}</b>
        </p>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-start gap-2 text-left">
          <span className="material-symbols-outlined text-[20px] shrink-0">
            construction
          </span>
          <div>
            <p className="font-semibold">Chức năng đang phát triển</p>
            <p className="mt-0.5">
              Chức năng giao hàng đến khách sẽ sớm được cập nhật.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LSP03Home;
