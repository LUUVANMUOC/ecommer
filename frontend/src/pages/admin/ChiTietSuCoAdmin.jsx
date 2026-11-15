// frontend/src/pages/admin/ChiTietSuCoAdmin.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
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
  { ma: "CT02", ten: "Người bán" },
  { ma: "CT03", ten: "Đơn vị vận chuyển" },
  { ma: "CT04", ten: "Khách hàng" },
  { ma: "CT05", ten: "Shipper" },
];

const TN_MAC_DINH = { chiu: false, phan_tram: "", so_tien: "", huong: false };
const CHI_MAC_DINH = {
  ct_tratien: "",
  ct_nhantien: "",
  so_tiengoc: "",
  so_tienphatsinh: "",
  tong_tienhoan: "",
  ly_do: "",
};

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
  const [chi, setChi] = useState([]);

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
  const conChi = (data?.hoan_tien || []).filter((h) =>
    ["CHO_CHI", "QUA_HAN"].includes(h.ht_trang_thai),
  );

  const doiTn = (ma, k, v) =>
    setTn((t) => ({ ...t, [ma]: { ...t[ma], [k]: v } }));

  const doiChi = (i, k, v) =>
    setChi((ds) => ds.map((c, j) => (j === i ? { ...c, [k]: v } : c)));

  const tongChi = chi.reduce((s, c) => s + (Number(c.tong_tienhoan) || 0), 0);
  const tongTn = CHU_THE.reduce(
    (s, c) => s + (tn[c.ma].chiu ? Number(tn[c.ma].so_tien) || 0 : 0),
    0,
  );

  const dongBoTien = () => {
    const benChiu = CHU_THE.filter((c) => tn[c.ma].chiu);
    if (benChiu.length !== 1) {
      setLoi("Chỉ đồng bộ được khi có đúng 1 bên chịu trách nhiệm.");
      return;
    }
    setLoi("");
    doiTn(benChiu[0].ma, "so_tien", tongChi);
    doiTn(benChiu[0].ma, "phan_tram", 100);
  };

  const guiKetLuan = async () => {
    if (!kl.ket_luan.trim()) return setLoi("Nhập nội dung kết luận.");

    const dsTN = [];
    for (const c of CHU_THE) {
      const v = tn[c.ma];
      if (v.chiu) {
        dsTN.push({
          ct_ma: c.ma,
          vai_tro: "CHIU_TRACH_NHIEM",
          phan_tram: Number(v.phan_tram) || 0,
          so_tien: Number(v.so_tien) || 0,
        });
      }
      if (v.huong) {
        dsTN.push({
          ct_ma: c.ma,
          vai_tro: "BI_ANH_HUONG",
          phan_tram: 0,
          so_tien: 0,
        });
      }
    }

    const benChiu = dsTN.filter((x) => x.vai_tro === "CHIU_TRACH_NHIEM");
    if (benChiu.length === 1 && !benChiu[0].phan_tram)
      benChiu[0].phan_tram = 100;

    const dsChi = chi.map((c) => ({
      ct_tratien: c.ct_tratien,
      ct_nhantien: c.ct_nhantien,
      so_tiengoc: Number(c.so_tiengoc) || 0,
      so_tienphatsinh: Number(c.so_tienphatsinh) || 0,
      tong_tienhoan: Number(c.tong_tienhoan) || 0,
      ly_do: c.ly_do || "",
    }));

    await chay(
      () =>
        suCoAdminService.ketLuan(ycxlsc_ma, {
          stmdt_ma,
          ket_luan: kl.ket_luan.trim(),
          huong_xu_ly: kl.huong_xu_ly,
          trach_nhiem: dsTN,
          hoan_tien: dsChi,
        }),
      "Đã ghi kết luận.",
    );
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

  const { don, minh_chung, lich_su, trach_nhiem, hoan_tien } = data;
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
        {trangThai === "TTXLSC04" && conChi.length === 0 && (
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
                    <th className="py-1.5 text-center">%</th>
                    <th className="py-1.5 text-center">Số tiền</th>
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
                          type="number"
                          min="0"
                          max="100"
                          value={tn[c.ma].phan_tram}
                          onChange={(e) =>
                            doiTn(c.ma, "phan_tram", e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-right"
                        />
                      </td>
                      <td className="py-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          value={tn[c.ma].so_tien}
                          onChange={(e) =>
                            doiTn(c.ma, "so_tien", e.target.value)
                          }
                          className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-right"
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

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Khoản chi</p>
                <div className="flex gap-2">
                  <button
                    onClick={dongBoTien}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Đồng bộ số tiền
                  </button>
                  <button
                    onClick={() => setChi((ds) => [...ds, { ...CHI_MAC_DINH }])}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-semibold"
                  >
                    + Thêm khoản chi
                  </button>
                </div>
              </div>

              {!chi.length && (
                <p className="text-xs text-gray-500">
                  Chưa có khoản chi. Chọn “Hoàn tiền”/“Bồi thường” thì phải thêm
                  ít nhất 1 khoản.
                </p>
              )}

              {chi.map((c, i) => (
                <div key={i} className="grid sm:grid-cols-6 gap-2 items-end">
                  <select
                    value={c.ct_tratien}
                    onChange={(e) => doiChi(i, "ct_tratien", e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                  >
                    <option value="">Bên trả</option>
                    {CHU_THE.filter((x) => tn[x.ma].chiu).map((x) => (
                      <option key={x.ma} value={x.ma}>
                        {x.ten}
                      </option>
                    ))}
                  </select>

                  <select
                    value={c.ct_nhantien}
                    onChange={(e) => doiChi(i, "ct_nhantien", e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                  >
                    <option value="">Bên nhận</option>
                    {CHU_THE.filter((x) => tn[x.ma].huong).map((x) => (
                      <option key={x.ma} value={x.ma}>
                        {x.ten}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    placeholder="Gốc"
                    value={c.so_tiengoc}
                    onChange={(e) => doiChi(i, "so_tiengoc", e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Phát sinh"
                    value={c.so_tienphatsinh}
                    onChange={(e) =>
                      doiChi(i, "so_tienphatsinh", e.target.value)
                    }
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Tổng hoàn"
                    value={c.tong_tienhoan}
                    onChange={(e) => doiChi(i, "tong_tienhoan", e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right"
                  />
                  <button
                    onClick={() => setChi((ds) => ds.filter((_, j) => j !== i))}
                    className="px-2 py-1.5 rounded-lg text-red-600 text-xs font-semibold hover:bg-red-50"
                  >
                    Xóa
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-1 border-t border-gray-200">
                <span>
                  Tổng trách nhiệm: <b>{tien(tongTn)}</b>
                </span>
                <span>
                  Tổng khoản chi: <b>{tien(tongChi)}</b>
                </span>
                {Math.abs(tongTn - tongChi) > 0.01 && (
                  <span className="text-amber-600 font-semibold">
                    Lệch {tien(Math.abs(tongTn - tongChi))} — phải bằng nhau mới
                    lưu được.
                  </span>
                )}
              </div>
            </div>

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
                <th className="py-1.5 text-right">%</th>
                <th className="py-1.5 text-right">Số tiền</th>
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
                  <td className="py-1.5 text-right">
                    {Number(t.cttn_phan_tram)}%
                  </td>
                  <td className="py-1.5 text-right font-semibold">
                    {tien(t.cttn_so_tien)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Khoi>
      )}

      {!!hoan_tien.length && (
        <Khoi title="Khoản chi & nghĩa vụ">
          <div className="space-y-2">
            {hoan_tien.map((h) => {
              const cho = ["CHO_CHI", "QUA_HAN"].includes(h.ht_trang_thai);
              return (
                <div
                  key={h.ht_ma}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">
                      {h.ht_ma} · {tien(h.ht_tongtienhoan)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {h.ct_tratien} → {h.ct_nhantien} · hạn{" "}
                      {ngay(h.ht_han_chi)} ·{" "}
                      {h.ht_trang_thai === "DA_CHI"
                        ? "Đã chi"
                        : h.ht_trang_thai === "HUY"
                          ? "Đã hủy"
                          : h.ht_trang_thai === "QUA_HAN"
                            ? "Quá hạn"
                            : "Chờ chi"}
                    </p>
                  </div>

                  {cho && (
                    <div className="flex gap-2">
                      <button
                        disabled={dangGui}
                        onClick={() =>
                          chay(() =>
                            suCoAdminService.xacNhanChi(ycxlsc_ma, h.ht_ma, {
                              stmdt_ma,
                              ma_giao_dich:
                                window.prompt(
                                  "Mã giao dịch (không bắt buộc):",
                                ) || "",
                            }),
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-60"
                      >
                        Xác nhận đã chi
                      </button>
                      <button
                        disabled={dangGui}
                        onClick={() =>
                          chay(() =>
                            suCoAdminService.huyHoanTien(ycxlsc_ma, h.ht_ma, {
                              stmdt_ma,
                              ly_do:
                                window.prompt("Lý do hủy khoản chi:") || "",
                            }),
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-60"
                      >
                        Hủy khoản chi
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
