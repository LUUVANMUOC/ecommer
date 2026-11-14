// frontend/src/pages/common/HopThuThongBao.jsx
import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Megaphone,
  Percent,
  TicketPercent,
  Truck,
  X,
} from "lucide-react";
import { NotificationContext } from "../../contexts/NotificationContext";
import thongBaoService from "../../services/thongbao/thongBaoService";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(
    /\/api\/?$/,
    "",
  );

const ICON_THEO_LOAI = {
  PHI_CHIET_KHAU: { Icon: Percent, mau: "text-amber-600", nen: "bg-amber-50" },
  CUOC_VAN_CHUYEN: { Icon: Truck, mau: "text-sky-600", nen: "bg-sky-50" },
  MA_GIAM_GIA: {
    Icon: TicketPercent,
    mau: "text-emerald-600",
    nen: "bg-emerald-50",
  },
  HE_THONG: { Icon: Megaphone, mau: "text-indigo-600", nen: "bg-indigo-50" },
};

const TABS = [
  { value: "", label: "Tất cả" },
  { value: "chua_doc", label: "Chưa đọc" },
  { value: "da_doc", label: "Đã đọc" },
];

const NGUON = [
  { value: "", label: "Tất cả nguồn" },
  { value: "SAN", label: "Sàn" },
  { value: "DVVC", label: "Đơn vị vận chuyển" },
  { value: "SHOP", label: "Shop" },
];

const docTep = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const urlTep = (duongdan) => {
  if (!duongdan) return "";
  return duongdan.startsWith("http") ? duongdan : `${BACKEND_URL}${duongdan}`;
};

const fmtThoiGian = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", { hour12: false });
};

