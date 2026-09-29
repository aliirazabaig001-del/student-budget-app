import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AXIS = { axisLine: false, tickLine: false, tick: { fontSize: 10, fill: '#8793a5' } };
const TOOLTIP = { contentStyle: { border: '1px solid #dde3eb', borderRadius: 8, fontSize: 11 } };

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

/** Line/area trend chart; the first series is filled. */
export function TrendAreaChart({
  data,
  xKey,
  series,
  height = 280,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sl-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c2b49" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#1c2b49" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#edf0f4" />
          <XAxis dataKey={xKey} {...AXIS} />
          <YAxis {...AXIS} />
          <Tooltip {...TOOLTIP} />
          {series.map((s, index) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              fill={index === 0 ? 'url(#sl-area-fill)' : 'transparent'}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Legend chips for a chart panel header. */
export function ChartLegend({ series }: { series: SeriesDef[] }) {
  return (
    <div className="flex items-center gap-4 text-[10px] font-semibold text-muted-foreground">
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <i className="size-2 rounded-full" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
