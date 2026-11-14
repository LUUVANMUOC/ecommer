// frontend/src/pages/shop/GuiThongBaoKhachHang.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { Send, Users } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import thongBaoService from "../../services/thongbao/thongBaoService";
import DinhKemThongBao from "../common/DinhKemThongBao"; // ✅ sửa: ../../components/common → ../common

const GuiThongBaoKhachHang = () => {
  const { user } = useContext(AuthContext);
  const gh_ma = user?.GH_Ma || user?.gh_ma || "";

  const [dsKhach, setDsKhach] = useState([]);
  const [tongKhach, setTongKhach] = useState(0);
  const [dangTaiDs, setDangTaiDs] = useState(false);
  const [tuKhoa, setTuKhoa] = useState("");
  const [daChon, setDaChon] = useState([]);
  const [guiTatCa, setGuiTatCa] = useState(false);

  const [tieuDe, setTieuDe] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [tep, setTep] = useState({ anh: [], pdf: [] });

  const [dangGui, setDangGui] = useState(false);
  const [ketQua, setKetQua] = useState(null);

  // Tổng số khách đang theo dõi (không phụ thuộc ô tìm kiếm)
  useEffect(() => {
    if (!gh_ma) return;
    thongBaoService
      .getKhachHangTheoDoi(gh_ma, "")
      .then((res) => setTongKhach((res.data || []).length))
      .catch(() => setTongKhach(0));
  }, [gh_ma]);

  useEffect(() => {
    if (!gh_ma) return undefined;
    const id = setTimeout(async () => {
      setDangTaiDs(true);
      try {
        const res = await thongBaoService.getKhachHangTheoDoi(
          gh_ma,
          tuKhoa.trim(),
        );
        setDsKhach(res.data || []);
      } catch (error) {
        setDsKhach([]);
      } finally {
        setDangTaiDs(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [gh_ma, tuKhoa]);

  const soNguoiNhan = useMemo(
    () => (guiTatCa ? tongKhach : daChon.length),
    [guiTatCa, tongKhach, daChon.length],
  );

  const toggleChon = (ma) => {
    setDaChon((cu) =>
      cu.includes(ma) ? cu.filter((item) => item !== ma) : [...cu, ma],
    );
  };

  const gui = async (event) => {
    event.preventDefault();
    setKetQua(null);

    if (!gh_ma) {
      return setKetQua({
        type: "error",
        text: "Không xác định được gian hàng.",
      });
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
        text: "Hãy chọn ít nhất 1 khách hàng hoặc chọn gửi tất cả.",
      });
    }

    const form = new FormData();
    form.append("gh_ma", gh_ma);
    form.append("tieu_de", tieuDe.trim());
    form.append("noi_dung", noiDung.trim());
    form.append("gui_tat_ca", guiTatCa ? "true" : "false");
    form.append("ds_kh_ma", JSON.stringify(daChon));
    tep.anh.forEach((file) => form.append("anh", file));
    tep.pdf.forEach((file) => form.append("pdf", file));

    setDangGui(true);
    try {
      const res = await thongBaoService.guiTuShop(form);
      setKetQua({
        type: "success",
        text: `Đã gửi thông báo tới ${res.data?.so_nguoi_nhan ?? soNguoiNhan} khách hàng.`,
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
          Gửi thông báo cho khách hàng
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Chỉ gửi được cho khách đang theo dõi shop. Thông báo hiện ngay trên
          chuông của khách.
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
        {/* Nội dung */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Tiêu đề
            </span>
            <input
              value={tieuDe}
              onChange={(e) => setTieuDe(e.target.value)}
              maxLength={200}
              placeholder="VD: Ưu đãi cuối tuần giảm 20%"
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

        {/* Danh sách khách */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">
              Khách đang theo dõi
            </p>
            <span className="ml-auto text-xs text-slate-400">
              {tuKhoa.trim() ? `${dsKhach.length}/${tongKhach}` : tongKhach}
            </span>
          </div>

          <input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm theo tên, SĐT, email..."
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
            Gửi cho tất cả khách đang theo dõi ({tongKhach})
          </label>

          <div className="max-h-[420px] space-y-1 overflow-y-auto">
            {dangTaiDs ? (
              <p className="py-6 text-center text-xs text-slate-500">
                Đang tải khách hàng...
              </p>
            ) : dsKhach.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Chưa có khách hàng theo dõi shop.
              </p>
            ) : (
              dsKhach.map((khach) => (
                <label
                  key={khach.kh_ma}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50 ${
                    guiTatCa ? "opacity-60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={guiTatCa}
                    checked={daChon.includes(khach.kh_ma)}
                    onChange={() => toggleChon(khach.kh_ma)}
                  />
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                    {(khach.kh_ten || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-700">
                      {khach.kh_ten}
                    </span>
                    <span className="block truncate text-[11px] text-slate-400">
                      {khach.kh_sdt || khach.kh_email || khach.kh_ma}
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

export default GuiThongBaoKhachHang;
