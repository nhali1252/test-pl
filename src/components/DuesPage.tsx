import { useMemo } from "react";
import { useTransactions, type Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import TransactionList from "@/components/TransactionList";
import { HandCoins, HandshakeIcon, Wallet } from "lucide-react";

export default function DuesPage() {
  const { transactions, summary, updateTransaction, deleteTransaction } = useTransactions();
  const { t } = useI18n();

  const dueTransactions = useMemo(() => {
    return transactions.filter(tx => tx.type === "due" || tx.type === "due_paid")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-expense/10 flex items-center justify-center mx-auto mb-2">
            <Wallet className="w-4 h-4 text-expense" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("dueRemaining")}</p>
          <p className="text-lg font-display font-bold text-expense mt-0.5">{formatCurrency(summary.currentDue)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center mx-auto mb-2">
            <HandCoins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("totalDueTaken")}</p>
          <p className="text-lg font-display font-bold text-amber-400 mt-0.5">{formatCurrency(summary.totalDueTaken)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center mx-auto mb-2">
            <HandshakeIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("totalDuePaidLabel")}</p>
          <p className="text-lg font-display font-bold text-emerald-400 mt-0.5">{formatCurrency(summary.totalDuePaid)}</p>
        </div>
      </div>

      {/* Due Transaction History */}
      <div>
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">
          {t("recentDueTransactions")}
        </h3>
        {dueTransactions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">{t("noDueTransactions")}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">{t("addDueFromMain")}</p>
          </div>
        ) : (
          <TransactionList
            transactions={dueTransactions}
            onEdit={(id, updates) => updateTransaction({ id, ...updates })}
            onDelete={deleteTransaction}
          />
        )}
      </div>
    </div>
  );
}
