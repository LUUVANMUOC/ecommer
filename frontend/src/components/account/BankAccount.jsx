// src/components/account/BankAccount.jsx
import { useEffect } from "react";
import { toAssetUrl, buildVietQrUrl } from "../../utils/accountUtils";
import {
  FormField,
  fieldBase,
  btnPrimary,
  btnSecondary,
} from "./AccountLayout";

const BankAccountCard = ({ bank, onShowQR, onDelete }) => {
  // ✅ Fallback cho Sàn, Shop, Khách hàng và ĐVVC
  const soTaiKhoan =
    bank.ttnt_gianhang_sotaikhoan ||
    bank.ttnt_kh_sotaikhoan ||
    bank.TTNT_STMDT_SoTaiKhoan ||
    bank.ttnt_dvvc_sotaikhoan ||
    bank.TTNT_DVVC_SoTaiKhoan;
  const tenChuTaiKhoan =
    bank.ttnt_gianhang_tentaikhoan ||
    bank.ttnt_kh_tennguoinhan ||
    bank.TTNT_STMDT_TenTaiKhoan ||
    bank.ttnt_dvvc_tentaikhoan ||
    bank.TTNT_DVVC_TenTaiKhoan;

  return (
    <div className="rounded-2xl border border-[#E2DED3] bg-[#FBFAF7] p-5">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#E2DED3] bg-white p-1.5">
          {bank.nhg_logo || bank.NHG_Logo ? (
            <img
              src={toAssetUrl(bank.nhg_logo || bank.NHG_Logo)}
              alt={bank.nhg_ten || bank.NHG_Ten}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="material-symbols-outlined text-[#9AA39E]">
              account_balance
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#14201C]">
            {bank.nhg_ten || bank.NHG_Ten}
          </p>
          <p className="font-mono text-sm tabular-nums text-[#3D4A44]">
            {soTaiKhoan}
          </p>
        </div>
      </div>

      <p className="mt-4 border-t border-[#EFEBE2] pt-4 text-sm text-[#5B6661]">
        Chủ tài khoản:{" "}
        <span className="font-semibold uppercase text-[#14201C]">
          {tenChuTaiKhoan}
        </span>
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onShowQR}
          className={`${btnSecondary} flex-1`}
        >
          <span className="material-symbols-outlined text-[20px] text-[#B7791F]">
            qr_code_2
          </span>
          Xem mã QR
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Xóa tài khoản"
          aria-label="Xóa tài khoản"
          className="grid h-10 w-10 place-items-center rounded-full border border-[#F0C4AE] bg-[#FBEDE4] text-[#B42318] transition-colors hover:bg-[#F6DCCD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]/40"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
};

const BankAccountForm = ({ banks, value, onChange, onSubmit, saving }) => {
  // ✅ Fallback nhận diện key an toàn
  const selectedBank =
    value.NganHang_Ma || value.nh_ma || value.nganhang_ma || "";
  const tenTaiKhoan =
    value.TTNT_STMDT_TenTaiKhoan ||
    value.ttnt_gianhang_tentaikhoan ||
    value.ttnt_kh_tennguoinhan ||
    value.TTNT_DVVC_TenTaiKhoan ||
    value.ttnt_dvvc_tentaikhoan ||
    "";
  const soTaiKhoan =
    value.TTNT_STMDT_SoTaiKhoan ||
    value.ttnt_gianhang_sotaikhoan ||
    value.ttnt_kh_sotaikhoan ||
    value.TTNT_DVVC_SoTaiKhoan ||
    value.ttnt_dvvc_sotaikhoan ||
    "";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormField label="Ngân hàng" required>
        <select
          value={selectedBank}
          onChange={(e) =>
            onChange({
              NganHang_Ma: e.target.value,
              nh_ma: e.target.value,
              nganhang_ma: e.target.value,
            })
          }
          className={fieldBase}
          required
        >
          <option value="">-- Chọn ngân hàng --</option>
          {banks.map((b, index) => (
            <option
              key={b.nhg_ma || b.NHG_Ma || `bank-${index}`}
              value={b.nhg_ma || b.NHG_Ma}
            >
              {b.nhg_ten || b.NHG_Ten}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Tên chủ tài khoản"
        required
        hint="Viết không dấu, ví dụ: NGUYEN VAN A"
      >
        <input
          type="text"
          value={tenTaiKhoan}
          onChange={(e) =>
            onChange({
              TTNT_STMDT_TenTaiKhoan: e.target.value.toUpperCase(),
              ttnt_gianhang_tentaikhoan: e.target.value.toUpperCase(),
              ttnt_kh_tennguoinhan: e.target.value.toUpperCase(),
              TTNT_DVVC_TenTaiKhoan: e.target.value.toUpperCase(),
              ttnt_dvvc_tentaikhoan: e.target.value.toUpperCase(),
            })
          }
          className={`${fieldBase} uppercase`}
          placeholder="VD: NGUYEN VAN A"
          required
        />
      </FormField>

      <FormField label="Số tài khoản" required>
        <input
          type="text"
          inputMode="numeric"
          maxLength={14}
          value={soTaiKhoan}
          onChange={(e) =>
            onChange({
              TTNT_STMDT_SoTaiKhoan: e.target.value,
              ttnt_gianhang_sotaikhoan: e.target.value,
              ttnt_kh_sotaikhoan: e.target.value,
              TTNT_DVVC_SoTaiKhoan: e.target.value,
              ttnt_dvvc_sotaikhoan: e.target.value,
            })
          }
          className={`${fieldBase} font-mono tabular-nums`}
          placeholder="Tối đa 14 số"
          required
        />
      </FormField>

      <button
        type="submit"
        disabled={saving}
        className={`${btnPrimary} w-full`}
      >
        {saving ? "Đang lưu..." : "Lưu thông tin"}
      </button>
    </form>
  );
};

export const BankAccountSection = ({
  linkedBank,
  banks,
  bankForm,
  onBankFormChange,
  onSubmit,
  onDelete,
  onShowQR,
  saving,
}) => (
  <div className="grid gap-8 md:grid-cols-2">
    <div>
      <h3 className="mb-4 text-sm font-semibold text-[#14201C]">
        Tài khoản hiện tại
      </h3>
      {linkedBank ? (
        <BankAccountCard
          bank={linkedBank}
          onShowQR={() => onShowQR(linkedBank)}
          onDelete={onDelete}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-[#D9D4C7] bg-[#FBFAF7] p-6 text-center text-sm text-[#7A857F]">
          Chưa thiết lập tài khoản nhận tiền.
        </div>
      )}
    </div>

    <div className="rounded-2xl bg-[#FBF8F1] p-6 ring-1 ring-[#F1E6CF]">
      <h3 className="mb-4 text-sm font-semibold text-[#14201C]">
        {linkedBank ? "Cập nhật tài khoản" : "Thêm tài khoản"}
      </h3>
      <BankAccountForm
        banks={banks}
        value={bankForm}
        onChange={onBankFormChange}
        onSubmit={onSubmit}
        saving={saving}
      />
    </div>
  </div>
);

export const BankQRModal = ({ bank, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // 🟢 Thêm fallback cho ĐVVC
  const soTaiKhoan =
    bank.ttnt_gianhang_sotaikhoan ||
    bank.ttnt_kh_sotaikhoan ||
    bank.TTNT_STMDT_SoTaiKhoan ||
    bank.ttnt_dvvc_sotaikhoan ||
    bank.TTNT_DVVC_SoTaiKhoan;
  const tenChuTaiKhoan =
    bank.ttnt_gianhang_tentaikhoan ||
    bank.ttnt_kh_tennguoinhan ||
    bank.TTNT_STMDT_TenTaiKhoan ||
    bank.ttnt_dvvc_tentaikhoan ||
    bank.TTNT_DVVC_TenTaiKhoan;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14201C]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mã QR nhận tiền"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#7A857F] transition-colors hover:bg-[#F1EEE6] hover:text-[#14201C]"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="mb-5 text-center">
          <h3 className="text-lg font-bold text-[#14201C]">
            Quét mã để chuyển khoản
          </h3>
          <p className="mt-1 text-sm text-[#5B6661]">
            Sử dụng ứng dụng ngân hàng để quét
          </p>
        </div>

        <div className="mb-5 flex justify-center rounded-xl border border-[#EFEBE2] bg-[#FBFAF7] p-3">
          <img
            src={buildVietQrUrl(bank)}
            alt="Mã QR nhận tiền"
            className="h-64 w-64 object-contain"
          />
        </div>

        <dl className="space-y-2 rounded-xl border border-[#EFEBE2] bg-[#FBFAF7] p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#7A857F]">Ngân hàng</dt>
            <dd className="text-right font-semibold text-[#14201C]">
              {bank.nhg_ten || bank.NHG_Ten}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#7A857F]">Số tài khoản</dt>
            <dd className="text-right font-mono font-bold tabular-nums text-[#14201C]">
              {soTaiKhoan}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#7A857F]">Chủ tài khoản</dt>
            <dd className="text-right font-semibold uppercase text-[#14201C]">
              {tenChuTaiKhoan}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