const HopThuThongBao = () => {
  const navigate = useNavigate();
  const { nguoiNhan, unreadCount, phienBan, danhDauDaDoc, danhDauTatCa } =
    useContext(NotificationContext);

  const [trangThai, setTrangThai] = useState("");
  const [nguon, setNguon] = useState("");
  const [tuKhoa, setTuKhoa] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [duLieu, setDuLieu] = useState({ rows: [], total: 0, total_pages: 1 });
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [dangXem, setDangXem] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setQ(tuKhoa.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [tuKhoa]);

  const taiDuLieu = useCallback(async () => {
    if (!nguoiNhan) {
      setDangTai(false);
      setDuLieu({ rows: [], total: 0, total_pages: 1 });
      return;
    }
    setDangTai(true);
    setLoi("");
    try {
      const res = await thongBaoService.getHopThu(
        nguoiNhan.loai,
        nguoiNhan.ma,
        {
          page,
          limit: 10,
          trang_thai: trangThai || undefined,
          nguon: nguon || undefined,
          q: q || undefined,
        },
      );
      setDuLieu({
        rows: res.data?.rows || [],
        total: res.data?.total || 0,
        total_pages: res.data?.total_pages || 1,
      });
    } catch (error) {
      setLoi(
        error.response?.data?.message || "Không tải được danh sách thông báo.",
      );
    } finally {
      setDangTai(false);
    }
  }, [nguoiNhan, page, trangThai, nguon, q]);

  useEffect(() => {
    taiDuLieu();
  }, [taiDuLieu, phienBan]);

  const moChiTiet = async (thongBao) => {
    setDangXem(thongBao);
    if (!thongBao.nn_dadoc) {
      try {
        await danhDauDaDoc(thongBao.tb_ma);
        setDangXem((cu) => (cu ? { ...cu, nn_dadoc: true } : cu));
      } catch (error) {
        // vẫn xem được nội dung
      }
    }
  };

  const docTatCa = async () => {
    try {
      // danhDauTatCa tăng phienBan → effect phía trên tự tải lại danh sách
      await danhDauTatCa();
    } catch (error) {
      setLoi("Không đánh dấu được tất cả là đã đọc.");
    }
  };

  // Tài khoản không có hộp thư (shipper, quản lý kho...)
  if (!nguoiNhan) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Tài khoản hiện tại chưa được hỗ trợ hộp thư thông báo.
      </div>
    );
  }

  const kieuDangXem = dangXem
    ? ICON_THEO_LOAI[dangXem.tb_loai] || ICON_THEO_LOAI.HE_THONG
    : null;

  return (
    <div className="space-y-4">
      {/* Tiêu đề */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Hộp thư thông báo
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0
              ? `Bạn có ${unreadCount} thông báo chưa đọc.`
              : "Tất cả thông báo đã được đọc."}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={docTatCa}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-sky-700 hover:border-sky-300"
          >
            <CheckCheck className="h-4 w-4" />
            Đọc tất cả
          </button>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex rounded-lg bg-slate-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setTrangThai(tab.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                trangThai === tab.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.value === "chua_doc" && unreadCount > 0
                ? ` (${unreadCount})`
                : ""}
            </button>
          ))}
        </div>

        <select
          value={nguon}
          onChange={(e) => {
            setNguon(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700"
        >
          {NGUON.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <input
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          placeholder="Tìm theo tiêu đề, nội dung..."
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-400"
        />

        <span className="text-xs text-slate-400">{duLieu.total} thông báo</span>
      </div>

      {loi && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {loi}
        </p>
      )}

      {/* Danh sách */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {dangTai ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Đang tải thông báo...
          </p>
        ) : duLieu.rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            Không có thông báo nào.
          </p>
        ) : (
          duLieu.rows.map((thongBao) => {
            const kieu =
              ICON_THEO_LOAI[thongBao.tb_loai] || ICON_THEO_LOAI.HE_THONG;
            const { Icon } = kieu;
            const tep = docTep(thongBao.tb_tepdinhlieu);

            return (
              <button
                key={thongBao.tb_ma}
                type="button"
                onClick={() => moChiTiet(thongBao)}
                className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${
                  thongBao.nn_dadoc ? "" : "bg-sky-50/40"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ${kieu.nen} ${kieu.mau}`}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span
                      className={`line-clamp-1 flex-1 text-sm ${
                        thongBao.nn_dadoc
                          ? "font-medium text-slate-700"
                          : "font-semibold text-slate-900"
                      }`}
                    >
                      {thongBao.tb_tieude}
                    </span>
                    {!thongBao.nn_dadoc && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    )}
                  </span>

                  <span className="mt-0.5 line-clamp-1 block text-xs text-slate-500">
                    {thongBao.tb_noidung}
                  </span>

                  <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-500">
                      {thongBao.nguon_ten || "Hệ thống"}
                    </span>
                    <span>•</span>
                    <span>{fmtThoiGian(thongBao.tb_thoidiemtao)}</span>
                    {tep.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {tep.length} tệp
                        </span>
                      </>
                    )}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Phân trang */}
      {duLieu.total_pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </button>
          <span className="text-xs text-slate-500">
            Trang {page}/{duLieu.total_pages}
          </span>
          <button
            type="button"
            disabled={page >= duLieu.total_pages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40"
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal chi tiết */}
      {dangXem && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          onClick={() => setDangXem(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${kieuDangXem.nen} ${kieuDangXem.mau}`}
              >
                <kieuDangXem.Icon className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900">
                  {dangXem.tb_tieude}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Từ <strong>{dangXem.nguon_ten || "Hệ thống"}</strong> •{" "}
                  {fmtThoiGian(dangXem.tb_thoidiemtao)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDangXem(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {dangXem.tb_noidung}
            </div>

            {docTep(dangXem.tb_tepdinhlieu).length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tệp đính kèm
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {docTep(dangXem.tb_tepdinhlieu).map((tep, index) =>
                    tep.loai === "image" ? (
                      <a
                        key={index}
                        href={urlTep(tep.duongdan)}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-lg border border-slate-200"
                      >
                        <img
                          src={urlTep(tep.duongdan)}
                          alt={tep.ten}
                          className="h-40 w-full object-cover transition group-hover:opacity-90"
                        />
                        <span className="block truncate px-2 py-1 text-[11px] text-slate-500">
                          {tep.ten}
                        </span>
                      </a>
                    ) : (
                      <a
                        key={index}
                        href={urlTep(tep.duongdan)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 hover:border-sky-300"
                      >
                        <FileText className="h-5 w-5 shrink-0 text-rose-500" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-slate-700">
                            {tep.ten}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {Math.max(
                              1,
                              Math.round((tep.kichthuoc || 0) / 1024),
                            )}{" "}
                            KB
                          </span>
                        </span>
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </a>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              {dangXem.tb_link && (
                <button
                  type="button"
                  onClick={() => {
                    const link = dangXem.tb_link;
                    setDangXem(null);
                    navigate(link);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Đi tới
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setDangXem(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HopThuThongBao;
