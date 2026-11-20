// frontend/src/pages/admin/SuCoAdmin.jsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import suCoAdminService from "../../services/san/suCoAdminService";
import axiosClient from "../../config/axiosClient";
import { Badge, NhanSla, ngay } from "../../components/suco/SuCoUI";

const TRANG_THAI_LOC = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "TTXLSC01", label: "Chờ tiếp nhận" },
  { value: "TTXLSC02", label: "Đang xem xét" },
  { value: "TTXLSC03", label: "Yêu cầu bổ sung" },
  { value: "TTXLSC04", label: "Đã kết luận" },
  { value: "TTXLSC05", label: "Hoàn tất" },
  { value: "TTXLSC06", label: "Từ chối" },
  { value: "TTXLSC07", label: "Đã hủy" },
];

const TheKpi = ({ nhan, giaTri, mau = "text-gray-800", icon }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">{nhan}</p>
      <span className={`material-symbols-outlined text-xl ${mau}`}>{icon}</span>
    </div>
    <p className={`mt-1 text-2xl font-bold ${mau}`}>{giaTri}</p>
  </div>
);

const SuCoAdmin = () => {
  const [kpi, setKpi] = useState(null);
  const [loai, setLoai] = useState([]);
  const [ds, setDs] = useState([]);
  const [tong, setTong] = useState(0);
  const [trang, setTrang] = useState(1);
  const [loc, setLoc] = useState({ trang_thai: "", lsc_ma: "", q: "" });
  const [chiQuaHan, setChiQuaHan] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");

  const pageSize = 15;

  const taiKpi = useCallback(async () => {
    try {
      const res = await suCoAdminService.getKpi();
      setKpi(res.data);
    } catch (error) {
      // im lặng, danh sách vẫn dùng được
    }
  }, []);

  const taiDanhSach = useCallback(async () => {
    try {
      setDangTai(true);
      setLoi("");
      const res = await suCoAdminService.getDanhSach({
        page: trang,
        page_size: pageSize,
        ...loc,
        qua_han: chiQuaHan ? 1 : "",
      });
      setDs(res.data.danh_sach || []);
      setTong(res.data.tong || 0);
    } catch (error) {
      setLoi(
        error?.response?.data?.message || "Không tải được danh sách sự cố.",
      );
    } finally {
      setDangTai(false);
    }
  }, [trang, loc, chiQuaHan]);

  useEffect(() => {
    axiosClient
      .get("/su-co/loai", { params: { ct_ma: "CT01" } })
      .then((res) => setLoai(res.data || []))
      .catch(() => setLoai([]));
  }, []);

  useEffect(() => {
    taiKpi();
    taiDanhSach();
    const id = setInterval(() => {
      taiKpi();
      taiDanhSach();
    }, 60000);
    return () => clearInterval(id);
  }, [taiKpi, taiDanhSach]);

  const soTrang = Math.max(1, Math.ceil(tong / pageSize));

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Xử lý sự cố</h1>
        <p className="text-sm text-gray-500">
          SLA: kết luận trong 24 giờ.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <TheKpi
          nhan="Chờ tiếp nhận"
          icon="inbox"
          mau="text-amber-600"
          giaTri={kpi?.cho_tiep_nhan ?? 0}
        />
        <TheKpi
          nhan="Đang xem xét"
          icon="search"
          mau="text-blue-600"
          giaTri={kpi?.dang_xem_xet ?? 0}
        />
        <TheKpi
          nhan="Đã kết luận"
          icon="gavel"
          mau="text-indigo-600"
          giaTri={kpi?.da_ket_luan ?? 0}
        />
        <TheKpi
          nhan="Hoàn tất"
          icon="task_alt"
          mau="text-emerald-600"
          giaTri={kpi?.hoan_tat ?? 0}
        />
        <TheKpi
          nhan="Sắp hết hạn"
          icon="timer"
          mau="text-orange-600"
          giaTri={kpi?.sap_han ?? 0}
        />
        <TheKpi
          nhan="Quá hạn kết luận"
          icon="timer_off"
          mau="text-red-600"
          giaTri={kpi?.qua_han_ket_luan ?? 0}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={loc.trang_thai}
            onChange={(e) => {
              setTrang(1);
              setLoc((l) => ({ ...l, trang_thai: e.target.value }));
            }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
          >
            {TRANG_THAI_LOC.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={loc.lsc_ma}
            onChange={(e) => {
              setTrang(1);
              setLoc((l) => ({ ...l, lsc_ma: e.target.value }));
            }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
          >
            <option value="">Mọi loại sự cố</option>
            {loai.map((l) => (
              <option key={l.lsc_ma} value={l.lsc_ma}>
                {l.lsc_ten}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={chiQuaHan}
              onChange={(e) => {
                setTrang(1);
                setChiQuaHan(e.target.checked);
              }}
            />
            Chỉ phiếu quá hạn
          </label>

          <input
            value={loc.q}
            onChange={(e) => {
              setTrang(1);
              setLoc((l) => ({ ...l, q: e.target.value }));
            }}
            placeholder="Tìm mã phiếu / mã đơn / tiêu đề"
            className="flex-1 min-w-[220px] px-3 py-2 border border-gray-200 rounded-xl text-sm"
          />
        </div>
      </div>

      {loi && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {loi}
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-3 py-2">Phiếu</th>
              <th className="px-3 py-2">Đơn</th>
              <th className="px-3 py-2">Loại</th>
              <th className="px-3 py-2">Shop</th>
              <th className="px-3 py-2">Người gửi</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">SLA</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {ds.map((p) => (
              <tr
                key={p.ycxlsc_ma}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="px-3 py-2">
                  <p className="font-semibold text-gray-800">{p.ycxlsc_ten}</p>
                  <p className="text-xs text-gray-500">{p.ycxlsc_ma}</p>
                </td>
                <td className="px-3 py-2 text-gray-700">{p.dts_ma}</td>
                <td className="px-3 py-2 text-gray-700">{p.lsc_ten}</td>
                <td className="px-3 py-2 text-gray-700">{p.gh_ten}</td>
                <td className="px-3 py-2 text-gray-700">
                  {p.ct_ma_denghi} · {p.ycxlsc_ma_nguoi_gui}
                </td>
                <td className="px-3 py-2">
                  <Badge ma={p.ycxlsc_trang_thai} ten={p.ttxlsc_ten} />
                </td>
                <td className="px-3 py-2">
                  <NhanSla phieu={p} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    to={`/admin/su-co/${p.ycxlsc_ma}`}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Xử lý
                  </Link>
                </td>
              </tr>
            ))}
            {!ds.length && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  {dangTai ? "Đang tải..." : "Không có phiếu sự cố nào."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {soTrang > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={trang <= 1}
            onClick={() => setTrang((t) => t - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            {trang}/{soTrang}
          </span>
          <button
            disabled={trang >= soTrang}
            onClick={() => setTrang((t) => t + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default SuCoAdmin;
