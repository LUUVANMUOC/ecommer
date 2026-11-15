// frontend/src/pages/suco/ChiTietSuCoPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import suCoService from "../../services/suco/suCoService";
import {
  Badge,
  ChonTep,
  HUONG_XU_LY,
  Khoi,
  NhanSla,
  TepDinhKem,
  VAI_TRO_TN,
  ganTep,
  layNguoiDung,
  ngay,
  tien,
} from "../../components/suco/SuCoUI";

const ChiTietSuCoPage = ({ vaiTro, basePath }) => {
  const { ycxlsc_ma } = useParams();
  const { ct_ma, ma } = useMemo(() => layNguoiDung(vaiTro), [vaiTro]);

  const [data, setData] = useState(null);
  const [loi, setLoi] = useState("");
  const [anh, setAnh] = useState([]);
  const [pdf, setPdf] = useState([]);
  const [dangGui, setDangGui] = useState(false);

  const tai = useCallback(async () => {
    if (!ycxlsc_ma) return;
    try {
      setLoi("");
      const res = await suCoService.getChiTiet(ycxlsc_ma, ct_ma, ma);
      setData(res.data);
    } catch (error) {
      setLoi(
        error?.response?.data?.message || "Không tải được chi tiết sự cố.",
      );
    }
  }, [ycxlsc_ma, ct_ma, ma]);

  useEffect(() => {
    tai();
    const id = setInterval(tai, 60000);
    return () => clearInterval(id);
  }, [tai]);

  const laNguoiGui =
    data?.phieu?.ct_ma_denghi === ct_ma &&
    String(data?.phieu?.ycxlsc_ma_nguoi_gui) === String(ma);

  const conMo = ["TTXLSC01", "TTXLSC02", "TTXLSC03"].includes(
    data?.phieu?.ycxlsc_trang_thai,
  );

  const boSung = async () => {
    if (!anh.length && !pdf.length) {
      setLoi("Chọn ít nhất 1 tệp minh chứng.");
      return;
    }
    const fd = new FormData();
    fd.append("ct_ma", ct_ma);
    fd.append("ma", ma);
    ganTep(fd, anh, pdf);

    try {
      setDangGui(true);
      setLoi("");
      await suCoService.themMinhChung(ycxlsc_ma, fd);
      setAnh([]);
      setPdf([]);
      await tai();
    } catch (error) {
      setLoi(error?.response?.data?.message || "Bổ sung minh chứng thất bại.");
    } finally {
      setDangGui(false);
    }
  };

  const huyPhieu = async () => {
    const ly_do = window.prompt("Lý do hủy phiếu (không bắt buộc):") || "";
    try {
      setDangGui(true);
      setLoi("");
      await suCoService.huy(ycxlsc_ma, { ct_ma, ma, ly_do });
      await tai();
    } catch (error) {
      setLoi(error?.response?.data?.message || "Hủy phiếu thất bại.");
    } finally {
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
          to={basePath}
          className="inline-block mt-3 text-sm text-blue-600 font-semibold"
        >
          ← Về danh sách sự cố
        </Link>
      </div>
    );
  }

  if (!data)
    return <div className="p-6 text-sm text-gray-500">Đang tải...</div>;

  const { phieu, don, minh_chung, lich_su, trach_nhiem, hoan_tien } = data;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={basePath} className="text-sm text-blue-600 font-semibold">
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
          <Badge ma={phieu.ycxlsc_trang_thai} ten={phieu.ttxlsc_ten} />
          <NhanSla phieu={phieu} />
        </div>
      </div>

      {loi && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {loi}
        </p>
      )}

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
                <span className="text-gray-500">Thời điểm gửi:</span>{" "}
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

        {conMo && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700">
              Bổ sung minh chứng
            </p>
            <ChonTep anh={anh} setAnh={setAnh} pdf={pdf} setPdf={setPdf} />
            <div className="flex justify-end">
              <button
                onClick={boSung}
                disabled={dangGui}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold"
              >
                {dangGui ? "Đang gửi..." : "Gửi minh chứng"}
              </button>
            </div>
          </div>
        )}
      </Khoi>

      {phieu.ycxlsc_ket_luan && (
        <Khoi title="Kết luận của Sàn">
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Hướng xử lý:</span>{" "}
              <b>{HUONG_XU_LY[phieu.ycxlsc_huong_xu_ly] || "—"}</b>
            </p>
            <p className="whitespace-pre-wrap text-gray-800">
              {phieu.ycxlsc_ket_luan}
            </p>
            <p className="text-xs text-gray-500">
              Duyệt lúc {ngay(phieu.ycxlsc_thoidiem_duyet)} bởi{" "}
              {phieu.ycxlsc_nguoi_duyet || "—"}
            </p>
          </div>

          {!!trach_nhiem.length && (
            <div className="mt-3 overflow-x-auto">
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
            </div>
          )}

          {!!hoan_tien.length && (
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="font-semibold text-gray-700">Khoản chi</p>
              {hoan_tien.map((h) => (
                <p key={h.ht_ma} className="text-gray-700">
                  {h.ht_ma}: <b>{tien(h.ht_tongtienhoan)}</b> · {h.ct_tratien} →{" "}
                  {h.ct_nhantien} ·{" "}
                  <span
                    className={
                      h.ht_trang_thai === "DA_CHI"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }
                  >
                    {h.ht_trang_thai === "DA_CHI"
                      ? "Đã chi"
                      : h.ht_trang_thai === "HUY"
                        ? "Đã hủy"
                        : "Chờ chi"}
                  </span>
                </p>
              ))}
            </div>
          )}
        </Khoi>
      )}

      <Khoi title="Lịch sử xử lý">
        <ol className="space-y-3">
          {lich_su.map((s, i) => (
            <li key={`${s.ctxlsc_thoidiem}-${i}`} className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
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

      {laNguoiGui &&
        ["TTXLSC01", "TTXLSC02"].includes(phieu.ycxlsc_trang_thai) && (
          <div className="flex justify-end">
            <button
              onClick={huyPhieu}
              disabled={dangGui}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold"
            >
              Hủy phiếu sự cố
            </button>
          </div>
        )}
    </div>
  );
};

export default ChiTietSuCoPage;
