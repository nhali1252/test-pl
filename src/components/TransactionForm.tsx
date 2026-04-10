import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, ArrowDown, ArrowUp, ArrowUpRight, ArrowDownLeft, CheckCircle2, UserPlus, HandCoins, HandshakeIcon, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TransactionType, FlowType, Transaction, AccountType, NewTransaction } from "@/hooks/useTransactions";
import { useContacts } from "@/hooks/useContacts";
import { useProviders, type Provider } from "@/hooks/useProviders";
import { useI18n } from "@/lib/i18n";
import { audit } from "@/lib/audit";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface AccountBalances {
  cash: number;
  bank: Record<string, number>;
  mfs: Record<string, number>;
}

interface Props {
  onAdd: (t: NewTransaction) => Promise<void>;
  editingTransaction?: Transaction | null;
  onUpdate?: (t: { id: string; [key: string]: any }) => Promise<void>;
  onCancelEdit?: () => void;
  loansByPerson?: Record<string, { given: number; received: number; net: number; pendingGiven: number; pendingReceived: number; settledGiven: number; settledReceived: number; transactions: Transaction[] }>;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  accountBalances?: AccountBalances;
}

const typeOptions = [
  { value: "income", label: "income", icon: ArrowDown, color: "text-income", bg: "bg-income/10", border: "border-income/30" },
  { value: "expense", label: "expense", icon: ArrowUp, color: "text-expense", bg: "bg-expense/10", border: "border-expense/30" },
  { value: "loan_given", label: "lent", icon: ArrowUpRight, color: "text-lent", bg: "bg-lent/10", border: "border-lent/30" },
  { value: "loan_received", label: "received", icon: ArrowDownLeft, color: "text-received", bg: "bg-received/10", border: "border-received/30" },
  { value: "due", label: "due", icon: HandCoins, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  { value: "due_paid", label: "duePaid", icon: HandshakeIcon, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  { value: "transfer", label: "transfer", icon: ArrowLeftRight, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
] as const;

// Which types are incoming (money comes to me)
const incomingTypes = new Set<string>(["income", "due", "loan_received"]);
// Which types are outgoing (money leaves me)
const outgoingTypes = new Set<string>(["expense", "due_paid", "loan_given"]);

function AccountSelector({
  label, accountType, setAccountType, providerId, setProviderId,
  banks, mfsServices, onAddProvider, t, errors, errorKey,
}: {
  label: string;
  accountType: AccountType;
  setAccountType: (v: AccountType) => void;
  providerId: string;
  setProviderId: (v: string) => void;
  banks: Provider[];
  mfsServices: Provider[];
  onAddProvider: (name: string, type: "bank" | "mfs") => Promise<void>;
  t: (k: string) => string;
  errors: Record<string, string>;
  errorKey: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const needsProvider = accountType === "bank" || accountType === "mfs";
  const providerList = accountType === "bank" ? banks : mfsServices;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await onAddProvider(newName.trim(), accountType as "bank" | "mfs");
      setNewName("");
      setShowAdd(false);
    } catch {
      toast.error("Already exists or failed");
    }
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-3 gap-1.5">
        {(["cash", "bank", "mfs"] as AccountType[]).map((at) => (
          <button key={at} type="button"
            onClick={() => { setAccountType(at); setProviderId(""); }}
            className={`py-2 rounded-xl text-[11px] font-medium border transition-all ${
              accountType === at
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-secondary border-border text-muted-foreground hover:border-primary/20"
            }`}>
            {t(at)}
          </button>
        ))}
      </div>
      {needsProvider && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground">
              {accountType === "bank" ? t("bankName") : t("mfsService")}
            </Label>
            <button type="button" onClick={() => setShowAdd(!showAdd)}
              className="text-[10px] text-primary font-medium hover:underline flex items-center gap-0.5">
              <Plus className="w-3 h-3" />{t("addNewProvider")}
            </button>
          </div>
          {showAdd && (
            <div className="flex gap-1.5">
              <Input placeholder={t("providerNamePlaceholder")} value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-secondary border-border text-sm flex-1 h-9"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }} />
              <Button type="button" size="sm" onClick={handleAdd} disabled={adding || !newName.trim()}
                className="bg-primary text-primary-foreground px-3 h-9">
                {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </Button>
            </div>
          )}
          <Select value={providerId} onValueChange={setProviderId}>
            <SelectTrigger className={`bg-secondary border-border h-9 text-sm ${errors[errorKey] ? "border-expense" : ""}`}>
              <SelectValue placeholder={t("selectProvider")} />
            </SelectTrigger>
            <SelectContent>
              {providerList.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
              {providerList.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">{t("noProviders")}</div>
              )}
            </SelectContent>
          </Select>
          {errors[errorKey] && <p className="text-[10px] text-expense">{errors[errorKey]}</p>}
        </div>
      )}
    </div>
  );
}

export default function TransactionForm({ onAdd, editingTransaction, onUpdate, onCancelEdit, loansByPerson = {}, externalOpen, onExternalOpenChange, accountBalances }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (onExternalOpenChange) onExternalOpenChange(v);
    else setInternalOpen(v);
  };
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isEditing = !!editingTransaction;
  const { contacts, addContact } = useContacts();
  const { banks, mfsServices, addProvider } = useProviders();
  const { t } = useI18n();

  const [date, setDate] = useState(editingTransaction?.date || new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(editingTransaction?.description || "");
  const [amount, setAmount] = useState(editingTransaction ? String(editingTransaction.amount) : "");
  const [type, setType] = useState<TransactionType>(editingTransaction?.type || "expense");
  const [flowType, setFlowType] = useState<FlowType>(editingTransaction?.flow_type || "cash");
  const [personId, setPersonId] = useState(editingTransaction?.person_id || "");
  const [newPersonName, setNewPersonName] = useState("");
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Account fields
  const [accountType, setAccountType] = useState<AccountType>(editingTransaction?.account_type || "cash");
  const [providerId, setProviderId] = useState(editingTransaction?.provider_id || "");
  const [toAccountType, setToAccountType] = useState<AccountType>(editingTransaction?.to_account_type || "cash");
  const [toProviderId, setToProviderId] = useState(editingTransaction?.to_provider_id || "");

  const isLoan = type === "loan_given" || type === "loan_received";
  const isDue = type === "due" || type === "due_paid";
  const isTransfer = type === "transfer";
  const needsPerson = isLoan || isDue;
  const needsAccount = incomingTypes.has(type) || outgoingTypes.has(type) || isTransfer;

  const getProviderName = (acctType: AccountType, provId: string) => {
    if (acctType === "cash") return null;
    const list = acctType === "bank" ? banks : mfsServices;
    return list.find(p => p.id === provId)?.name || null;
  };

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setDescription(""); setAmount(""); setType("expense"); setFlowType("cash");
    setPersonId(""); setNewPersonName(""); setShowAddPerson(false); setErrors({});
    setAccountType("cash"); setProviderId(""); setToAccountType("cash"); setToProviderId("");
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isTransfer && !needsPerson && !description.trim()) errs.description = t("required");
    if (!amount || parseFloat(amount) <= 0) errs.amount = t("enterValidAmount");
    if (needsPerson && !personId) {
      errs.person = isDue ? t("beneficiaryRequired") : t("selectAPerson");
    }
    if (!date) errs.date = t("dateRequired");

    // Account validation
    if (needsAccount && accountType !== "cash" && !providerId) {
      errs.provider = accountType === "bank" ? t("bankName") + " " + t("required").toLowerCase() : t("mfsService") + " " + t("required").toLowerCase();
    }
    if (isTransfer) {
      if (toAccountType !== "cash" && !toProviderId) {
        errs.toProvider = t("required");
      }
      // Same account check
      if (accountType === toAccountType) {
        if (accountType === "cash") {
          errs.toProvider = t("sameAccountNotAllowed");
        } else if (providerId && providerId === toProviderId) {
          errs.toProvider = t("sameAccountNotAllowed");
        }
      }
    }

    // Insufficient balance validation for outgoing transactions
    if (accountBalances && amount && parseFloat(amount) > 0 && !isEditing) {
      const amt = parseFloat(amount);
      const getSourceBalance = (acctType: AccountType, provId: string): number => {
        if (acctType === "cash") return accountBalances.cash;
        if (acctType === "bank") {
          const provName = banks.find(p => p.id === provId)?.name;
          return provName ? (accountBalances.bank[provName] || 0) : 0;
        }
        if (acctType === "mfs") {
          const provName = mfsServices.find(p => p.id === provId)?.name;
          return provName ? (accountBalances.mfs[provName] || 0) : 0;
        }
        return 0;
      };

      if (outgoingTypes.has(type) || isTransfer) {
        const sourceBalance = getSourceBalance(accountType, providerId);
        if (amt > sourceBalance) {
          errs.amount = t("insufficientBalance");
        }
      }
    }

    // Prevent receiving more than what's lent
    if (type === "loan_received" && personId && amount && parseFloat(amount) > 0) {
      const selectedContact = contacts.find(c => c.id === personId);
      const personName = selectedContact?.name || "";
      const personLoans = loansByPerson[personName];
      const outstandingLent = personLoans ? Math.max(0, personLoans.given - personLoans.received) : 0;
      if (parseFloat(amount) > outstandingLent) {
        errs.amount = outstandingLent <= 0
          ? t("noOutstandingLoan")
          : `${t("cannotReceiveMore")} ${formatCurrency(outstandingLent)}`;
      }
    }

    if (Object.keys(errs).length > 0) {
      audit("form_validation_failed", JSON.stringify(errs));
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim()) return;
    try {
      const contact = await addContact.mutateAsync(newPersonName.trim());
      setPersonId(contact.id);
      setNewPersonName("");
      setShowAddPerson(false);
      toast.success(`"${contact.name}" added to contacts`);
    } catch {
      toast.error("Person already exists or failed to add");
    }
  };

  const handleAddProvider = async (name: string, provType: "bank" | "mfs") => {
    const result = await addProvider.mutateAsync({ name, provider_type: provType });
    // Auto-select the new provider
    setProviderId(result.id);
    toast.success(`"${result.name}" added`);
  };

  const handleAddToProvider = async (name: string, provType: "bank" | "mfs") => {
    const result = await addProvider.mutateAsync({ name, provider_type: provType });
    setToProviderId(result.id);
    toast.success(`"${result.name}" added`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const selectedContact = contacts.find(c => c.id === personId);
    const personName = selectedContact?.name || undefined;
    let descText: string;
    if (isTransfer) {
      const fromLabel = accountType === "cash" ? "Cash" : (getProviderName(accountType, providerId) || accountType);
      const toLabel = toAccountType === "cash" ? "Cash" : (getProviderName(toAccountType, toProviderId) || toAccountType);
      descText = description.trim() || `Transfer: ${fromLabel} → ${toLabel}`;
    } else if (isLoan) {
      descText = `${type === "loan_given" ? "Lent to" : "Received from"} ${personName || "Unknown"}`;
    } else if (isDue) {
      descText = `${type === "due" ? "Due from" : "Due paid to"} ${personName || "Unknown"}`;
    } else {
      descText = description.trim();
    }

    const effectiveFlowType: FlowType = isLoan ? "loan" : "cash";

    try {
      const amtStr = formatCurrency(parseFloat(amount));
      const txData: NewTransaction = {
        date, description: descText, amount: parseFloat(amount),
        type, flow_type: effectiveFlowType,
        person: personName, person_id: personId || undefined,
        account_type: accountType,
        provider_id: (accountType !== "cash" && providerId) ? providerId : undefined,
        provider_name: getProviderName(accountType, providerId) || undefined,
      };

      if (isTransfer) {
        txData.to_account_type = toAccountType;
        txData.to_provider_id = (toAccountType !== "cash" && toProviderId) ? toProviderId : undefined;
        txData.to_provider_name = getProviderName(toAccountType, toProviderId) || undefined;
      }

      if (isEditing && onUpdate && editingTransaction) {
        await onUpdate({ id: editingTransaction.id, ...txData });
        toast.success("Transaction updated!", { description: `${descText} — ${amtStr}` });
        onCancelEdit?.();
      } else {
        await onAdd(txData);
        setShowSuccess(true);
        setTimeout(() => { setShowSuccess(false); resetForm(); setOpen(false); }, 1200);
        toast.success(isTransfer ? t("transferSuccessful") : "Transaction added!", { description: `${descText} — ${amtStr}` });
      }
    } catch {
      toast.error("Failed to save transaction");
    }
    setLoading(false);
  };

  const handleTypeChange = (val: TransactionType) => {
    setType(val);
    setFlowType(val === "loan_given" || val === "loan_received" ? "loan" : "cash");
    setErrors((prev) => ({ ...prev, person: "" }));
    // Reset account fields when switching types
    if (val === "transfer") {
      setAccountType("cash");
      setToAccountType("cash");
    }
  };

  const accountLabel = isTransfer
    ? t("fromAccount")
    : incomingTypes.has(type)
      ? t("depositTo")
      : t("payFrom");

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4 mt-3">
      {/* Type selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t("type")}</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = type === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => handleTypeChange(opt.value as TransactionType)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[9px] font-medium transition-all duration-200 ${isActive ? `${opt.bg} ${opt.border} ${opt.color}` : "bg-secondary border-border text-muted-foreground hover:border-primary/20"}`}>
                <Icon className="w-3.5 h-3.5" />{t(opt.label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t("amount")}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">৳</span>
          <Input type="number" min="0" step="0.01" placeholder="0" value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }}
            className={`pl-8 text-lg font-display font-semibold bg-secondary border-border h-12 ${errors.amount ? "border-expense" : ""}`} />
        </div>
        {errors.amount && <p className="text-[10px] text-expense">{errors.amount}</p>}
      </div>

      {/* Account selector for non-transfer */}
      {needsAccount && !isTransfer && (
        <AccountSelector
          label={accountLabel}
          accountType={accountType}
          setAccountType={setAccountType}
          providerId={providerId}
          setProviderId={(v) => { setProviderId(v); setErrors(p => ({ ...p, provider: "" })); }}
          banks={banks}
          mfsServices={mfsServices}
          onAddProvider={handleAddProvider}
          t={t}
          errors={errors}
          errorKey="provider"
        />
      )}

      {/* Transfer: From and To */}
      {isTransfer && (
        <>
          <AccountSelector
            label={t("fromAccount")}
            accountType={accountType}
            setAccountType={setAccountType}
            providerId={providerId}
            setProviderId={(v) => { setProviderId(v); setErrors(p => ({ ...p, provider: "" })); }}
            banks={banks}
            mfsServices={mfsServices}
            onAddProvider={handleAddProvider}
            t={t}
            errors={errors}
            errorKey="provider"
          />
          <AccountSelector
            label={t("toAccount")}
            accountType={toAccountType}
            setAccountType={setToAccountType}
            providerId={toProviderId}
            setProviderId={(v) => { setToProviderId(v); setErrors(p => ({ ...p, toProvider: "" })); }}
            banks={banks}
            mfsServices={mfsServices}
            onAddProvider={handleAddToProvider}
            t={t}
            errors={errors}
            errorKey="toProvider"
          />
        </>
      )}

      {/* Note - only for non-loan/non-due types */}
      {!needsPerson && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t("note")}</Label>
          <Input placeholder="What was this for?" value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }}
            className={`bg-secondary border-border ${errors.description ? "border-expense" : ""}`} />
          {errors.description && !isTransfer && <p className="text-[10px] text-expense">{errors.description}</p>}
        </div>
      )}

      {/* Date */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t("date")}</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-secondary border-border" />
        {errors.date && <p className="text-[10px] text-expense">{errors.date}</p>}
      </div>

      {/* Person/Beneficiary dropdown - for loans and dues */}
      {needsPerson && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{isDue ? t("beneficiary") : t("selectPerson")}</Label>
            <button type="button" onClick={() => setShowAddPerson(!showAddPerson)}
              className="flex items-center gap-1 text-[10px] text-primary font-medium hover:underline">
              <UserPlus className="w-3 h-3" />{t("addNew")}
            </button>
          </div>

          {showAddPerson && (
            <div className="flex gap-2">
              <Input placeholder={t("personName")} value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                className="bg-secondary border-border text-sm flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddPerson(); } }} />
              <Button type="button" size="sm" onClick={handleAddPerson}
                disabled={!newPersonName.trim() || addContact.isPending}
                className="bg-primary text-primary-foreground px-3">
                {addContact.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </Button>
            </div>
          )}

          <Select value={personId} onValueChange={(v) => { setPersonId(v); setErrors((p) => ({ ...p, person: "" })); }}>
            <SelectTrigger className={`bg-secondary border-border ${errors.person ? "border-expense" : ""}`}>
              <SelectValue placeholder={t("selectPerson")} />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
              {contacts.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">{t("noContacts")}</div>
              )}
            </SelectContent>
          </Select>
          {errors.person && <p className="text-[10px] text-expense">{errors.person}</p>}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : showSuccess ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
        {showSuccess ? t("added") : isEditing ? t("update") : t("addTransaction")}
      </Button>
      {isEditing && onCancelEdit && (
        <Button type="button" variant="outline" onClick={onCancelEdit} className="w-full">{t("cancel")}</Button>
      )}
    </form>
  );

  if (isEditing) {
    return <div className="rounded-2xl glass-card p-5 mb-4">{formContent}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      {!externalOpen && externalOpen !== false && (
        <DialogTrigger asChild>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-primary">
            <Plus className="w-6 h-6" />
          </motion.button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-card border-border max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">{t("newTransaction")}</DialogTitle></DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
