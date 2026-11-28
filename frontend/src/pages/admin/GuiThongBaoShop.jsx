// frontend/src/pages/admin/GuiThongBaoShop.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { Send, Store } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import thongBaoService from "../../services/thongbao/thongBaoService";
import DinhKemThongBao from "../common/DinhKemThongBao"; // ✅ sửa: ../../components/common → ../common
import Avatar from "../../components/common/Avatar";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(
    /\/api\/?$/,
    "",
  );

const GuiThongBaoShop = () => {
  const { user } = useContext(AuthContext);
  const stmdt_ma = user?.STMDT_Ma || user?.stmdt_ma || "";

  const [dsShop, setDsShop] = useState([]);
  const [tongShop, setTongShop] = useState(0);
  const [dangTaiDs, setDangTaiDs] = useState(false);
  const [tuKhoa, setTuKhoa] = useState("");
  const [daChon, setDaChon] = useState([]);
  const [guiTatCa, setGuiTatCa] = useState(false);

  const [tieuDe, setTieuDe] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [tep, setTep] = useState({ anh: [], pdf: [] });

  const [dangGui, setDangGui] = useState(false);
  const [ketQua, setKetQua] = useState(null);

  // Tổng số shop (không phụ thuộc ô tìm kiếm)
  useEffect(() => {
    thongBaoService
      .getShopDeGui("")
      .then((res) => setTongShop((res.data || []).length))
      .catch(() => setTongShop(0));
  }, []);

  useEffect(() => {
    const id = setTimeout(async () => {
      setDangTaiDs(true);
      try {
        const res = await thongBaoService.getShopDeGui(tuKhoa.trim());
        setDsShop(res.data || []);
      } catch (error) {
        setDsShop([]);
      } finally {
        setDangTaiDs(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [tuKhoa]);

  const soNguoiNhan = useMemo(
    () => (guiTatCa ? tongShop : daChon.length),
    [guiTatCa, tongShop, daChon.length],
  );

  const toggleChon = (ma) => {
    setDaChon((cu) =>
      cu.includes(ma) ? cu.filter((item) => item !== ma) : [...cu, ma],
    );
  };

  const gui = async (event) => {
    event.preventDefault();
    setKetQua(null);

    if (!stmdt_ma) {
      return setKetQua({ type: "error", text: "Không xác định được sàn." });
    }
    if (tieuDe.trim().length < 5) {
      return setKetQua({
        type: "error",
        text: "Tiêu đề phải từ 5 ký tự trở lên.",
      });
    }
    if (!noiDung.trim()) {
      return setKetQua({
        type: "error",
        text: "Nội dung không được để trống.",
      });
    }
    if (!guiTatCa && daChon.length === 0) {
      return setKetQua({
        type: "error",
        text: "Hãy chọn ít nhất 1 gian hàng hoặc chọn gửi tất cả.",
      });
    }

    const form = new FormData();
    form.append("stmdt_ma", stmdt_ma);
    form.append("tieu_de", tieuDe.trim());
    form.append("noi_dung", noiDung.trim());
    form.append("gui_tat_ca", guiTatCa ? "true" : "false");
    form.append("ds_gh_ma", JSON.stringify(daChon));
    tep.anh.forEach((file) => form.append("anh", file));
    tep.pdf.forEach((file) => form.append("pdf", file));

    setDangGui(true);
    try {
      const res = await thongBaoService.guiTuSan(form);
      setKetQua({
        type: "success",
        text: `Đã gửi thông báo tới ${res.data?.so_nguoi_nhan ?? soNguoiNhan} gian hàng.`,
      });
      setTieuDe("");
      setNoiDung("");
      setTep({ anh: [], pdf: [] });
      setDaChon([]);
      setGuiTatCa(false);
    } catch (error) {
      setKetQua({
        type: "error",
        text: error.response?.data?.message || "Gửi thông báo thất bại.",
      });
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Gửi thông báo cho gian hàng
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Thông báo sẽ xuất hiện ngay trên chuông của shop được chọn.
        </p>
      </div>

      {ketQua && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            ketQua.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {ketQua.text}
        </p>
      )}

      <form onSubmit={gui} className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Tiêu đề
            </span>
            <input
              value={tieuDe}
              onChange={(e) => setTieuDe(e.target.value)}
              maxLength={200}
              placeholder="VD: Cập nhật chính sách phí tháng 12"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Nội dung
            </span>
            <textarea
              value={noiDung}
              onChange={(e) => setNoiDung(e.target.value)}
              rows={7}
              maxLength={5000}
              placeholder="Nhập nội dung thông báo..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
            <span className="mt-1 block text-right text-[11px] text-slate-400">
              {noiDung.length}/5000
            </span>
          </label>

          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Đính kèm
            </span>
            <DinhKemThongBao value={tep} onChange={setTep} disabled={dangGui} />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-500">
              Người nhận: <strong>{soNguoiNhan}</strong>
            </span>
            <button
              type="submit"
              disabled={dangGui}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {dangGui ? "Đang gửi..." : "Gửi thông báo"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <Store className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">Gian hàng</p>
            <span className="ml-auto text-xs text-slate-400">
              {tuKhoa.trim() ? `${dsShop.length}/${tongShop}` : tongShop}
            </span>
          </div>

          <input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm theo tên shop, email..."
            className="mb-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
          />

          <label className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={guiTatCa}
              onChange={(e) => {
                setGuiTatCa(e.target.checked);
                if (e.target.checked) setDaChon([]);
              }}
            />
            Gửi cho tất cả gian hàng ({tongShop})
          </label>

          <div className="max-h-[420px] space-y-1 overflow-y-auto">
            {dangTaiDs ? (
              <p className="py-6 text-center text-xs text-slate-500">
                Đang tải gian hàng...
              </p>
            ) : dsShop.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Không tìm thấy gian hàng.
              </p>
            ) : (
              dsShop.map((shop) => (
                <label
                  key={shop.gh_ma}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50 ${
                    guiTatCa ? "opacity-60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={guiTatCa}
                    checked={daChon.includes(shop.gh_ma)}
                    onChange={() => toggleChon(shop.gh_ma)}
                  />
                  <Avatar
                    src={shop.gh_hinhanh}
                    role="shop"
                    name={shop.gh_ten}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-700">
                      {shop.gh_ten}
                    </span>
                    <span className="block truncate text-[11px] text-slate-400">
                      {shop.so_khach_theo_doi} khách theo dõi
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default GuiThongBaoShop;
