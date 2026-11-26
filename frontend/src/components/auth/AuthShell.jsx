// frontend/src/components/auth/AuthShell.jsx
// Bộ khung giao diện dùng chung cho toàn bộ trang đăng nhập / đăng ký.
// Thuần trình bày (presentational) — KHÔNG chứa logic xác thực, KHÔNG gọi API.
import { Link } from "react-router-dom";
import { getAuthTone } from "./authTheme";

/* ---------- Khung trang ---------- */
const AuthShell = ({
  tone = "admin",
  icon = "lock",
  eyebrow = "Cổng truy cập",
  title,
  subtitle,
  panelTitle,
  panelDesc,
  panelPoints = [],
  width = "md",
  children,
  footer,
}) => {
  const t = getAuthTone(tone);

  return (
    <div className="min-h-screen bg-[#EEF2F8] text-slate-900 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* ---------- Bảng thương hiệu (desktop) ---------- */}
      <aside
        className={`relative hidden overflow-hidden p-12 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between xl:p-16 ${t.panel}`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/10 to-transparent" />
        </div>

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[22px]">
              storefront
            </span>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide">CT255</p>
            <p className="text-xs text-white/70">Sàn thương mại điện tử</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 ring-1 ring-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            {eyebrow}
          </span>
          <h1 className="mt-5 text-[34px] font-bold leading-[1.15] tracking-tight xl:text-[40px]">
            {panelTitle}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            {panelDesc}
          </p>

          {panelPoints.length > 0 && (
            <ul className="mt-8 space-y-3">
              {panelPoints.map((point) => (
                <li
                  key={point.text}
                  className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm"
                >
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-white/90">
                    {point.icon}
                  </span>
                  <span className="text-sm leading-relaxed text-white/90">
                    {point.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="relative text-xs text-white/60">
          © 2026 CT255 · Nền tảng thương mại điện tử
        </p>
      </aside>

      {/* ---------- Khu vực form ---------- */}
      <main className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:py-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/60 blur-3xl" />
          <div className="absolute -right-16 top-1/4 h-56 w-56 rounded-full bg-[#CBD5E1]/50 blur-3xl" />
        </div>

        <div
          className={`relative w-full ${width === "xl" ? "max-w-2xl" : "max-w-md"}`}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              to="/"
              className={`group inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:bg-white ${t.homeHover}`}
            >
              <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:-translate-x-0.5">
                arrow_back
              </span>
              Về trang chủ
            </Link>
            <span
              className={`hidden rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ring-1 sm:inline-flex ${t.chip}`}
            >
              {eyebrow}
            </span>
          </div>

          <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5">
            <div
              className={`relative overflow-hidden px-6 py-7 sm:px-8 ${t.header}`}
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                <div className="absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
              </div>
              <div className="relative flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[26px] text-white">
                    {icon}
                  </span>
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-[22px]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-1 text-[13px] leading-snug text-white/85">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-8 sm:py-8">{children}</div>
          </div>

          {footer && (
            <div className="mt-5 text-center text-[13px] leading-relaxed text-slate-600">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

/* ---------- Nhãn + icon cho một trường ---------- */
export const AuthField = ({
  label,
  icon,
  required = false,
  hint,
  className = "",
  children,
}) => (
  <div className={className}>
    {label && (
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[20px] text-slate-400">
          {icon}
        </span>
      )}
      {children}
    </div>
    {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
  </div>
);

/* ---------- Hộp thông báo lỗi ---------- */
export const AuthAlert = ({ children }) => (
  <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
    <span className="material-symbols-outlined mt-px text-[20px] leading-5">
      error
    </span>
    <span className="leading-5">{children}</span>
  </div>
);

/* ---------- Nút gửi form ---------- */
export const AuthSubmit = ({
  tone = "admin",
  icon = "login",
  loading = false,
  loadingText = "Đang xử lý...",
  children,
}) => {
  const t = getAuthTone(tone);

  return (
    <button
      type="submit"
      disabled={loading}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${t.button}`}
    >
      {loading ? (
        <>
          <span className="material-symbols-outlined animate-spin text-[20px]">
            progress_activity
          </span>
          {loadingText}
        </>
      ) : (
        <>
          {icon && (
            <span className="material-symbols-outlined text-[20px]">
              {icon}
            </span>
          )}
          {children}
        </>
      )}
    </button>
  );
};

/* ---------- Tiêu đề nhóm trường trong form đăng ký ---------- */
export const AuthSection = ({ step, title, description, tone = "admin" }) => {
  const t = getAuthTone(tone);

  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${t.step}`}
      >
        {step}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

/* ---------- Ô chọn ảnh dạng dropzone ---------- */
export const AuthFileField = ({ label, hint, tone = "admin", onChange }) => {
  const t = getAuthTone(tone);

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
          {label}
        </label>
      )}
      <label
        className={`group flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 transition-all duration-200 ${t.fileHover}`}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${t.iconSoft}`}
        >
          <span className="material-symbols-outlined text-[20px]">
            add_photo_alternate
          </span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-700">
            Chọn ảnh từ thiết bị
          </span>
          <span className="block truncate text-xs text-slate-400">
            {hint || "PNG, JPG · Không bắt buộc"}
          </span>
        </span>
        <span className="material-symbols-outlined ml-auto text-[20px] text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5">
          upload
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={onChange}
          className="sr-only"
        />
      </label>
    </div>
  );
};

export default AuthShell;
