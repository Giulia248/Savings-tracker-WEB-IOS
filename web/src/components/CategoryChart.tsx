import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { formatMoney } from "../lib/format";
import type { CategoryPoint } from "../lib/summary";
import { useThemeColors } from "../theme/preference";

const ROW_HEIGHT = 36;

/**
 * Horizontal bars in one colour. Category names sit on the axis,
 * so the chart needs no colour per category and no legend.
 */
export function CategoryChart({ data, currency }: { data: CategoryPoint[]; currency: string }) {
  const colors = useThemeColors();

  return (
    <ResponsiveContainer width="100%" height={data.length * ROW_HEIGHT + 8}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 88, bottom: 0, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="category"
          width={96}
          tickLine={false}
          axisLine={false}
          tick={{ fill: colors.text }}
        />
        <Bar dataKey="amountCents" fill={colors.spending} radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
          <LabelList
            dataKey="amountCents"
            position="right"
            fill={colors.text}
            formatter={(value) => formatMoney(Number(value), currency)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
