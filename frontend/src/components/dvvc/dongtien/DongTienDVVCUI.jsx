// frontend/src/components/dvvc/dongtien/DongTienDVVCUI.jsx
import { useMemo } from "react";
import { money } from "../../admin/dongtien/DongTienUI";
import { CHART_COLORS, fmtShort } from "../../admin/dongtien/Charts";

export const EMPTY = [];

export const TH =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";

export const TD = "px-3 py-2.5 text-sm text-slate-700";

export const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const fmtDay = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
};

export const downloadCsv = (name, headers, rows) => {
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const TONES = {
  amber: {
    box: "border-amber-200 bg-amber-50",
    label: "text-amber-700",
    value: "text-amber-900",
  },
  sky: {
    box: "border-sky-200 bg-sky-50",
    label: "text-sky-700",
    value: "text-sky-900",
  },
  red: {
    box: "border-rose-200 bg-rose-50",
    label: "text-rose-700",
    value: "text-rose-900",
  },
  emerald: {
    box: "border-emerald-200 bg-emerald-50",
    label: "text-emerald-700",
    value: "text-emerald-900",
  },
  slate: {
    box: "border-slate-200 bg-slate-50",
    label: "text-slate-600",
    value: "text-slate-800",
  },
};

const LINE_SERIES = [
  { key: "shipper_giu", label: "Shipper giữ", color: CHART_COLORS.vao },
  { key: "kho_giu", label: "Kho giữ", color: CHART_COLORS.san },
  {
    key: "san_chua_chuyen",
    label: "Sàn chưa chuyển",
    color: CHART_COLORS.dvvc,
  },
];

const ChartLegend = ({ color, label, line = false }) => (
  <span className="inline-flex items-center gap-1.5">
    {line ? (
      <span
        className="inline-block h-0.5 w-4 rounded"
        style={{ background: color }}
      />
    ) : (
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: color }}
      />
    )}
    {label}
  </span>
);

export const BalanceChart = ({
  rows = [],
  mode = "thang",
  highlightThang = null,
}) => {
  const data = useMemo(
    () =>
      (rows || []).map((r) => ({
        label: mode === "thang" ? `T${r.thang}` : `${r.nam}`,
        thang: r.thang,
        nam: r.nam,
        shipper_giu: num(r.shipper_giu),
        kho_giu: num(r.kho_giu),
        san_chua_chuyen: num(r.san_chua_chuyen),
        san_da_chuyen: num(r.san_da_chuyen),
      })),
    [rows, mode],
  );

  if (data.length === 0) return null;

  const W = 920;
  const H = 340;
  const pad = { l: 74, r: 18, t: 20, b: 42 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const maxV = Math.max(
    1,
    ...data.flatMap((d) => [
      d.shipper_giu,
      d.kho_giu,
      d.san_chua_chuyen,
      d.san_da_chuyen,
    ]),
  );
  const yOf = (value) =>
    pad.t + ph - (Math.max(0, Number(value) || 0) / maxV) * ph;
  const step = pw / Math.max(data.length, 1);
  const cx = (index) => pad.l + step * index + step / 2;
  const barW = Math.min(24, step * 0.34);
  const line = (key) =>
    data.map((d, index) => `${cx(index)},${yOf(d[key])}`).join(" ");
  const y0 = yOf(0);
  const highlightIndex =
    mode === "thang" &&
    Number(highlightThang) >= 1 &&
    Number(highlightThang) <= 12
      ? Number(highlightThang) - 1
      : -1;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {LINE_SERIES.map((s) => (
          <ChartLegend key={s.key} color={s.color} label={s.label} line />
        ))}
        <ChartLegend color={CHART_COLORS.giu} label="Sàn đã chuyển (cột)" />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        {highlightIndex >= 0 && highlightIndex < data.length && (
          <rect
            x={cx(highlightIndex) - step / 2}
            y={pad.t}
            width={step}
            height={ph}
            fill="#F8FAFC"
          />
        )}

        {[0, 0.25, 0.5, 0.75, 1].map((t, index) => {
          const y = pad.t + ph - ph * t;
          return (
            <g key={index}>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={y}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 4"
              />
              <text
                x={pad.l - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94A3B8"
              >
                {fmtShort(maxV * t)}
              </text>
            </g>
          );
        })}

        {data.map((d, index) => {
          const height = Math.max(0, y0 - yOf(d.san_da_chuyen));
          return (
            <rect
              key={`bar-${index}`}
              x={cx(index) - barW / 2}
              y={yOf(d.san_da_chuyen)}
              width={barW}
              height={height}
              rx="3"
              fill={CHART_COLORS.giu}
              opacity="0.9"
            >
              <title>{`${d.label} — Sàn đã chuyển: ${fmtShort(
                d.san_da_chuyen,
              )}`}</title>
            </rect>
          );
        })}

        {LINE_SERIES.map((s) => (
          <polyline
            key={s.key}
            points={line(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {LINE_SERIES.map((s) =>
          data.map((d, index) => (
            <circle
              key={`${s.key}-${index}`}
              cx={cx(index)}
              cy={yOf(d[s.key])}
              r="3.5"
              fill="#fff"
              stroke={s.color}
              strokeWidth="2"
            >
              <title>{`${d.label} — ${s.label}: ${fmtShort(d[s.key])}`}</title>
            </circle>
          )),
        )}

        {data.map((d, index) => {
          const active =
            mode === "thang" && Number(highlightThang) === Number(d.thang);

          return (
            <text
              key={`label-${index}`}
              x={cx(index)}
              y={H - 14}
              textAnchor="middle"
              fontSize="11"
              fontWeight={active ? "700" : "400"}
              fill={active ? "#0F172A" : "#64748B"}
            >
              {d.label}
            </text>
          );
        })}
      </svg>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        Ba đường là số dư cuối kỳ của tiền shipper giữ, kho giữ và sàn còn phải
        chuyển. Cột xanh là tiền sàn đã chuyển trong kỳ.
      </p>
    </div>
  );
};

export const MiniMoney = ({ label, value, hint, tone = "slate" }) => {
  const t = TONES[tone] || TONES.slate;

  return (
    <div className={`rounded-xl border p-3 ${t.box}`}>
      <p className={`text-[11px] font-medium ${t.label}`}>{label}</p>
      <p className={`mt-1 text-lg font-bold ${t.value}`}>{money(value || 0)}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
};

export const ReconRow = ({ label, value, hint, tone = "slate" }) => {
  const t = TONES[tone] || TONES.slate;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${t.box}`}
    >
      <div className="min-w-0">
        <p className={`text-xs font-medium ${t.label}`}>{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
      </div>
      <p className={`shrink-0 text-sm font-bold ${t.value}`}>
        {money(value || 0)}
      </p>
    </div>
  );
};

export const PhieuStatusBadge = ({ status }) => {
  const paid = status === "DA_THANH_TOAN";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {paid ? "Đã chuyển" : "Chờ QR"}
    </span>
  );
};

export const GiuBadge = ({ value }) => {
  if (value !== "SHIPPER" && value !== "KHO") {
    return <span className="text-slate-400">—</span>;
  }

  const shipper = value === "SHIPPER";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        shipper ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {shipper ? "Shipper giữ" : "Kho giữ"}
    </span>
  );
};
