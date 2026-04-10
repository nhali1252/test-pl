import { formatCurrency, formatMonthLabel, formatDate } from "@/lib/currency";
import type { Transaction } from "@/hooks/useTransactions";

export function generateMonthlyReport(
  transactions: Transaction[],
  month: string,
  summary: { income: number; expense: number; loanGiven: number; loanReceived: number; netBalance: number }
) {
  const monthLbl = formatMonthLabel(month);
  const monthTxs = transactions.filter(t => t.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));

  const typeLabel: Record<string, string> = {
    income: "Income", expense: "Expense", loan_given: "Lent", loan_received: "Received",
  };
  const typeColor: Record<string, string> = {
    income: "#3B82F6", expense: "#EF4444", loan_given: "#F97316", loan_received: "#A855F7",
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pocket Ledger — ${monthLbl} Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a2e; background: #fff; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #666; margin-bottom: 30px; }
    .summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 30px; }
    .stat { flex: 1; min-width: 120px; padding: 16px; border-radius: 12px; background: #f8f9fa; border: 1px solid #e9ecef; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
    .stat-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 2px solid #e9ecef; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    .type-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .amount { font-weight: 600; text-align: right; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>📊 Monthly Report</h1>
  <p class="subtitle">Pocket Ledger — ${monthLbl}</p>

  <div class="summary">
    <div class="stat"><div class="stat-label">Income</div><div class="stat-value" style="color:#3B82F6">${formatCurrency(summary.income)}</div></div>
    <div class="stat"><div class="stat-label">Expense</div><div class="stat-value" style="color:#EF4444">${formatCurrency(summary.expense)}</div></div>
    <div class="stat"><div class="stat-label">Net</div><div class="stat-value" style="color:#22C55E">${formatCurrency(summary.netBalance)}</div></div>
  </div>

  <table>
    <thead>
      <tr><th>Date</th><th>Description</th><th>Type</th><th>Person</th><th style="text-align:right">Amount</th></tr>
    </thead>
    <tbody>
      ${monthTxs.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">No transactions this month</td></tr>' :
        monthTxs.map(t => `
        <tr>
          <td>${t.date}</td>
          <td>${t.description}</td>
          <td><span class="type-badge" style="background:${typeColor[t.type]}15;color:${typeColor[t.type]}">${typeLabel[t.type]}</span></td>
          <td>${t.person || "—"}</td>
          <td class="amount" style="color:${typeColor[t.type]}">${formatCurrency(t.amount)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    Generated on ${formatDate(new Date(), { year: "numeric", month: "long", day: "numeric" })} • Pocket Ledger
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
