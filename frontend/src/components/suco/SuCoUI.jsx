// frontend/src/components/suco/SuCoUI.jsx
import { urlTep } from "../../services/suco/suCoService";

export const NGUOI_DUNG = {
  shop: (u) => ({ ct_ma: "CT02", ma: u.GH_Ma || u.gh_ma || u.id }),
  dvvc: (u) => ({ ct_ma: "CT03", ma: u.DVVC_Ma || u.dvvc_ma || u.id }),
  khachhang: (u) => ({ ct_ma: "CT04", ma: u.kh_ma || u.id }),
  shipper: (u) => ({ ct_ma: "CT05", ma: u.shipper_ma || u.id }),
};

export const layNguoiDung = (vaiTro) => {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }
  const f = NGUOI_DUNG[vaiTro];
  return f ? f(user) : { ct_ma: "", ma: "" };
};

export const TRANG_THAI = {
  TTXLSC01: {
    ten: "Chờ tiếp nhận",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  TTXLSC02: {
    ten: "Đang xem xét",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  TTXLSC03: {
    ten: "Yêu cầu bổ sung",
    cls: "bg-purple-50 text-purple-700 border-purple-200",
  },
  TTXLSC04: {
    ten: "Đã kết luận",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  TTXLSC05: {
    ten: "Hoàn tất",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  TTXLSC06: {
    ten: "Từ chối",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  },
  TTXLSC07: { ten: "Đã hủy", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

export const HUONG_XU_LY = {
  KHONG_DEN: "Không đền",
  HOAN_TIEN: "Hoàn tiền",
  BOI_THUONG: "Bồi thường",
  KHAC: "Xử lý khác",
};

export const VAI_TRO_TN = {
  CHIU_TRACH_NHIEM: "Chịu trách nhiệm",
  BI_ANH_HUONG: "Bị ảnh hưởng",
};

export const tien = (v) => `${Number(v || 0).toLocaleString("vi-VN")} đ`;

export const ngay = (v) =>
  v
    ? new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";

export const ngayNgan = (v) =>
  v
    ? new Date(v).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";

// Đếm ngược SLA từ số giây backend trả về
export const demNguoc = (giay) => {
  if (giay === null || giay === undefined) return "";
  const am = giay < 0;
  let s = Math.abs(Math.round(giay));
  const ngay_ = Math.floor(s / 86400);
  s -= ngay_ * 86400;
  const gio = Math.floor(s / 3600);
  s -= gio * 3600;
  const phut = Math.floor(s / 60);
  const phan = [
    ngay_ ? `${ngay_} ngày` : "",
    gio ? `${gio} giờ` : "",
    `${phut} phút`,
  ]
    .filter(Boolean)
    .join(" ");
  return am ? `Quá hạn ${phan}` : `Còn ${phan}`;
};

export const Badge = ({ ma, ten }) => {
  const tt = TRANG_THAI[ma] || {
    ten: ten || ma,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${tt.cls}`}
    >
      {tt.ten}
    </span>
  );
};

export const NhanSla = ({ phieu }) => {
  if (!phieu) return null;
  const dangMo = ["TTXLSC01", "TTXLSC02", "TTXLSC03"].includes(
    phieu.ycxlsc_trang_thai,
  );
  if (!dangMo) return null;
  if (phieu.qua_han_ket_luan) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
        <span className="material-symbols-outlined text-base">timer_off</span>
        {demNguoc(phieu.con_lai_giay)}
      </span>
    );
  }
  if (phieu.sap_han) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
        <span className="material-symbols-outlined text-base">timer</span>
        {demNguoc(phieu.con_lai_giay)}
      </span>
    );
  }
  if (phieu.con_lai_giay === null || phieu.con_lai_giay === undefined)
    return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      <span className="material-symbols-outlined text-base">schedule</span>
      {demNguoc(phieu.con_lai_giay)}
    </span>
  );
};

export const Khoi = ({ title, right, children, className = "" }) => (
  <section
    className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}
  >
    {(title || right) && (
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-800">{title}</h3>
        {right}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

export const TepDinhKem = ({ ds = [] }) => {
  if (!ds.length)
    return <p className="text-sm text-gray-400">Chưa có minh chứng.</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {ds.map((t) => {
        const laAnh = t.mcsc_loai === "IMAGE";
        const href = urlTep(t.mcsc_duongdan || t.mcsc_video);
        return (
          <a
            key={t.mcsc_ma}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group rounded-lg border border-gray-200 overflow-hidden hover:border-blue-400"
          >
            {laAnh ? (
              <img
                src={href}
                alt={t.mcsc_ten}
                className="h-24 w-full object-cover"
              />
            ) : (
              <div className="h-24 w-full flex items-center justify-center bg-gray-50 text-gray-400">
                <span className="material-symbols-outlined text-3xl">
                  picture_as_pdf
                </span>
              </div>
            )}
            <p className="px-2 py-1.5 text-xs text-gray-600 truncate">
              {t.mcsc_ten}
            </p>
          </a>
        );
      })}
    </div>
  );
};

export const ChonTep = ({ anh, setAnh, pdf, setPdf }) => {
  const chonAnh = (e) => {
    const ds = Array.from(e.target.files || []).slice(0, 3);
    setAnh(ds);
  };
  const chonPdf = (e) => {
    const ds = Array.from(e.target.files || []).slice(0, 2);
    setPdf(ds);
  };

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <label className="border border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-blue-400">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="material-symbols-outlined text-blue-600">image</span>
          Ảnh minh chứng (tối đa 3)
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={chonAnh}
        />
        <p className="mt-1 text-xs text-gray-500 truncate">
          {anh.length ? anh.map((f) => f.name).join(", ") : "Chưa chọn ảnh"}
        </p>
      </label>

      <label className="border border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-blue-400">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="material-symbols-outlined text-red-600">
            picture_as_pdf
          </span>
          Tệp PDF (tối đa 2)
        </span>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={chonPdf}
        />
        <p className="mt-1 text-xs text-gray-500 truncate">
          {pdf.length ? pdf.map((f) => f.name).join(", ") : "Chưa chọn PDF"}
        </p>
      </label>
    </div>
  );
};

export const ganTep = (fd, anh = [], pdf = []) => {
  anh.forEach((f) => fd.append("anh", f));
  pdf.forEach((f) => fd.append("pdf", f));
  return fd;
};
