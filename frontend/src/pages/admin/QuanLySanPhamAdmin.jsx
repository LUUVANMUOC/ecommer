// src/pages/admin/QuanLySanPhamAdmin.jsx
import { useState, useEffect } from "react";
import trangThaiChiTietSanPhamService from "../../services/gianhang/trangThaiChiTietSanPhamService";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const imgUrl = (link) => (link ? `${BACKEND_URL}${link}` : "");
const formatVND = (n) =>
  n || n === 0 ? `${Number(n).toLocaleString("vi-VN")} đ` : "—";

const STATUS_CONFIG = {
  TTCTSP0001: {
    label: "Chờ duyệt",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  TTCTSP0002: {
    label: "Đang bán",
    badge: "bg-green-100 text-green-800 border-green-200",
  },
  TTCTSP0003: {
    label: "Bị đình chỉ",
    badge: "bg-red-100 text-red-800 border-red-200",
  },
  DEFAULT: {
    label: "Chưa gửi duyệt",
    badge: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

const QuanLySanPhamAdmin = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Đình chỉ
  const [modalAction, setModalAction] = useState({
    isOpen: false,
    ctsp_ma: null,
    ctsp_ten: "",
    phanhoi: "",
  });
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await trangThaiChiTietSanPhamService.getAllSanPham();
      setData(res.data);
    } catch (error) {
      showToast("Lỗi khi tải danh sách sản phẩm", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenSuspend = (item) => {
    setModalAction({
      isOpen: true,
      ctsp_ma: item.ctsp_ma,
      ctsp_ten: item.ctsp_ten,
      phanhoi: "Sản phẩm vi phạm chính sách của sàn.",
    });
  };

  const handleConfirmSuspend = async () => {
    if (!modalAction.phanhoi.trim())
      return alert("Vui lòng nhập lý do đình chỉ!");

    setProcessing(true);
    try {
      await trangThaiChiTietSanPhamService.suspend(
        modalAction.ctsp_ma,
        modalAction.phanhoi,
      );
      showToast(`Đã đình chỉ sản phẩm "${modalAction.ctsp_ten}"`);
      setModalAction({ isOpen: false });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Đã xảy ra lỗi");
    } finally {
      setProcessing(false);
    }
  };

  // Lọc theo từ khóa
  const filteredData = data.filter(
    (item) =>
      item.ctsp_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sp_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.gh_ten.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14201C]">
            Quản lý Sản phẩm Toàn sàn
          </h1>
          <p className="text-sm text-[#7A857F]">
            Xem và đình chỉ bất kỳ sản phẩm nào đang lưu hành trên hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#7A857F]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm tên SP, shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 rounded-lg border border-[#D9CFC2] bg-white py-2 pl-9 pr-3 text-sm focus:border-[#F2A93B] focus:outline-none"
            />
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1 rounded-lg bg-[#14201C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E3A34]"
          >
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>{" "}
            Làm mới
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#3D4A44]">
            <thead className="bg-[#FBFAF7] text-xs uppercase text-[#7A857F] border-b border-[#E2DED3]">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Sản phẩm / Phân loại
                </th>
                <th className="px-5 py-4 font-semibold">Gian hàng</th>
                <th className="px-5 py-4 font-semibold">Giá khách trả</th>
                <th className="px-5 py-4 font-semibold">Tồn kho</th>
                <th className="px-5 py-4 font-semibold">Trạng thái</th>
                <th className="px-5 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEBE2]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#7A857F]">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#7A857F]">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const statusCfg =
                    STATUS_CONFIG[item.ttctsp_ma] || STATUS_CONFIG.DEFAULT;
                  const isSuspended = item.ttctsp_ma === "TTCTSP0003";

                  return (
                    <tr
                      key={item.ctsp_ma}
                      className="hover:bg-[#FBFAF7]/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 rounded-lg border border-[#E2DED3] bg-white overflow-hidden">
                            {item.main_image ? (
                              <img
                                src={imgUrl(item.main_image)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center material-symbols-outlined text-[#C9C3B5]">
                                image
                              </span>
                            )}
                          </div>
                          <div>
                            <p
                              className="font-semibold text-[#14201C] line-clamp-1"
                              title={item.sp_ten}
                            >
                              {item.sp_ten}
                            </p>
                            <p className="text-xs text-[#7A857F] line-clamp-1">
                              {item.ctsp_ten} ({item.ctsp_ma})
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#14201C]">
                          {item.gh_ten}
                        </p>
                        <p className="text-xs font-mono text-[#7A857F]">
                          {item.gh_ma}
                        </p>
                      </td>
                      <td className="px-5 py-3 font-semibold text-[#B42318]">
                        {formatVND(item.ctsp_gianban)}
                      </td>
                      <td className="px-5 py-3">{item.ctsp_soluongton}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusCfg.badge}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleOpenSuspend(item)}
                          disabled={isSuspended}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            isSuspended
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            block
                          </span>
                          {isSuspended ? "Đã đình chỉ" : "Đình chỉ"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ĐÌNH CHỈ */}
      {modalAction.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-red-50 px-5 py-4 border-b border-red-100">
              <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                Đình chỉ Sản phẩm
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#5B6661]">
                Bạn đang thao tác đình chỉ phân loại:{" "}
                <b className="text-[#14201C]">{modalAction.ctsp_ten}</b>
              </p>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-[#3D4A44]">
                  Lý do đình chỉ (Sẽ gửi cho Shop){" "}
                  <span className="text-red-500">*</span>
                </span>
                <textarea
                  rows="3"
                  value={modalAction.phanhoi}
                  onChange={(e) =>
                    setModalAction({ ...modalAction, phanhoi: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D9D4C7] bg-[#FBFAF7] px-3 py-2 text-sm text-[#14201C] focus:border-[#F2A93B] focus:outline-none focus:ring-1 focus:ring-[#F2A93B]"
                  placeholder="Nhập lý do vi phạm..."
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#EFEBE2] bg-[#FBFAF7] p-4">
              <button
                onClick={() => setModalAction({ isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-[#5B6661] hover:text-[#14201C]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={processing}
                className="rounded-lg bg-[#B42318] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#901c13] disabled:opacity-50"
              >
                {processing ? "Đang xử lý..." : "Xác nhận Đình chỉ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default QuanLySanPhamAdmin;
