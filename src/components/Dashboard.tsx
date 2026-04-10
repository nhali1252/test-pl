import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, DollarSign, Eye, EyeOff, Users, HandCoins, Landmark, Smartphone } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { useActiveUsers } from "@/hooks/useActiveUsers";
import { useI18n } from "@/lib/i18n";

interface AccountBalances {
  cash: number;
  bank: Record<string, number>;
  mfs: Record<string, number>;
}

interface DashboardProps {
  totalCash: number;
  totalLent: number;
  totalReceived: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currentDue?: number;
  accountBalances?: AccountBalances;
}

export default function Dashboard({ totalCash, totalLent, totalReceived, totalIncome, totalExpense, balance, currentDue = 0, accountBalances }: DashboardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const activeUsers = useActiveUsers();
  const { t } = useI18n();

  const stats = [
    { label: t("cash"), value: totalCash, icon: Wallet, colorClass: "text-cash", bgClass: "bg-cash/10", glowClass: "shadow-[0_0_20px_hsl(142_71%_45%/0.1)]" },
    { label: t("income"), value: totalIncome, icon: DollarSign, colorClass: "text-income", bgClass: "bg-income/10", glowClass: "shadow-[0_0_20px_hsl(217_91%_60%/0.1)]" },
    { label: t("expense"), value: totalExpense, icon: TrendingDown, colorClass: "text-expense", bgClass: "bg-expense/10", glowClass: "shadow-[0_0_20px_hsl(0_84%_60%/0.1)]" },
    { label: t("due"), value: currentDue, icon: HandCoins, colorClass: "text-amber-400", bgClass: "bg-amber-400/10", glowClass: "shadow-[0_0_20px_hsl(38_92%_55%/0.1)]" },
    { label: t("lent"), value: totalLent, icon: ArrowUpRight, colorClass: "text-lent", bgClass: "bg-lent/10", glowClass: "shadow-[0_0_20px_hsl(25_95%_53%/0.1)]" },
    { label: t("received"), value: totalReceived, icon: ArrowDownLeft, colorClass: "text-received", bgClass: "bg-received/10", glowClass: "shadow-[0_0_20px_hsl(271_81%_56%/0.1)]" },
  ];

  // Build account balance items
  const accountItems: { label: string; value: number; icon: typeof Wallet; colorClass: string }[] = [];
  if (accountBalances) {
    accountItems.push({ label: t("cash"), value: accountBalances.cash, icon: Wallet, colorClass: "text-cash" });
    for (const [name, val] of Object.entries(accountBalances.bank)) {
      accountItems.push({ label: name, value: val, icon: Landmark, colorClass: "text-primary" });
    }
    for (const [name, val] of Object.entries(accountBalances.mfs)) {
      accountItems.push({ label: name, value: val, icon: Smartphone, colorClass: "text-received" });
    }
  }

  const hasMultipleAccounts = accountItems.length > 1;

  return (
    <div className="space-y-5">
      {/* Hero Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[20px] p-7 glass-card animate-pulse-glow"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-[60px]" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-income/15 blur-[50px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 rounded-full bg-received/10 blur-[80px]" />

        <div className="relative">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium tracking-widest uppercase">{t("netBalance")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cash/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cash opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cash" />
                </span>
                <Users className="w-3 h-3 text-cash" />
                <span className="text-[10px] font-semibold text-cash">{activeUsers}</span>
              </div>
              <button onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 rounded-full hover:bg-secondary/60 transition-colors">
                {showBalance ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-[40px] font-display font-bold text-primary tracking-tight leading-none mb-3">
            {showBalance ? formatCurrency(balance) : `${getCurrencySymbol()} ••••••`}
          </motion.p>
        </div>
      </motion.div>

      {/* Account Balances - horizontal scroll */}
      {hasMultipleAccounts && (
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">{t("accountBalances")}</h2>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {accountItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex-shrink-0 min-w-[120px] rounded-2xl glass-card p-3.5">
                  <div className={`w-7 h-7 rounded-lg ${item.colorClass.replace("text-", "bg-")}/10 flex items-center justify-center mb-2`}>
                    <Icon className={`w-3.5 h-3.5 ${item.colorClass}`} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium truncate">{item.label}</p>
                  <p className={`text-sm font-display font-bold mt-0.5 ${item.value >= 0 ? item.colorClass : "text-expense"}`}>
                    {showBalance ? formatCurrency(item.value) : "••••"}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat Cards - Top Row (3) */}
      <div className="grid grid-cols-3 gap-3">
        {stats.slice(0, 3).map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-2xl glass-card p-4 hover-lift cursor-default ${stat.glowClass}`}>
            <div className={`w-9 h-9 rounded-xl ${stat.bgClass} flex items-center justify-center mb-2.5`}>
              <stat.icon className={`w-4 h-4 ${stat.colorClass}`} />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
            <p className={`text-sm font-display font-bold mt-0.5 ${stat.colorClass}`}>
              {showBalance ? formatCurrency(stat.value) : "••••"}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Stat Cards - Bottom Row (3) */}
      <div className="grid grid-cols-3 gap-3">
        {stats.slice(3).map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-2xl glass-card p-4 hover-lift cursor-default ${stat.glowClass}`}>
            <div className={`w-9 h-9 rounded-xl ${stat.bgClass} flex items-center justify-center mb-2.5`}>
              <stat.icon className={`w-4 h-4 ${stat.colorClass}`} />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
            <p className={`text-sm font-display font-bold mt-0.5 ${stat.colorClass}`}>
              {showBalance ? formatCurrency(stat.value) : "••••"}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
