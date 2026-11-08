import { useState, useEffect } from "react";
import axiosClient from "../../config/axiosClient";
import { formatVND } from "../../components/shop/SanPhamShared";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const QuanLyChiTra = () => {
  const [danhSachShop, setDanhSachShop] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShops, setSelectedShops] = useState([]); // Mảng chứa gh_ma được tick chọn
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const fetchDuLieu = async () => {
    try {
      const res = await axiosClient.get("/admin/dong-tien/vi-shop");
      setDanhSachShop(res.data);
      setSelectedShops(res.data.map((shop) => shop.gh_ma)); // Mặc định tick chọn tất cả
    } catch (err) {
      showToast("Lỗi tải dữ liệu ví Shop", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuLieu();
  }, []);

  const handleTickAll = (e) => {
    if (e.target.checked) setSelectedShops(danhSachShop.map((s) => s.gh_ma));
    else setSelectedShops([]);
  };

  const handleTickOne = (gh_ma) => {
    setSelectedShops((prev) =>
      prev.includes(gh_ma)
        ? prev.filter((id) => id !== gh_ma)
        : [...prev, gh_ma],
    );
  };

  // 1. Hàm xuất file CSV (Excel)
  const handleExportExcel = () => {
    const dataToExport = danhSachShop.filter((s) =>
      selectedShops.includes(s.gh_ma),
    );
    if (dataToExport.length === 0)
      return showToast("Vui lòng chọn ít nhất 1 Shop!", "error");

    let csvContent =
      "Mã Shop,Tên Shop,Số Tài Khoản,Ngân Hàng,Số Tiền,Nội Dung\n";
    dataToExport.forEach((shop) => {
      csvContent += `${shop.gh_ma},${shop.ten_shop},${shop.so_tai_khoan},${shop.ten_ngan_hang},${Math.round(shop.so_du)},Thanh toan tien shop ${shop.gh_ma}\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `DanhSachChiTra_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Đã tải file Excel thành công!", "success");
  };

  // 2. Hàm xác nhận đã chuyển khoản xong
  const handleXacNhanDaTra = async () => {
    if (selectedShops.length === 0)
      return showToast("Vui lòng chọn ít nhất 1 Shop!", "error");
    if (
      !window.confirm(
        "Xác nhận bạn ĐÃ CHUYỂN KHOẢN cho các Shop được chọn? Số dư của họ sẽ bị trừ về 0.",
      )
    )
      return;

    try {
      await axiosClient.post("/admin/dong-tien/xac-nhan-da-tra", {
        danhSachGhMa: selectedShops,
      });
      showToast(
        `Đã xác nhận chi trả cho ${selectedShops.length} Shop!`,
        "success",
      );
      fetchDuLieu(); // Tải lại danh sách
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi khi xác nhận", "error");
    }
  };

  if (loading)
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Quản Lý Dòng Tiền & Chi Trả
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Duyệt chuyển tiền từ tài khoản Sàn cho các Shop.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined">download</span>
            Xuất File Chuyển Khoản
          </button>
          <button
            onClick={handleXacNhanDaTra}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined">check_circle</span>
            Xác Nhận Đã Trả
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 w-12 text-center">
                <input
                  type="checkbox"
                  onChange={handleTickAll}
                  checked={
                    selectedShops.length === danhSachShop.length &&
                    danhSachShop.length > 0
                  }
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-3 font-semibold text-gray-600">Mã Shop</th>
              <th className="p-3 font-semibold text-gray-600">Tên Shop</th>
              <th className="p-3 font-semibold text-gray-600">
                Số Tài Khoản Nhận
              </th>
              <th className="p-3 font-semibold text-gray-600 text-right">
                Số Dư Khả Dụng
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {danhSachShop.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  Không có Shop nào cần chi trả.
                </td>
              </tr>
            ) : (
              danhSachShop.map((shop) => (
                <tr
                  key={shop.gh_ma}
                  className={
                    selectedShops.includes(shop.gh_ma) ? "bg-blue-50/30" : ""
                  }
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedShops.includes(shop.gh_ma)}
                      onChange={() => handleTickOne(shop.gh_ma)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 font-medium">{shop.gh_ma}</td>
                  <td className="p-3">{shop.ten_shop}</td>
                  <td className="p-3">
                    {shop.so_tai_khoan} ({shop.ten_ngan_hang})
                  </td>
                  <td className="p-3 text-right font-bold text-green-600">
                    {formatVND(shop.so_du)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLyChiTra;
