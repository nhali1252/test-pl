import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { formatCurrency, formatCompactNumber, getCurrencySymbol } from "@/lib/currency";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  data: Array<{ month: string; income: number; expense: number; loanGiven: number; loanReceived: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs bg-card border border-border shadow-lg">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-display font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function MonthlyChart({ data }: Props) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "hsl(228 10% 16%)" : "hsl(214 20% 92%)";
  const tickColor = theme === "dark" ? "hsl(215 12% 55%)" : "hsl(215 12% 45%)";

  if (data.length === 0) {
    return <div className="text-center py-12"><p className="text-muted-foreground text-xs">No data to display</p></div>;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `${getCurrencySymbol()}${formatCompactNumber(v)}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === "dark" ? "hsl(228 12% 14% / 0.5)" : "hsl(210 18% 93% / 0.5)", radius: 4 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="income" fill="hsl(160 70% 44%)" radius={[6, 6, 0, 0]} name="Income" />
          <Bar dataKey="expense" fill="hsl(0 72% 55%)" radius={[6, 6, 0, 0]} name="Expense" />
          <Bar dataKey="loanGiven" fill="hsl(38 92% 55%)" radius={[6, 6, 0, 0]} name="Lent" />
          <Bar dataKey="loanReceived" fill="hsl(210 80% 55%)" radius={[6, 6, 0, 0]} name="Received" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
