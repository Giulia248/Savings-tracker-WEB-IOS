import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactMoney, formatMoney } from "../lib/format";
import type { MonthPoint } from "../lib/summary";
import { useThemeColors } from "../theme/preference";

const SERIES_NAMES: Record<string, string> = {
  incomeCents: "Earned",
  spendingCents: "Spent",
  savedCents: "Kept",
};

export function CashflowChart({ data, currency }: { data: MonthPoint[]; currency: string }) {
  const colors = useThemeColors();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={colors.border} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: colors.muted }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tick={{ fill: colors.muted }}
          tickFormatter={(value: number) => formatCompactMoney(value, currency)}
        />
        <Tooltip
          cursor={{ fill: colors.border, opacity: 0.4 }}
          contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
          labelStyle={{ color: colors.text, fontWeight: 600 }}
          formatter={(value, name) => [formatMoney(Number(value), currency), SERIES_NAMES[String(name)] ?? name]}
        />
        <Legend formatter={(name: string) => <span style={{ color: colors.text }}>{SERIES_NAMES[name]}</span>} />
        <Bar dataKey="incomeCents" fill={colors.income} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="spendingCents" fill={colors.spending} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line dataKey="savedCents" stroke={colors.text} strokeWidth={2} dot={{ r: 3, fill: colors.text }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
