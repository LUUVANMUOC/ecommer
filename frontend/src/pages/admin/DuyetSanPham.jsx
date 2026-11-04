// src/pages/admin/DuyetSanPham.jsx
import { useState, useEffect } from "react";
import trangThaiChiTietSanPhamService from "../../services/gianhang/trangThaiChiTietSanPhamService";
import ToastNotification from "../../components/common/Crud/ToastNotification";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const formatVND = (n) =>
  n || n === 0 ? `${Number(n).toLocaleString("vi-VN")} đ` : "Chưa có giá";
const imgUrl = (link) => `${BACKEND_URL}${link}`;

const DuyetSanPham = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal Xử lý
  const [modalAction, setModalAction] = useState({
    isOpen: false,
    type: "approve", // "approve" | "suspend"
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
      const res = await trangThaiChiTietSanPhamService.getChoDuyet();
      setData(res.data);
    } catch (error) {
      showToast("Lỗi khi tải danh sách chờ duyệt", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item, type) => {
    setModalAction({
      isOpen: true,
      type,
      ctsp_ma: item.ctsp_ma,
      ctsp_ten: item.ctsp_ten,
      phanhoi:
        type === "approve"
          ? "Đã kiểm duyệt, sản phẩm đạt tiêu chuẩn và được phép bán."
          : "Thông tin sản phẩm chưa đầy đủ hoặc vi phạm chính sách sàn.",
    });
  };

  const handleConfirmAction = async () => {
    if (!modalAction.phanhoi.trim()) return alert("Vui lòng nhập phản hồi!");

    setProcessing(true);
    try {
      if (modalAction.type === "approve") {
        await trangThaiChiTietSanPhamService.approve(
          modalAction.ctsp_ma,
          modalAction.phanhoi,
        );
        showToast(`Đã duyệt phân loại "${modalAction.ctsp_ten}"`);
      } else {
        await trangThaiChiTietSanPhamService.suspend(
          modalAction.ctsp_ma,
          modalAction.phanhoi,
        );
        showToast(`Đã đình chỉ phân loại "${modalAction.ctsp_ten}"`);
      }
      setModalAction({ isOpen: false });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Đã xảy ra lỗi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14201C]">Duyệt Sản Phẩm</h1>
          <p className="text-sm text-[#7A857F]">
            Xem xét và phê duyệt các phân loại sản phẩm do người bán gửi lên.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1 rounded-lg border border-[#D9CFC2] bg-white px-3.5 py-2 text-sm font-medium text-[#3D4A44] hover:bg-[#F7F5F0] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>{" "}
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-[#7A857F]">
          Đang tải dữ liệu...
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2DED3] bg-[#FBFAF7] py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#C9C3B5]">
            inbox
          </span>
          <p className="mt-2 text-[#5B6661]">
            Tuyệt vời! Không có sản phẩm nào đang chờ duyệt.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((item) => (
            <div
              key={item.ctsp_ma}
              className="flex flex-col lg:flex-row overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* CỘT TRÁI: HÌNH ẢNH */}
              <div className="w-full lg:w-[320px] shrink-0 bg-[#FBFAF7] p-4 flex flex-col border-b lg:border-b-0 lg:border-r border-[#EFEBE2]">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#E2DED3] bg-white">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={imgUrl(item.images[0].hasp_link)}
                      alt={item.ctsp_ten}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-[#C9C3B5]">
                      <span className="material-symbols-outlined text-[40px]">
                        image
                      </span>
                      <span className="text-sm mt-1">Chưa có ảnh</span>
                    </div>
                  )}
                </div>
                {item.images && item.images.length > 1 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {item.images.slice(1).map((img, idx) => (
                      <img
                        key={idx}
                        src={imgUrl(img.hasp_link)}
                        className="h-14 w-14 shrink-0 rounded-md border object-cover"
                        alt="thumb"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: THÔNG TIN */}
              <div className="flex-1 flex flex-col p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block rounded bg-yellow-100 px-2 py-0.5 text-[11px] font-bold text-yellow-800 uppercase tracking-wide mb-1">
                      Chờ duyệt
                    </span>
                    <h2 className="text-xl font-bold text-[#14201C]">
                      {item.ctsp_ten}
                    </h2>
                    <p className="text-sm font-medium text-[#7A857F] mt-0.5">
                      Sản phẩm:{" "}
                      <span className="text-[#14201C]">{item.sp_ten}</span> (
                      {item.sp_ma})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-semibold text-[#7A857F] uppercase">
                      Mã CTSP
                    </p>
                    <p className="font-mono text-sm font-bold text-[#14201C]">
                      {item.ctsp_ma}
                    </p>
                  </div>
                </div>

                {/* BLOCK GIÁ */}
                <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl border border-[#F2A93B]/30 bg-[#FDF3E1]/40 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[#8A5A0B]">
                      Khách trả
                    </p>
                    <p className="text-lg font-bold text-[#B42318]">
                      {formatVND(item.ctsp_gianban)}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-[#F2A93B]/30 hidden sm:block" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[#7A857F]">
                      Shop nhận
                    </p>
                    <p className="text-base font-bold text-[#14201C]">
                      {formatVND(item.gb_gia)}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-[#F2A93B]/30 hidden sm:block" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[#7A857F]">
                      Phí sàn
                    </p>
                    <p className="text-base font-bold text-[#3D4A44]">
                      {formatVND(
                        Number(item.ctsp_gianban || 0) -
                          Number(item.gb_gia || 0),
                      )}
                    </p>
                  </div>
                </div>

                {/* THÔNG SỐ & THUỘC TÍNH */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-b border-[#EFEBE2] pb-4">
                  <div>
                    <span className="text-[#7A857F] block text-xs">
                      Tồn kho
                    </span>
                    <b className="text-[#14201C]">{item.ctsp_soluongton}</b>
                  </div>
                  <div>
                    <span className="text-[#7A857F] block text-xs">
                      Ngành hàng
                    </span>
                    <b className="text-[#14201C] truncate" title={item.nh_ten}>
                      {item.nh_ten}
                    </b>
                  </div>
                  <div>
                    <span className="text-[#7A857F] block text-xs">
                      Kích thước
                    </span>
                    <b className="text-[#14201C]">
                      {item.ctsp_chieudai} x {item.ctsp_chieurong} cm
                    </b>
                  </div>
                  <div>
                    <span className="text-[#7A857F] block text-xs">
                      Khối lượng
                    </span>
                    <b className="text-[#14201C]">{item.ctsp_khoiluong} kg</b>
                  </div>
                </div>

                {item.thuoctinh && item.thuoctinh.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.thuoctinh.map((tt, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-[#F1EEE6] px-2 py-1 text-xs text-[#3D4A44]"
                      >
                        <span className="text-[#7A857F]">{tt.ttsp_ten}:</span>{" "}
                        <b>
                          {tt.gttt_giatridinhtinh || tt.gttt_giatridinhluong}
                        </b>
                      </span>
                    ))}
                  </div>
                )}

                {/* MÔ TẢ & YÊU CẦU */}
                <div className="mt-4 space-y-2 flex-1">
                  <div className="text-sm">
                    <span className="font-semibold text-[#14201C]">
                      Mô tả phân loại:
                    </span>{" "}
                    <span className="text-[#5B6661]">
                      {item.ctsp_mota || "Không có"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-[#14201C]">
                      Mô tả chung:
                    </span>{" "}
                    <span className="text-[#5B6661] line-clamp-2">
                      {item.sp_mota_chung || "Không có"}
                    </span>
                  </div>
                </div>

                {/* YÊU CẦU TỪ SHOP */}
                <div className="mt-4 rounded-lg border border-[#E2DED3] bg-[#FBFAF7] p-3 text-sm">
                  <p className="font-semibold text-[#8A5A0B] text-xs uppercase mb-1">
                    Lời nhắn từ Shop ({item.gh_ma})
                  </p>
                  <p className="text-[#3D4A44] italic">
                    "{item.ctttsp_yeucau || "Không có ghi chú"}"
                  </p>
                </div>

                {/* NÚT HÀNH ĐỘNG */}
                <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-[#EFEBE2]">
                  <button
                    onClick={() => handleOpenModal(item, "suspend")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0C4AE] bg-white px-5 py-2.5 text-sm font-semibold text-[#B42318] hover:bg-[#FBEDE4] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      block
                    </span>{" "}
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleOpenModal(item, "approve")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2F7A5F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#25624c] transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      check_circle
                    </span>{" "}
                    Phê duyệt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL XỬ LÝ DUYỆT / ĐÌNH CHỈ */}
      {modalAction.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div
              className={`px-5 py-4 border-b ${modalAction.type === "approve" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
            >
              <h3
                className={`text-lg font-bold flex items-center gap-2 ${modalAction.type === "approve" ? "text-green-800" : "text-red-800"}`}
              >
                <span className="material-symbols-outlined">
                  {modalAction.type === "approve" ? "check_circle" : "warning"}
                </span>
                {modalAction.type === "approve"
                  ? "Phê duyệt sản phẩm"
                  : "Từ chối / Đình chỉ"}
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#5B6661]">
                Phân loại:{" "}
                <b className="text-[#14201C]">{modalAction.ctsp_ten}</b>
              </p>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-[#3D4A44]">
                  Phản hồi gửi cho Shop <span className="text-red-500">*</span>
                </span>
                <textarea
                  rows="3"
                  value={modalAction.phanhoi}
                  onChange={(e) =>
                    setModalAction({ ...modalAction, phanhoi: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D9D4C7] bg-[#FBFAF7] px-3 py-2 text-sm text-[#14201C] focus:border-[#F2A93B] focus:outline-none focus:ring-1 focus:ring-[#F2A93B]"
                  placeholder="Nhập lý do hoặc phản hồi..."
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
                onClick={handleConfirmAction}
                disabled={processing}
                className={`rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50 ${
                  modalAction.type === "approve"
                    ? "bg-[#2F7A5F] hover:bg-[#25624c]"
                    : "bg-[#B42318] hover:bg-[#901c13]"
                }`}
              >
                {processing ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification toast={toast} />
    </div>
  );
};

export default DuyetSanPham;
