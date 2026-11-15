// frontend/src/pages/suco/SuCoPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import suCoService from "../../services/suco/suCoService";
import {
  Badge,
  ChonTep,
  Khoi,
  NhanSla,
  ganTep,
  layNguoiDung,
  ngay,
  tien,
} from "../../components/suco/SuCoUI";

const TRANG_THAI_LOC = [
  { value: "", label: "Tất cả" },
  { value: "TTXLSC01", label: "Chờ tiếp nhận" },
  { value: "TTXLSC02", label: "Đang xem xét" },
  { value: "TTXLSC03", label: "Yêu cầu bổ sung" },
  { value: "TTXLSC04", label: "Đã kết luận" },
  { value: "TTXLSC05", label: "Hoàn tất" },
  { value: "TTXLSC06", label: "Từ chối" },
  { value: "TTXLSC07", label: "Đã hủy" },
];

const ModalTaoSuCo = ({ ct_ma, ma, loai, onDong, onXong }) => {
  const [form, setForm] = useState({
    dts_ma: "",
    lsc_ma: "",
    ycxlsc_ten: "",
    ycxlsc_denghi: "",
    ycxlsc_mota: "",
  });
  const [don, setDon] = useState(null);
  const [anh, setAnh] = useState([]);
  const [pdf, setPdf] = useState([]);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");

  const doi = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const kiemTraDon = async () => {
    setLoi("");
    setDon(null);
    if (!form.dts_ma.trim()) return setLoi("Nhập mã đơn hàng trước.");
    try {
      const res = await suCoService.getDonHang(form.dts_ma.trim(), ct_ma, ma);
      setDon(res.data);
    } catch (error) {
      setLoi(error?.response?.data?.message || "Không tìm thấy đơn hàng.");
    }
  };

  const gui = async () => {
    setLoi("");
    if (!don) return setLoi("Kiểm tra mã đơn hàng trước khi gửi.");
    if (!form.lsc_ma) return setLoi("Chọn loại sự cố.");
    if (!form.ycxlsc_ten.trim()) return setLoi("Nhập tiêu đề sự cố.");
    if (!form.ycxlsc_denghi.trim()) return setLoi("Nhập đề nghị xử lý.");
    if (!form.ycxlsc_mota.trim()) return setLoi("Mô tả chi tiết sự cố.");

    const fd = new FormData();
    fd.append("dts_ma", form.dts_ma.trim());
    fd.append("ct_ma_denghi", ct_ma);
    fd.append("ma_nguoi_gui", ma);
    fd.append("lsc_ma", form.lsc_ma);
    fd.append("ycxlsc_ten", form.ycxlsc_ten.trim());
    fd.append("ycxlsc_denghi", form.ycxlsc_denghi.trim());
    fd.append("ycxlsc_mota", form.ycxlsc_mota.trim());
    ganTep(fd, anh, pdf);

    try {
      setDangGui(true);
      await suCoService.taoPhieu(fd);
      onXong();
    } catch (error) {
      setLoi(error?.response?.data?.message || "Gửi sự cố thất bại.");
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-6">
        <header className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Báo cáo sự cố</h3>
          <button
            onClick={onDong}
            className="text-gray-400 hover:text-gray-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã đơn hàng
            </label>
            <div className="flex gap-2">
              <input
                value={form.dts_ma}
                onChange={(e) => doi("dts_ma", e.target.value.toUpperCase())}
                placeholder="VD: DTS00000001"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={kiemTraDon}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700"
              >
                Kiểm tra
              </button>
            </div>
          </div>

          {don && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm space-y-1">
              <p>
                <span className="text-gray-500">Shop:</span> <b>{don.gh_ten}</b>
              </p>
              <p>
                <span className="text-gray-500">ĐVVC:</span>{" "}
                <b>{don.dvvc_ten}</b>
              </p>
              <p>
                <span className="text-gray-500">Khách:</span>{" "}
                <b>{don.kh_ten || "—"}</b>
              </p>
              <p>
                <span className="text-gray-500">Trạng thái đơn:</span>{" "}
                <b>{don.trang_thai_don_ten || "—"}</b>
              </p>
              <p>
                <span className="text-gray-500">Giá trị đơn:</span>{" "}
                <b>{tien(don.dts_tongtienkhachhangthanhtoan)}</b>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại sự cố
            </label>
            <select
              value={form.lsc_ma}
              onChange={(e) => doi("lsc_ma", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value="">— Chọn loại sự cố —</option>
              {loai.map((l) => (
                <option key={l.lsc_ma} value={l.lsc_ma}>
                  {l.lsc_ten}
                </option>
              ))}
            </select>
            {form.lsc_ma && (
              <p className="mt-1 text-xs text-gray-500">
                {loai.find((l) => l.lsc_ma === form.lsc_ma)?.lsc_mota}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề (tối đa 50 ký tự)
            </label>
            <input
              value={form.ycxlsc_ten}
              maxLength={50}
              onChange={(e) => doi("ycxlsc_ten", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              placeholder="VD: Hàng bị vỡ 2 hộp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đề nghị xử lý
            </label>
            <textarea
              value={form.ycxlsc_denghi}
              onChange={(e) => doi("ycxlsc_denghi", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              placeholder="VD: Đề nghị hoàn lại phí ship và bồi thường 200.000 đ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả sự cố
            </label>
            <textarea
              value={form.ycxlsc_mota}
              onChange={(e) => doi("ycxlsc_mota", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              placeholder="Thời điểm, hiện trạng, người liên quan..."
            />
          </div>

          <ChonTep anh={anh} setAnh={setAnh} pdf={pdf} setPdf={setPdf} />

          {loi && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {loi}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onDong}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              onClick={gui}
              disabled={dangGui}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold"
            >
              {dangGui ? "Đang gửi..." : "Gửi sự cố"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuCoPage = ({ vaiTro, basePath }) => {
  const { ct_ma, ma } = useMemo(() => layNguoiDung(vaiTro), [vaiTro]);

  const [loai, setLoai] = useState([]);
  const [ds, setDs] = useState([]);
  const [tong, setTong] = useState(0);
  const [trang, setTrang] = useState(1);
  const [loc, setLoc] = useState({ trang_thai: "", lsc_ma: "", q: "" });
  const [dangTai, setDangTai] = useState(false);
  const [moTao, setMoTao] = useState(false);
  const [loi, setLoi] = useState("");

  const pageSize = 10;

  const taiDanhSach = useCallback(async () => {
    if (!ct_ma || !ma) return;
    try {
      setDangTai(true);
      setLoi("");
      const res = await suCoService.getDanhSach({
        ct_ma,
        ma,
        page: trang,
        page_size: pageSize,
        ...loc,
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
  }, [ct_ma, ma, trang, loc]);

  useEffect(() => {
    suCoService
      .getLoaiSuCo(ct_ma)
      .then((res) => setLoai(res.data || []))
      .catch(() => setLoai([]));
  }, [ct_ma]);

  useEffect(() => {
    taiDanhSach();
    const id = setInterval(taiDanhSach, 60000);
    return () => clearInterval(id);
  }, [taiDanhSach]);

  const soTrang = Math.max(1, Math.ceil(tong / pageSize));

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sự cố của tôi</h1>
          <p className="text-sm text-gray-500">
            Gửi yêu cầu xử lý sự cố và theo dõi kết luận của Sàn.
          </p>
        </div>
        <button
          onClick={() => setMoTao(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
        >
          <span className="material-symbols-outlined text-lg">report</span>
          Báo sự cố
        </button>
      </div>

      <Khoi className="!p-0">
        <div className="flex flex-wrap gap-2">
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
      </Khoi>

      {loi && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {loi}
        </p>
      )}

      {dangTai && !ds.length && (
        <p className="text-sm text-gray-500">Đang tải...</p>
      )}
      {!dangTai && !ds.length && (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          <span className="material-symbols-outlined text-5xl text-gray-300">
            inbox
          </span>
          <p className="mt-2">Chưa có phiếu sự cố nào.</p>
        </div>
      )}

      <div className="space-y-3">
        {ds.map((p) => (
          <Link
            key={p.ycxlsc_ma}
            to={`${basePath}/${p.ycxlsc_ma}`}
            className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-blue-300"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-gray-800 truncate">
                  {p.ycxlsc_ten}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {p.ycxlsc_ma} · đơn {p.dts_ma} · {p.lsc_ten}
                </p>
              </div>
              <Badge ma={p.ycxlsc_trang_thai} ten={p.ttxlsc_ten} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>Gửi: {ngay(p.ycxlsc_thoidiem)}</span>
              <span>Shop: {p.gh_ten}</span>
              <span>ĐVVC: {p.dvvc_ten}</span>
              {p.so_minh_chung > 0 && <span>{p.so_minh_chung} minh chứng</span>}
              <NhanSla phieu={p} />
            </div>
          </Link>
        ))}
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

      {moTao && (
        <ModalTaoSuCo
          ct_ma={ct_ma}
          ma={ma}
          loai={loai}
          onDong={() => setMoTao(false)}
          onXong={() => {
            setMoTao(false);
            setTrang(1);
            taiDanhSach();
          }}
        />
      )}
    </div>
  );
};

export default SuCoPage;
