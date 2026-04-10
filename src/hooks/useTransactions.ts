import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { audit } from "@/lib/audit";
import { formatMonthShort } from "@/lib/currency";

export type AccountType = "cash" | "bank" | "mfs";

export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  flow_type: FlowType;
  person: string | null;
  person_id: string | null;
  settled: boolean;
  created_at: string;
  updated_at: string;
  account_type: AccountType;
  provider_id: string | null;
  provider_name: string | null;
  to_account_type: AccountType | null;
  to_provider_id: string | null;
  to_provider_name: string | null;
};

export type TransactionType = "income" | "expense" | "loan_given" | "loan_received" | "due" | "due_paid" | "transfer";
export type FlowType = "cash" | "loan";

export type NewTransaction = {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  flow_type: FlowType;
  person?: string;
  person_id?: string;
  account_type?: AccountType;
  provider_id?: string;
  provider_name?: string;
  to_account_type?: AccountType;
  to_provider_id?: string;
  to_provider_name?: string;
};

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const addMutation = useMutation({
    mutationFn: async (t: NewTransaction) => {
      const { error } = await supabase.from("transactions").insert({ ...t, user_id: user!.id } as any);
      if (error) throw error;
      if (t.type === "due") audit("due_created", `amount: ${t.amount}, person: ${t.person}`);
      if (t.type === "due_paid") audit("due_paid_created", `amount: ${t.amount}, person: ${t.person}`);
      if (t.type === "transfer") audit("transfer_created", `amount: ${t.amount}, from: ${t.account_type}/${t.provider_name || "cash"}, to: ${t.to_account_type}/${t.to_provider_name || "cash"}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("transactions").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  // Account balances: { cash: number, bank: { [name]: number }, mfs: { [name]: number } }
  const accountBalances = useMemo(() => {
    let cashBal = 0;
    const bankBals: Record<string, number> = {};
    const mfsBals: Record<string, number> = {};

    const applyMovement = (acctType: AccountType, providerName: string | null, amount: number) => {
      if (acctType === "cash") {
        cashBal += amount;
      } else if (acctType === "bank") {
        const key = providerName || "Unknown Bank";
        bankBals[key] = (bankBals[key] || 0) + amount;
      } else if (acctType === "mfs") {
        const key = providerName || "Unknown MFS";
        mfsBals[key] = (mfsBals[key] || 0) + amount;
      }
    };

    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const t of sorted) {
      const amt = Number(t.amount) || 0;
      const acct = t.account_type || "cash";

      switch (t.type) {
        case "income":
        case "due":
        case "loan_received":
          applyMovement(acct, t.provider_name, amt);
          break;
        case "expense":
        case "due_paid":
        case "loan_given":
          applyMovement(acct, t.provider_name, -amt);
          break;
        case "transfer":
          applyMovement(acct, t.provider_name, -amt);
          if (t.to_account_type) {
            applyMovement(t.to_account_type, t.to_provider_name, amt);
          }
          break;
      }
    }

    return { cash: cashBal, bank: bankBals, mfs: mfsBals };
  }, [transactions]);

  const summary = useMemo(() => {
    let cash = 0;
    let totalLent = 0;
    let totalIncome = 0, totalExpense = 0, totalReceived = 0;
    let totalDueTaken = 0, totalDuePaid = 0;

    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const t of sorted) {
      const amt = Number(t.amount) || 0;
      switch (t.type) {
        case "income":
          cash += amt;
          totalIncome += amt;
          break;
        case "expense":
          cash -= amt;
          totalExpense += amt;
          break;
        case "loan_given":
          cash -= amt;
          totalLent += amt;
          break;
        case "loan_received":
          cash += amt;
          totalLent -= amt;
          totalReceived += amt;
          break;
        case "due":
          cash += amt;
          totalDueTaken += amt;
          break;
        case "due_paid":
          cash -= amt;
          totalDuePaid += amt;
          break;
        case "transfer":
          // Transfer doesn't change net balance
          break;
        default:
          audit("unknown_transaction_type", `type: ${t.type}`);
          break;
      }
    }

    const currentDue = totalDueTaken - totalDuePaid;

    return {
      totalCash: cash,
      totalLent,
      totalReceived,
      totalIncome,
      totalExpense,
      totalDueTaken,
      totalDuePaid,
      currentDue,
      balance: cash,
    };
  }, [transactions]);

  const loansByPerson = useMemo(() => {
    const map: Record<string, { given: number; received: number; net: number; pendingGiven: number; pendingReceived: number; settledGiven: number; settledReceived: number; transactions: Transaction[] }> = {};
    for (const t of transactions) {
      if (t.type !== "loan_given" && t.type !== "loan_received") continue;
      const person = t.person || "Unknown";
      if (!map[person]) map[person] = { given: 0, received: 0, net: 0, pendingGiven: 0, pendingReceived: 0, settledGiven: 0, settledReceived: 0, transactions: [] };
      const amt = Number(t.amount);
      map[person].transactions.push(t);
      if (t.type === "loan_given") {
        map[person].given += amt;
        map[person].net += amt;
        if (t.settled) map[person].settledGiven += amt; else map[person].pendingGiven += amt;
      } else {
        map[person].received += amt;
        map[person].net -= amt;
        if (t.settled) map[person].settledReceived += amt; else map[person].pendingReceived += amt;
      }
    }
    return map;
  }, [transactions]);

  const duesByPerson = useMemo(() => {
    const map: Record<string, { taken: number; paid: number; outstanding: number; transactions: Transaction[] }> = {};
    for (const t of transactions) {
      if (t.type !== "due" && t.type !== "due_paid") continue;
      const person = t.person || "Unknown";
      if (!map[person]) map[person] = { taken: 0, paid: 0, outstanding: 0, transactions: [] };
      const amt = Number(t.amount);
      map[person].transactions.push(t);
      if (t.type === "due") {
        map[person].taken += amt;
      } else {
        map[person].paid += amt;
      }
      map[person].outstanding = map[person].taken - map[person].paid;
    }
    return map;
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(t.date.slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const getMonthlyTransactions = useCallback((month: string) => {
    return transactions.filter((t) => t.date.startsWith(month));
  }, [transactions]);

  const getMonthlySummary = useCallback((month: string) => {
    const txs = transactions.filter((t) => t.date.startsWith(month));
    let income = 0, expense = 0, loanGiven = 0, loanReceived = 0, dueTaken = 0, duePaidAmt = 0;
    for (const t of txs) {
      const amt = Number(t.amount);
      if (t.type === "income") income += amt;
      else if (t.type === "expense") expense += amt;
      else if (t.type === "loan_given") loanGiven += amt;
      else if (t.type === "loan_received") loanReceived += amt;
      else if (t.type === "due") dueTaken += amt;
      else if (t.type === "due_paid") duePaidAmt += amt;
    }
    return { income, expense, loanGiven, loanReceived, dueTaken, duePaid: duePaidAmt, netBalance: income - expense + loanReceived + dueTaken - duePaidAmt };
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number; loanGiven: number; loanReceived: number; dueTaken: number; duePaid: number }> = {};
    for (const t of transactions) {
      const month = t.date.slice(0, 7);
      if (!map[month]) map[month] = { income: 0, expense: 0, loanGiven: 0, loanReceived: 0, dueTaken: 0, duePaid: 0 };
      const amt = Number(t.amount);
      if (t.type === "income") map[month].income += amt;
      else if (t.type === "expense") map[month].expense += amt;
      else if (t.type === "loan_given") map[month].loanGiven += amt;
      else if (t.type === "loan_received") map[month].loanReceived += amt;
      else if (t.type === "due") map[month].dueTaken += amt;
      else if (t.type === "due_paid") map[month].duePaid += amt;
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
      .map(([month, data]) => ({ month: formatMonthShort(month), ...data }));
  }, [transactions]);

  const flowBreakdown = useMemo(() => {
    let cash = 0, loan = 0, income = 0, expense = 0, loanGiven = 0, loanReceived = 0;
    for (const t of transactions) {
      const amt = Number(t.amount);
      if (t.flow_type === "cash") cash += amt; else loan += amt;
      if (t.type === "income") income += amt;
      else if (t.type === "expense") expense += amt;
      else if (t.type === "loan_given") loanGiven += amt;
      else if (t.type === "loan_received") loanReceived += amt;
    }
    return { cash, loan, income, expense, loanGiven, loanReceived };
  }, [transactions]);

  return {
    transactions, isLoading,
    addTransaction: addMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    summary, loansByPerson, duesByPerson, monthlyData, flowBreakdown, availableMonths,
    getMonthlyTransactions, getMonthlySummary, accountBalances,
  };
}
