// Class dùng chung cho input và nút
export const fieldBase =
  "w-full rounded-xl border border-[#D9D4C7] bg-[#FBFAF7] px-4 py-2.5 text-sm text-[#14201C] placeholder:text-[#9AA39E] transition-all focus:border-[#F2A93B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#F2A93B]/20 disabled:cursor-not-allowed disabled:opacity-60";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#14201C] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1E3A34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B] disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[#D9CFC2] bg-white px-5 py-2.5 text-sm font-medium text-[#3D4A44] transition-colors hover:bg-[#F7F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A93B]";

export const AccountHeader = ({ title, subtitle }) => (
  <div>
    <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#14201C]">
      {title}
    </h1>
    {subtitle && (
      <p className="mt-1.5 text-sm leading-relaxed text-[#5B6661]">{subtitle}</p>
    )}
  </div>
);

export const AccountSection = ({ title, description, icon, children }) => (
  <section className="overflow-hidden rounded-2xl border border-[#E2DED3] bg-white shadow-[0_1px_0_rgba(20,32,28,0.04)]">
    <header className="flex items-start gap-3 border-b border-[#EFEBE2] px-6 py-5">
      {icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FDF3E1] text-[#B7791F]">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
      )}
      <div>
        <h2 className="text-base font-semibold text-[#14201C]">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-[#5B6661]">{description}</p>}
      </div>
    </header>
    <div className="p-6">{children}</div>
  </section>
);

export const AccountProfileCard = ({
  avatarUrl,
  name,
  email,
  stats = [],
  fallbackIcon = "person",
  children,
}) => (
  <aside className="flex flex-col self-start rounded-2xl border border-[#E2DED3] bg-white p-6 shadow-[0_1px_0_rgba(20,32,28,0.04)]">
    <div className="flex flex-col items-center text-center">
      <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-[#FBFAF7] bg-[#F1EEE6] shadow-md ring-1 ring-[#E2DED3]">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-[#9AA39E]">
            <span className="material-symbols-outlined text-[44px]">{fallbackIcon}</span>
          </div>
        )}
      </div>
      <h2 className="mt-4 break-words text-lg font-bold text-[#14201C]">{name}</h2>
      <p className="mt-0.5 break-all text-sm text-[#5B6661]">{email}</p>
    </div>

    {stats.length > 0 && (
      <dl
        className="mt-6 grid divide-x divide-[#EFEBE2] rounded-xl border border-[#EFEBE2] bg-[#FBFAF7]"
        style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="px-3 py-4 text-center">
            <dd className="flex items-center justify-center gap-1 text-2xl font-bold tabular-nums text-[#14201C]">
              {stat.value}
              {stat.icon && (
                <span className="material-symbols-outlined text-[18px] text-[#F2A93B]">
                  {stat.icon}
                </span>
              )}
            </dd>
            <dt className="mt-1 text-xs font-medium text-[#7A857F]">{stat.label}</dt>
          </div>
        ))}
      </dl>
    )}

    {children && <div className="mt-6 border-t border-[#EFEBE2] pt-6">{children}</div>}
  </aside>
);

export const AccountLoading = ({ label = "Đang tải thông tin..." }) => (
  <div className="flex h-64 flex-col items-center justify-center gap-3 text-[#7A857F]">
    <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#E2DED3] border-t-[#F2A93B]" />
    <p className="text-sm">{label}</p>
  </div>
);

// Bọc trường nhập liệu với nhãn, dấu * và gợi ý
export const FormField = ({ label, required = false, hint, children, className = "" }) => (
  <label className={`block space-y-1.5 ${className}`}>
    <span className="block text-sm font-semibold text-[#3D4A44]">
      {label}
      {required && <span className="ml-0.5 text-[#B42318]">*</span>}
    </span>
    {children}
    {hint && <span className="block text-xs leading-relaxed text-[#7A857F]">{hint}</span>}
  </label>
);
