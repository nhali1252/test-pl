import { useState, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "@/components/Dashboard";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import TransactionFilters, { type FilterValues } from "@/components/TransactionFilters";
import { DashboardSkeleton, ListSkeleton } from "@/components/Skeletons";
import ThemeToggle from "@/components/ThemeToggle";
import { useTransactions, type Transaction } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, formatMonthLabel } from "@/lib/currency";
import { Wallet, LayoutDashboard, List, BarChart3, Search, Download, Receipt, FileText, Plus, MoreHorizontal, Users, User } from "lucide-react";
import { generateMonthlyReport } from "@/lib/generateReport";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import UpdatePrompt, { useServiceWorkerUpdate } from "@/components/UpdatePrompt";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const MonthlyChart = lazy(() => import("@/components/MonthlyChart"));
const FlowPieChart = lazy(() => import("@/components/FlowPieChart"));
const LoansPage = lazy(() => import("@/components/LoansPage"));
const DuesPage = lazy(() => import("@/components/DuesPage"));
const ProfilePage = lazy(() => import("@/components/ProfilePage"));

type Tab = "dashboard" | "transactions" | "loans" | "dues" | "charts" | "profile";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function Index() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { isInstallable, promptInstall } = useInstallPrompt();
  const { t } = useI18n();
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();
  const {
    transactions, isLoading, addTransaction, updateTransaction, deleteTransaction,
    summary, loansByPerson, monthlyData, flowBreakdown, availableMonths, getMonthlyTransactions, getMonthlySummary,
    accountBalances,
  } = useTransactions();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [filters, setFilters] = useState<FilterValues>({ dateFrom: "", dateTo: "", type: "all", flowType: "all" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.flowType !== "all" && t.flow_type !== filters.flowType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.description.toLowerCase().includes(q) && !(t.person || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filters, searchQuery]);

  const currentMonthSummary = useMemo(() => getMonthlySummary(selectedMonth), [selectedMonth, getMonthlySummary]);
  const monthLabel = (m: string) => formatMonthLabel(m);

  // Bottom nav items: Home, History, [+], Profile, More
  const leftTabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: t("home"), icon: LayoutDashboard },
    { id: "transactions", label: t("history"), icon: List },
  ];

  // More menu items (no profile)
  const moreTabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dues", label: t("dues"), icon: Receipt },
    { id: "loans", label: t("loans"), icon: Users },
    { id: "charts", label: t("charts"), icon: BarChart3 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24">
        <div className="max-w-md mx-auto px-4 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="h-5 w-28 bg-muted rounded-lg animate-pulse" />
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const isMoreActive = moreTabs.some(mt => mt.id === tab);

  return (
    <div className="min-h-screen pb-28 relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/3 blur-[120px]" />
        <div className="absolute bottom-1/3 left-0 w-72 h-72 rounded-full bg-income/3 blur-[100px]" />
      </div>

      {/* Update Prompt */}
      <UpdatePrompt updateAvailable={updateAvailable} onUpdate={applyUpdate} />

      <div className="max-w-md mx-auto px-4 pt-6 pb-4 relative z-10">
        {/* Header - no profile button */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center glow-primary">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold leading-tight">Pocket Ledger</h1>
              <p className="text-[10px] text-muted-foreground tracking-wide">{t("personalFinance")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isInstallable && (
              <button onClick={promptInstall}
                className="p-2.5 rounded-xl text-primary hover:bg-primary/10 transition-all duration-200"
                title="Install App">
                <Download className="w-4 h-4" />
              </button>
            )}
            <ThemeToggle />
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === "profile" ? (
            <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <Suspense fallback={<div className="py-10 text-center text-muted-foreground">{t("loading")}</div>}>
                <ProfilePage onBack={() => setTab("dashboard")} />
              </Suspense>
            </motion.div>
          ) : (
            <>
              {tab === "dashboard" && (
                <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <Dashboard {...summary} accountBalances={accountBalances} />

                  {/* Monthly Summary */}
                  <div className="mt-7">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">{t("monthlySummary")}</h2>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-auto bg-secondary/60 border-border/50 text-xs h-8 px-3 gap-1 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(availableMonths.length > 0 ? availableMonths : [new Date().toISOString().slice(0, 7)]).map((m) => (
                            <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mb-7">
                      {[
                        { label: t("income"), value: currentMonthSummary.income, colorClass: "text-income" },
                        { label: t("expense"), value: currentMonthSummary.expense, colorClass: "text-expense" },
                        { label: t("loanGiven"), value: currentMonthSummary.loanGiven, colorClass: "text-lent" },
                        { label: t("loanReceived"), value: currentMonthSummary.loanReceived, colorClass: "text-received" },
                        { label: t("dueTaken"), value: currentMonthSummary.dueTaken, colorClass: "text-amber-400" },
                        { label: t("duePaidLabel"), value: currentMonthSummary.duePaid, colorClass: "text-emerald-400" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl glass-card p-3.5">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                          <p className={`text-sm font-display font-bold mt-0.5 ${item.colorClass}`}>{formatCurrency(item.value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div>
                    <h2 className="text-[11px] font-semibold text-muted-foreground mb-4 uppercase tracking-[0.15em]">{t("recentTransactions")}</h2>
                    <TransactionList
                      transactions={transactions.slice(0, 5)}
                      onEdit={(id, updates) => updateTransaction({ id, ...updates })}
                      onDelete={deleteTransaction}
                    />
                  </div>
                </motion.div>
              )}

              {tab === "transactions" && (
                <motion.div key="transactions" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  {editingTx && (
                    <TransactionForm onAdd={addTransaction} editingTransaction={editingTx} onUpdate={updateTransaction} onCancelEdit={() => setEditingTx(null)} loansByPerson={loansByPerson} accountBalances={accountBalances} />
                  )}
                  <div className="relative mb-3">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={t("search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-secondary/50 border-border/50 text-sm rounded-xl h-11" />
                  </div>
                  <TransactionFilters filters={filters} onChange={setFilters} />
                  <TransactionList
                    transactions={filteredTransactions}
                    onEdit={(id, updates) => updateTransaction({ id, ...updates })}
                    onDelete={deleteTransaction}
                  />
                </motion.div>
              )}

              {tab === "dues" && (
                <motion.div key="dues" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <Suspense fallback={<ListSkeleton count={3} />}><DuesPage /></Suspense>
                </motion.div>
              )}

              {tab === "loans" && (
                <motion.div key="loans" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <Suspense fallback={<ListSkeleton count={3} />}><LoansPage /></Suspense>
                </motion.div>
              )}

              {tab === "charts" && (
                <motion.div key="charts" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <Suspense fallback={<div className="space-y-5 animate-pulse"><div className="rounded-2xl glass-card h-72" /><div className="rounded-2xl glass-card h-72" /></div>}>
                    <div className="space-y-5">
                      <button
                        onClick={() => {
                          const ms = getMonthlySummary(selectedMonth);
                          generateMonthlyReport(transactions, selectedMonth, ms);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl glass-card text-sm font-semibold text-primary hover-lift"
                      >
                        <FileText className="w-4 h-4" /> {t("generateReport")}
                      </button>
                      <div className="rounded-2xl glass-card p-5">
                        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">{t("incomeVsExpense")}</h3>
                        <MonthlyChart data={monthlyData} />
                      </div>
                      <div className="rounded-2xl glass-card p-5">
                        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">{t("flowBreakdown")}</h3>
                        <FlowPieChart data={flowBreakdown} />
                      </div>
                    </div>
                  </Suspense>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Transaction Form Modal (triggered by center button) */}
        {tab !== "profile" && (
          <TransactionForm
            onAdd={addTransaction}
            loansByPerson={loansByPerson}
            externalOpen={showAddModal}
            onExternalOpenChange={setShowAddModal}
            accountBalances={accountBalances}
          />
        )}
      </div>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[env(safe-area-inset-bottom,8px)]">
        <div className="max-w-md mx-auto mb-3">
          <div className="bg-card/90 backdrop-blur-2xl border border-border/40 rounded-[28px] shadow-[0_-4px_30px_rgba(0,0,0,0.3)] px-2 py-1.5">
            <div className="flex items-center justify-around">
              {/* Left: Home, History */}
              {leftTabs.map((tabItem) => {
                const Icon = tabItem.icon;
                const isActive = tab === tabItem.id;
                return (
                  <button key={tabItem.id} onClick={() => { setTab(tabItem.id); setEditingTx(null); }}
                    className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all duration-200 ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}>
                    <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? "bg-primary/15" : ""}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-semibold">{tabItem.label}</span>
                  </button>
                );
              })}

              {/* Center Plus Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="relative -mt-6 flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_4px_30px_hsl(var(--primary)/0.6)] transition-all duration-300 active:scale-95"
              >
                <Plus className="w-7 h-7" />
                <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-30 pointer-events-none" />
              </button>

              {/* Right: Profile */}
              <button onClick={() => { setTab("profile"); setEditingTx(null); }}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all duration-200 ${
                  tab === "profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${tab === "profile" ? "bg-primary/15" : ""}`}>
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-semibold">{t("profile")}</span>
              </button>

              {/* More */}
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                    className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all duration-200 ${
                      isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl transition-all duration-200 ${isMoreActive ? "bg-primary/15" : ""}`}>
                      <MoreHorizontal className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-semibold">{t("more")}</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-card border-border/50 rounded-t-3xl pb-[env(safe-area-inset-bottom,16px)]">
                  <SheetHeader>
                    <SheetTitle className="font-display text-sm">{t("more")}</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-3 gap-3 mt-4 mb-2">
                    {moreTabs.map((tabItem) => {
                      const Icon = tabItem.icon;
                      const isActive = tab === tabItem.id;
                      return (
                        <button key={tabItem.id} onClick={() => { setTab(tabItem.id); setEditingTx(null); setMoreOpen(false); }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                            isActive ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/20"
                          }`}>
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-semibold">{tabItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
