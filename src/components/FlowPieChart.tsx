import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatNumber } from "@/lib/currency";

interface Props {
  data: { cash: number; loan: number; income: number; expense: number; loanGiven: number; loanReceived: number };
}

const COLORS = {
  income: "hsl(160 70% 44%)",
  expense: "hsl(0 72% 55%)",
  loanGiven: "hsl(38 92% 55%)",
  loanReceived: "hsl(210 80% 55%)",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-xl p-3 text-xs bg-card border border-border shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.payload.fill }} />
        <span className="text-muted-foreground">{entry.name}</span>
      </div>
      <p className="font-display font-semibold mt-1">{formatCurrency(entry.value)}</p>
    </div>
  );
};

export default function FlowPieChart({ data }: Props) {
  const chartData = [
    { name: "Income", value: data.income, fill: COLORS.income },
    { name: "Expense", value: data.expense, fill: COLORS.expense },
    { name: "Lent", value: data.loanGiven, fill: COLORS.loanGiven },
    { name: "Received", value: data.loanReceived, fill: COLORS.loanReceived },
  ].filter((d) => d.value > 0);

  const total = chartData.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="text-center py-12"><p className="text-muted-foreground text-xs">No data to display</p></div>;

  return (
    <div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-display font-semibold ml-auto">{formatNumber(Math.round((d.value / total) * 100))}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
