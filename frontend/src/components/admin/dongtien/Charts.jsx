// frontend/src/components/admin/dongtien/Charts.jsx
// Biểu đồ SVG thuần, không cần thư viện chart.

export const CHART_COLORS = {
  vao: "#0ea5e9",
  ra: "#f97316",
  net: "#10b981",
  shop: "#6366f1",
  san: "#f59e0b",
  dvvc: "#ef4444",
  giu: "#10b981",
};

export const fmtShort = (n) => {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  if (a >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`;
  if (a >= 1e6) return `${(v / 1e6).toFixed(0)} tr`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(0)} ng`;
  return `${v}`;
};

const Legend = ({ color, label, line }) => (
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

// ===== Cột thu/chi + đường chênh lệch =====
export const BarLineChart = ({
  data = [],
  labels = { vao: "Tiền vào", ra: "Tiền ra", net: "Chênh lệch" },
}) => {
  const W = 780,
    H = 300,
    pad = { l: 66, r: 18, t: 18, b: 34 };
  const pw = W - pad.l - pad.r,
    ph = H - pad.t - pad.b;
  const vals = data.flatMap((d) => [
    Number(d.vao) || 0,
    Number(d.ra) || 0,
    Number(d.net) || 0,
  ]);
  const maxV = Math.max(1, ...vals),
    minV = Math.min(0, ...vals),
    span = maxV - minV || 1;
  const yOf = (v) => pad.t + ph - ((v - minV) / span) * ph;
  const step = pw / Math.max(data.length, 1),
    barW = Math.min(20, step * 0.26);
  const cx = (i) => pad.l + step * i + step / 2;
  const pts = data
    .map((d, i) => `${cx(i)},${yOf(Number(d.net) || 0)}`)
    .join(" ");

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <Legend color={CHART_COLORS.vao} label={labels.vao} />
        <Legend color={CHART_COLORS.ra} label={labels.ra} />
        <Legend color={CHART_COLORS.net} label={labels.net} line />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const v = minV + span * t,
            y = yOf(v);
          return (
            <g key={idx}>
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
                {fmtShort(v)}
              </text>
            </g>
          );
        })}
        {minV < 0 && (
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={yOf(0)}
            y2={yOf(0)}
            stroke="#94A3B8"
          />
        )}
        {data.map((d, i) => {
          const vao = Number(d.vao) || 0,
            ra = Number(d.ra) || 0;
          return (
            <g key={i}>
              <rect
                x={cx(i) - barW - 2}
                y={yOf(Math.max(vao, 0))}
                width={barW}
                height={Math.abs(yOf(vao) - yOf(0))}
                fill={CHART_COLORS.vao}
                rx="3"
              >
                <title>{`${d.label} — ${labels.vao}: ${fmtShort(vao)}`}</title>
              </rect>
              <rect
                x={cx(i) + 2}
                y={yOf(Math.max(ra, 0))}
                width={barW}
                height={Math.abs(yOf(ra) - yOf(0))}
                fill={CHART_COLORS.ra}
                rx="3"
              >
                <title>{`${d.label} — ${labels.ra}: ${fmtShort(ra)}`}</title>
              </rect>
              <text
                x={cx(i)}
                y={H - 12}
                textAnchor="middle"
                fontSize="11"
                fill="#64748B"
              >
                {d.label}
              </text>
            </g>
          );
        })}
        {data.length > 1 && (
          <polyline
            points={pts}
            fill="none"
            stroke={CHART_COLORS.net}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {data.map((d, i) => (
          <circle
            key={`p${i}`}
            cx={cx(i)}
            cy={yOf(Number(d.net) || 0)}
            r="3.5"
            fill="#fff"
            stroke={CHART_COLORS.net}
            strokeWidth="2"
          >
            <title>{`${d.label} — ${labels.net}: ${fmtShort(d.net)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

// ===== Đường xu hướng theo năm (2 series) =====
export const YearLineChart = ({
  data = [],
  labels = { a: "Tiền vào", b: "Phí sàn" },
}) => {
  const W = 780,
    H = 260,
    pad = { l: 66, r: 18, t: 18, b: 34 };
  const pw = W - pad.l - pad.r,
    ph = H - pad.t - pad.b;
  const maxV = Math.max(
    1,
    ...data.flatMap((d) => [Number(d.a) || 0, Number(d.b) || 0]),
  );
  const yOf = (v) => pad.t + ph - ((Number(v) || 0) / maxV) * ph;
  const step = pw / Math.max(data.length - 1, 1);
  const cx = (i) => (data.length === 1 ? pad.l + pw / 2 : pad.l + step * i);
  const line = (key) => data.map((d, i) => `${cx(i)},${yOf(d[key])}`).join(" ");

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <Legend color={CHART_COLORS.vao} label={labels.a} line />
        <Legend color={CHART_COLORS.san} label={labels.b} line />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const y = pad.t + ph - ph * t;
          return (
            <g key={idx}>
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
        <polyline
          points={line("a")}
          fill="none"
          stroke={CHART_COLORS.vao}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polyline
          points={line("b")}
          fill="none"
          stroke={CHART_COLORS.san}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={cx(i)}
              cy={yOf(d.a)}
              r="3.5"
              fill="#fff"
              stroke={CHART_COLORS.vao}
              strokeWidth="2"
            >
              <title>{`${d.label} — ${labels.a}: ${fmtShort(d.a)}`}</title>
            </circle>
            <circle
              cx={cx(i)}
              cy={yOf(d.b)}
              r="3.5"
              fill="#fff"
              stroke={CHART_COLORS.san}
              strokeWidth="2"
            >
              <title>{`${d.label} — ${labels.b}: ${fmtShort(d.b)}`}</title>
            </circle>
            <text
              x={cx(i)}
              y={H - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#64748B"
            >
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ===== Donut =====
const fmtFull = (n) => `${(Number(n) || 0).toLocaleString("vi-VN")} đ`;

export const DonutChart = ({ items = [] }) => {
  const total = items.reduce((s, i) => s + (Number(i.value) || 0), 0);
  const R = 68;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <svg viewBox="0 0 180 180" className="h-[168px] w-[168px] shrink-0">
        <circle
          cx="90"
          cy="90"
          r={R}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="26"
        />
        {items.map((it, idx) => {
          const v = Number(it.value) || 0;
          const dash = total > 0 ? (v / total) * C : 0;
          const node = (
            <circle
              key={idx}
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={it.color}
              strokeWidth="26"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 90 90)"
            >
              <title>{`${it.label}: ${fmtFull(v)}`}</title>
            </circle>
          );
          acc += dash;
          return node;
        })}
        <text x="90" y="86" textAnchor="middle" fontSize="11" fill="#94A3B8">
          Tổng
        </text>
        <text
          x="90"
          y="104"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#0F172A"
        >
          {fmtShort(total)}
        </text>
      </svg>

      <ul className="w-full min-w-0 space-y-2 text-sm">
        {items.map((it, idx) => {
          const v = Number(it.value) || 0;
          const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0.0";
          return (
            <li
              key={idx}
              className="flex min-w-0 items-center justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-2 text-slate-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: it.color }}
                />
                <span className="truncate">{it.label}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-slate-800">
                {fmtFull(v)}{" "}
                <span className="font-normal text-slate-400">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ===== Thanh ngang xếp chồng =====
export const StackedBarChart = ({ rows = [] }) => {
  const maxTotal = Math.max(
    1,
    ...rows.map((r) => r.parts.reduce((s, p) => s + (Number(p.value) || 0), 0)),
  );

  return (
    <div className="space-y-3">
      {rows.map((r, idx) => {
        const total = r.parts.reduce((s, p) => s + (Number(p.value) || 0), 0);
        return (
          <div key={idx} className="flex items-center gap-3">
            <div
              className="w-28 shrink-0 truncate text-sm text-slate-600"
              title={r.label}
            >
              {r.label}
            </div>
            <div className="h-6 flex-1 overflow-hidden rounded-md bg-slate-100/70">
              <div
                className="flex h-full"
                style={{ width: `${(total / maxTotal) * 100}%` }}
              >
                {r.parts.map((p, i) => {
                  const v = Number(p.value) || 0;
                  if (v <= 0) return null;
                  return (
                    <div
                      key={i}
                      title={`${p.label}: ${fmtShort(v)}`}
                      style={{
                        width: `${(v / total) * 100}%`,
                        background: p.color,
                      }}
                      className="h-full"
                    />
                  );
                })}
              </div>
            </div>
            <div className="w-20 shrink-0 text-right text-sm font-semibold text-slate-700">
              {fmtShort(total)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
