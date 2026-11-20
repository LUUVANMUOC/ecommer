// frontend/src/pages/suco/ChiTietSuCoPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import suCoService from "../../services/suco/suCoService";
import { buildVietQrUrl } from "../../utils/accountUtils";
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

const NGUON_XAC_NHAN = {
  WEBHOOK: "Ngân hàng tự xác nhận",
  PAYOUT: "Chi tự động (SePay Payout)",
  THU_CONG: "Sàn xác nhận thủ công",
};

const TEN_TRANG_THAI_TT = {
  DA_CHI: "Đã thanh toán",
  HUY: "Đã huỷ khoản",
  QUA_HAN: "Quá hạn chuyển tiền",
  CHO_CHI: "Chờ chuyển tiền",
};

// Thẻ thanh toán của một khoản hoàn tiền/bồi thường.
// Bên trả thấy STK + QR bên nhận; bên nhận thấy mình sắp nhận bao nhiêu từ ai.
const TheThanhToan = ({ khoan, ct_ma, onBaoChuyen, dangGui }) => {
  const tt = khoan.thanh_toan;
  if (!tt) return null;

  const vaiTro = khoan.vai_tro_thanh_toan;
  const nhan = tt.ben_nhan || {};
  const tra = tt.ben_tra || {};
  const conMo = ["CHO_CHI", "QUA_HAN"].includes(khoan.ht_trang_thai);
  const daChi = khoan.ht_trang_thai === "DA_CHI";
  const daHuy = khoan.ht_trang_thai === "HUY";
  const qrMo = tt.qr?.qr_trang_thai === "CHUA_THANH_TOAN";
  const qrBiHuy = tt.qr?.qr_trang_thai === "HUY";
  const thieuTk = Boolean(nhan.thieu_tk);

  const bank = {
    so_tai_khoan: nhan.so_tai_khoan,
    ten_tai_khoan: nhan.ten_tai_khoan,
    nganhang_ten: nhan.nganhang_ten,
    nganhang_ma: nhan.nganhang_ma,
  };
  const coBank = !thieuTk && Boolean(nhan.so_tai_khoan) && !qrBiHuy;
  const qrUrl =
    vaiTro === "TRA" && conMo && qrMo && coBank
      ? buildVietQrUrl(bank, tt.so_tien, tt.noi_dung)
      : "";

  const mauVien = daChi
    ? "border-emerald-200 bg-emerald-50/40"
    : daHuy
      ? "border-gray-200 bg-gray-50"
      : vaiTro === "TRA"
        ? "border-amber-200 bg-amber-50/30"
        : "border-blue-200 bg-blue-50/30";

  return (
    <div className={`rounded-2xl border p-4 ${mauVien}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {vaiTro === "TRA"
              ? "Bạn cần chuyển khoản"
              : vaiTro === "NHAN"
                ? "Bạn sẽ nhận được"
                : "Khoản thanh toán"}
          </p>
          <p className="text-xl font-bold text-gray-800">{tien(tt.so_tien)}</p>
          <p className="text-sm text-gray-600">
            {vaiTro === "TRA" ? (
              <>
                cho <b>{nhan.ten}</b>
              </>
            ) : vaiTro === "NHAN" ? (
              <>
                từ <b>{tra.ten}</b>
              </>
            ) : (
              <>
                {tra.ten} → {nhan.ten}
              </>
            )}
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="font-semibold text-gray-700">
            {TEN_TRANG_THAI_TT[khoan.ht_trang_thai] || khoan.ht_trang_thai}
          </p>
          {khoan.ht_ma && (
            <p className="text-gray-500">Nội dung CK: {khoan.ht_ma}</p>
          )}
          {conMo && tt.het_han && (
            <p className="text-amber-700">Hạn: {ngay(tt.het_han)}</p>
          )}
          {daChi && (
            <p className="text-emerald-700">
              {NGUON_XAC_NHAN[khoan.ht_nguon_xac_nhan] || "Đã xác nhận"}
              {khoan.ht_ma_giao_dich
                ? ` · GD ${khoan.ht_ma_giao_dich}`
                : ""}
            </p>
          )}
        </div>
      </div>

      {coBank ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="text-sm space-y-0.5">
            <p>
              <span className="text-gray-500">Ngân hàng:</span>{" "}
              <b>{nhan.nganhang_ten}</b>
            </p>
            <p>
              <span className="text-gray-500">Số tài khoản:</span>{" "}
              <b className="tracking-wide">{nhan.so_tai_khoan}</b>
            </p>
            <p>
              <span className="text-gray-500">Chủ tài khoản:</span>{" "}
              {nhan.ten_tai_khoan}
            </p>
            <p>
              <span className="text-gray-500">Nội dung chuyển:</span>{" "}
              <b>{tt.noi_dung}</b>
            </p>
            {vaiTro === "TRA" && conMo && (
              <p className="text-xs text-amber-700 pt-1">
                Chuyển đúng số tiền và đúng nội dung. Chuyển thiếu sẽ chưa được
                xác nhận thanh toán.
              </p>
            )}
          </div>
          {qrUrl && (
            <img
              src={qrUrl}
              alt={`QR ${tt.noi_dung}`}
              className="h-44 w-44 rounded-xl border border-white bg-white object-contain"
            />
          )}
          {qrUrl && (
            <a
              href={qrUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 font-semibold sm:col-span-2"
            >
              Mở ảnh QR
            </a>
          )}
        </div>
      ) : qrBiHuy ? (
        <p className="mt-2 text-xs text-gray-600">
          Mã QR của khoản này đã bị huỷ. Vui lòng liên hệ Sàn trước khi chuyển
          tiền để tránh chuyển sai.
        </p>
      ) : (
        <p className="mt-2 text-xs text-gray-600">
          {nhan.ly_do ||
            "Bên nhận chưa có tài khoản nhận tiền. Sàn sẽ xác nhận thanh toán thủ công sau khi hai bên đối chiếu."}
        </p>
      )}

      {khoan.ht_baochuyen_luc && !daChi && !daHuy && (
        <p className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1">
          Bạn đã báo chuyển lúc {ngay(khoan.ht_baochuyen_luc)} · chờ Sàn đối
          soát.
        </p>
      )}

      {vaiTro === "TRA" && conMo && !qrBiHuy && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onBaoChuyen(khoan)}
            disabled={dangGui}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold"
          >
            Tôi đã chuyển khoản
          </button>
        </div>
      )}

      {ct_ma === "CT01" && vaiTro === "QUAN_TRI" && conMo && (
        <p className="mt-2 text-xs text-gray-500">
          Bên chịu trách nhiệm là Sàn — dùng màn hình quản trị để xác nhận.
        </p>
      )}
    </div>
  );
};

const ChiTietSuCoPage = ({ vaiTro, basePath }) => {
  const { ycxlsc_ma } = useParams();
  const { ct_ma, ma } = useMemo(() => layNguoiDung(vaiTro), [vaiTro]);

  const [data, setData] = useState(null);
  const [loi, setLoi] = useState("");
  const [anh, setAnh] = useState([]);
  const [pdf, setPdf] = useState([]);
  const [dangGui, setDangGui] = useState(false);
  const [bill, setBill] = useState(null);
  const [billGhiChu, setBillGhiChu] = useState("");
  const [billAnh, setBillAnh] = useState([]);
  const [billPdf, setBillPdf] = useState([]);
  const [dangBao, setDangBao] = useState(false);

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
    const id = setInterval(tai, 15000);
    return () => clearInterval(id);
  }, [tai]);

  const moBaoChuyen = (khoan) => {
    setBill(khoan);
    setBillGhiChu("");
    setBillAnh([]);
    setBillPdf([]);
  };

  const guiBaoChuyen = async () => {
    if (!bill) return;
    const fd = new FormData();
    fd.append("ct_ma", ct_ma);
    fd.append("ma", ma);
    if (billGhiChu.trim()) fd.append("ghi_chu", billGhiChu.trim());
    ganTep(fd, billAnh, billPdf);

    try {
      setDangBao(true);
      setLoi("");
      await suCoService.baoDaChuyen(ycxlsc_ma, bill.ht_ma, fd);
      setBill(null);
      await tai();
    } catch (error) {
      setLoi(
        error?.response?.data?.message || "Gửi báo chuyển khoản thất bại.",
      );
    } finally {
      setDangBao(false);
    }
  };

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
                  {h.ht_ma}: <b>{tien(h.ht_tongtienhoan)}</b> ·{" "}
                  {h.ct_tratien_ten || h.ct_tratien} →{" "}
                  {h.ct_nhantien_ten || h.ct_nhantien} ·{" "}
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

      {hoan_tien.some((h) => h.thanh_toan) && (
        <Khoi title="Thanh toán khoản bồi thường">
          <div className="space-y-3">
            {hoan_tien.map((h) => (
              <TheThanhToan
                key={h.ht_ma}
                khoan={h}
                ct_ma={ct_ma}
                onBaoChuyen={moBaoChuyen}
                dangGui={dangBao}
              />
            ))}
          </div>
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

      {bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Báo đã chuyển khoản
                </h3>
                <p className="text-sm text-gray-600">
                  Khoản {bill.ht_ma} ·{" "}
                  {tien(bill.thanh_toan?.so_tien || bill.ht_tongtienhoan)} cho{" "}
                  {bill.ct_nhantien_ten || bill.ct_nhantien}
                </p>
              </div>
              <button
                onClick={() => setBill(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Sàn sẽ đối soát sao kê của bên nhận. Khoản chỉ được đóng khi tiền
              thực sự vào tài khoản — báo chuyển không tự động xác nhận.
            </p>

            <textarea
              value={billGhiChu}
              onChange={(e) => setBillGhiChu(e.target.value)}
              rows={3}
              placeholder="Ghi chú cho Sàn (mã giao dịch, thời điểm chuyển...)"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Ảnh chụp chuyển khoản (không bắt buộc)
              </p>
              <ChonTep
                anh={billAnh}
                setAnh={setBillAnh}
                pdf={billPdf}
                setPdf={setBillPdf}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setBill(null)}
                disabled={dangBao}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={guiBaoChuyen}
                disabled={dangBao}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold"
              >
                {dangBao ? "Đang gửi..." : "Gửi báo chuyển"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChiTietSuCoPage;
