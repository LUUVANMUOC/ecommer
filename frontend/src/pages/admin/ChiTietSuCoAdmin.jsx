// frontend/src/pages/admin/ChiTietSuCoAdmin.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import suCoAdminService from "../../services/san/suCoAdminService";
import {
  Badge,
  HUONG_XU_LY,
  Khoi,
  NhanSla,
  TepDinhKem,
  VAI_TRO_TN,
  ngay,
  tien,
} from "../../components/suco/SuCoUI";

const CHU_THE = [
  { ma: "CT01", ten: "Sàn" },
  { ma: "CT02", ten: "Người bán" },
  { ma: "CT03", ten: "Đơn vị vận chuyển" },
  { ma: "CT04", ten: "Khách hàng" },
  { ma: "CT05", ten: "Shipper" },
];

const TN_MAC_DINH = { chiu: false, huong: false };

const ChiTietSuCoAdmin = () => {
  const { ycxlsc_ma } = useParams();
  const stmdt_ma = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.STMDT_Ma || u.stmdt_ma || u.id || "";
    } catch {
      return "";
    }
  }, []);

  const [data, setData] = useState(null);
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);

  const [kl, setKl] = useState({ ket_luan: "", huong_xu_ly: "KHONG_DEN" });
  const [tn, setTn] = useState(() =>
    Object.fromEntries(CHU_THE.map((c) => [c.ma, { ...TN_MAC_DINH }])),
  );
  const [loiKetLuan, setLoiKetLuan] = useState("");
  const loiKetLuanRef = useRef(null);
  const dangGuiRef = useRef(false);

  useEffect(() => {
    if (loiKetLuan && loiKetLuanRef.current) {
      loiKetLuanRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [loiKetLuan]);

  const tai = useCallback(async () => {
    try {
      setLoi("");
      const res = await suCoAdminService.getChiTiet(ycxlsc_ma);
      setData(res.data);
    } catch (error) {
      setLoi(
        error?.response?.data?.message || "Không tải được chi tiết sự cố.",
      );
    }
  }, [ycxlsc_ma]);

  useEffect(() => {
    tai();
    const id = setInterval(tai, 60000);
    return () => clearInterval(id);
  }, [tai]);

  const chay = async (fn, thongDiep) => {
    try {
      setDangGui(true);
      setLoi("");
      await fn();
      await tai();
      if (thongDiep) window.alert(thongDiep);
    } catch (error) {
      setLoi(error?.response?.data?.message || "Thao tác thất bại.");
    } finally {
      setDangGui(false);
    }
  };

  const phieu = data?.phieu;
  const trangThai = phieu?.ycxlsc_trang_thai || "";

  const baoLoi = (thongDiep) => setLoiKetLuan(thongDiep);

  const doiTn = (ma, k, v) =>
    setTn((t) => ({ ...t, [ma]: { ...t[ma], [k]: v } }));

  const guiKetLuan = async () => {
    // Chặn bấm đúp trước khi React kịp disable nút.
    if (dangGuiRef.current) return;

    setLoi("");

    if (!kl.ket_luan.trim()) return baoLoi("Nhập nội dung kết luận.");

    const benChiu = CHU_THE.filter((c) => tn[c.ma].chiu);
    const benHuong = CHU_THE.filter((c) => tn[c.ma].huong);

    if (benHuong.length && !benChiu.length) {
      return baoLoi("Chọn ít nhất một bên chịu trách nhiệm.");
    }

    const dsTN = [];
    for (const c of CHU_THE) {
      const v = tn[c.ma];
      if (v.chiu) {
        dsTN.push({ ct_ma: c.ma, vai_tro: "CHIU_TRACH_NHIEM" });
      }
      if (v.huong) {
        dsTN.push({ ct_ma: c.ma, vai_tro: "BI_ANH_HUONG" });
      }
    }

    try {
      dangGuiRef.current = true;
      setDangGui(true);
      setLoi("");
      setLoiKetLuan("");
      await suCoAdminService.ketLuan(ycxlsc_ma, {
        stmdt_ma,
        ket_luan: kl.ket_luan.trim(),
        huong_xu_ly: kl.huong_xu_ly,
        trach_nhiem: dsTN,
      });
      await tai();
      window.alert("Đã ghi kết luận.");
    } catch (error) {
      setLoiKetLuan(error?.response?.data?.message || "Ghi kết luận thất bại.");
    } finally {
      dangGuiRef.current = false;
      setDangGui(false);
    }
  };

  if (loi && !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {loi}
        </p>
        <Link
          to="/admin/su-co"
          className="inline-block mt-3 text-sm text-blue-600 font-semibold"
        >
          ← Về danh sách sự cố
        </Link>
      </div>
    );
  }

  if (!data)
    return <div className="p-6 text-sm text-gray-500">Đang tải...</div>;

  const { don, minh_chung, lich_su, trach_nhiem } = data;
  const coTheKetLuan = ["TTXLSC02", "TTXLSC03"].includes(trangThai);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/admin/su-co"
            className="text-sm text-blue-600 font-semibold"
          >
            ← Danh sách sự cố
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            {phieu.ycxlsc_ten}
          </h1>
          <p className="text-sm text-gray-500">
            {phieu.ycxlsc_ma} · đơn {phieu.dts_ma} · {phieu.lsc_ten}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge ma={trangThai} ten={phieu.ttxlsc_ten} />
          <NhanSla phieu={phieu} />
        </div>
      </div>

      {loi && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {loi}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {trangThai === "TTXLSC01" && (
          <button
            disabled={dangGui}
            onClick={() =>
              chay(() => suCoAdminService.tiepNhan(ycxlsc_ma, { stmdt_ma }))
            }
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-60"
          >
            Tiếp nhận
          </button>
        )}
        {["TTXLSC02", "TTXLSC03"].includes(trangThai) && (
          <button
            disabled={dangGui}
            onClick={() =>
              chay(() =>
                suCoAdminService.yeuCauBoSung(ycxlsc_ma, {
                  stmdt_ma,
                  ghichu: window.prompt("Nội dung yêu cầu bổ sung:") || "",
                }),
              )
            }
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold disabled:opacity-60"
          >
            Yêu cầu bổ sung
          </button>
        )}
        {["TTXLSC01", "TTXLSC02", "TTXLSC03"].includes(trangThai) && (
          <button
            disabled={dangGui}
            onClick={() =>
              chay(() =>
                suCoAdminService.tuChoi(ycxlsc_ma, {
                  stmdt_ma,
                  ly_do: window.prompt("Lý do từ chối:") || "",
                }),
              )
            }
            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold disabled:opacity-60"
          >
            Từ chối
          </button>
        )}
        {trangThai === "TTXLSC04" && (
          <button
            disabled={dangGui}
            onClick={() =>
              chay(() => suCoAdminService.hoanTat(ycxlsc_ma, { stmdt_ma }))
            }
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-60"
          >
            Hoàn tất phiếu
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Khoi title="Nội dung yêu cầu" className="lg:col-span-2">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 mb-0.5">Đề nghị xử lý</p>
              <p className="text-gray-800 whitespace-pre-wrap">
                {phieu.ycxlsc_denghi}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Mô tả</p>
              <p className="text-gray-800 whitespace-pre-wrap">
                {phieu.ycxlsc_mota}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <p>
                <span className="text-gray-500">Người gửi:</span>{" "}
                {phieu.ct_ma_denghi} · {phieu.ycxlsc_ma_nguoi_gui}
              </p>
              <p>
                <span className="text-gray-500">Gửi lúc:</span>{" "}
                {ngay(phieu.ycxlsc_thoidiem)}
              </p>
              <p>
                <span className="text-gray-500">Hạn kết luận:</span>{" "}
                {ngay(phieu.ycxlsc_han_ket_luan)}
              </p>
              <p>
                <span className="text-gray-500">Người duyệt:</span>{" "}
                {phieu.ycxlsc_nguoi_duyet || "—"}
              </p>
            </div>
          </div>
        </Khoi>

        <Khoi title="Đơn hàng">
          <div className="space-y-1.5 text-sm">
            <p>
              <span className="text-gray-500">Mã đơn:</span>{" "}
              <b>{don?.dts_ma}</b>
            </p>
            <p>
              <span className="text-gray-500">Shop:</span> {don?.gh_ten}
            </p>
            <p>
              <span className="text-gray-500">ĐVVC:</span> {don?.dvvc_ten}
            </p>
            <p>
              <span className="text-gray-500">Khách:</span> {don?.kh_ten || "—"}
            </p>
            <p>
              <span className="text-gray-500">Shipper:</span>{" "}
              {don?.shipper_ten || "—"}
            </p>
            <p>
              <span className="text-gray-500">Trạng thái:</span>{" "}
              {don?.trang_thai_don_ten || "—"}
            </p>
            <p>
              <span className="text-gray-500">Khách trả:</span>{" "}
              <b>{tien(don?.dts_tongtienkhachhangthanhtoan)}</b>
            </p>
            <p>
              <span className="text-gray-500">Tiền shop:</span>{" "}
              {tien(don?.so_tien_shop)}
            </p>
            <p>
              <span className="text-gray-500">Phí sàn:</span>{" "}
              {tien(don?.dts_tongtienphisan)}
            </p>
            <p>
              <span className="text-gray-500">Giữ tiền:</span>{" "}
              {data.giu_tien?.gtsc_trang_thai === "DANG_GIU"
                ? "Đang giữ"
                : "Đã giải tỏa"}
            </p>
          </div>
        </Khoi>
      </div>

      <Khoi
        title="Minh chứng"
        right={
          <span className="text-xs text-gray-500">{minh_chung.length} tệp</span>
        }
      >
        <TepDinhKem ds={minh_chung} />
      </Khoi>

      {coTheKetLuan && (
        <Khoi title="Kết luận & quy trách nhiệm">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hướng xử lý
                </label>
                <select
                  value={kl.huong_xu_ly}
                  onChange={(e) =>
                    setKl((k) => ({ ...k, huong_xu_ly: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                >
                  {Object.entries(HUONG_XU_LY).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kết luận (bắt buộc)
                </label>
                <input
                  value={kl.ket_luan}
                  onChange={(e) =>
                    setKl((k) => ({ ...k, ket_luan: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  placeholder="VD: ĐVVC chịu 100% do làm vỡ hàng"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-1.5">Bên</th>
                    <th className="py-1.5 text-center">Chịu TN</th>
                    <th className="py-1.5 text-center">Bị ảnh hưởng</th>
                  </tr>
                </thead>
                <tbody>
                  {CHU_THE.map((c) => (
                    <tr key={c.ma} className="border-b border-gray-50">
                      <td className="py-1.5">{c.ten}</td>
                      <td className="py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={tn[c.ma].chiu}
                          onChange={(e) =>
                            doiTn(c.ma, "chiu", e.target.checked)
                          }
                        />
                      </td>
                      <td className="py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={tn[c.ma].huong}
                          onChange={(e) =>
                            doiTn(c.ma, "huong", e.target.checked)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loiKetLuan && (
              <p
                ref={loiKetLuanRef}
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
              >
                {loiKetLuan}
              </p>
            )}

            <div className="flex justify-end">
              <button
                onClick={guiKetLuan}
                disabled={dangGui}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-60"
              >
                {dangGui ? "Đang lưu..." : "Ghi kết luận"}
              </button>
            </div>
          </div>
        </Khoi>
      )}

      {!!trach_nhiem.length && (
        <Khoi title="Trách nhiệm đã quy">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-1.5">Bên</th>
                <th className="py-1.5">Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {trach_nhiem.map((t) => (
                <tr
                  key={`${t.ct_ma}-${t.cttn_vai_tro}`}
                  className="border-b border-gray-50"
                >
                  <td className="py-1.5">{t.ct_ten}</td>
                  <td className="py-1.5">{VAI_TRO_TN[t.cttn_vai_tro]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Khoi>
      )}

      {phieu.ycxlsc_ket_luan && (
        <Khoi title="Kết luận hiện tại">
          <p className="text-sm">
            <span className="text-gray-500">Hướng:</span>{" "}
            <b>{HUONG_XU_LY[phieu.ycxlsc_huong_xu_ly] || "—"}</b>
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">
            {phieu.ycxlsc_ket_luan}
          </p>
        </Khoi>
      )}

      <Khoi title="Lịch sử xử lý">
        <ol className="space-y-3">
          {lich_su.map((s, i) => (
            <li key={`${s.ctxlsc_thoidiem}-${i}`} className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-gray-800">{s.ttxlsc_ten}</p>
                <p className="text-xs text-gray-500">
                  {ngay(s.ctxlsc_thoidiem)} · {s.ct_ten || "Hệ thống"}
                  {s.ctxlsc_nguoi_thuc_hien
                    ? ` · ${s.ctxlsc_nguoi_thuc_hien}`
                    : ""}
                </p>
                {s.ctxlsc_ghichu && (
                  <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">
                    {s.ctxlsc_ghichu}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Khoi>

    </div>
  );
};

export default ChiTietSuCoAdmin;
