import { useState } from "react";
import type { Transaction, TransactionType } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { Pencil, Trash2, X, Check, DollarSign, TrendingDown, ArrowUpRight, ArrowDownLeft, HandCoins, HandshakeIcon, ArrowLeftRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const typeConfig: Record<TransactionType, { labelKey: string; icon: typeof DollarSign; colorClass: string }> = {
  income: { labelKey: "income", icon: DollarSign, colorClass: "text-income" },
  expense: { labelKey: "expense", icon: TrendingDown, colorClass: "text-expense" },
  loan_given: { labelKey: "lent", icon: ArrowUpRight, colorClass: "text-lent" },
  loan_received: { labelKey: "received", icon: ArrowDownLeft, colorClass: "text-received" },
  due: { labelKey: "due", icon: HandCoins, colorClass: "text-amber-400" },
  due_paid: { labelKey: "duePaid", icon: HandshakeIcon, colorClass: "text-emerald-400" },
  transfer: { labelKey: "transfer", icon: ArrowLeftRight, colorClass: "text-primary" },
};

function getAccountLabel(tx: Transaction, t: (k: string) => string): string {
  if (tx.type === "transfer") {
    const from = tx.account_type === "cash" ? t("cash") : (tx.provider_name || t(tx.account_type));
    const to = tx.to_account_type === "cash" ? t("cash") : (tx.to_provider_name || t(tx.to_account_type || "cash"));
    return `${from} → ${to}`;
  }
  if (!tx.account_type || tx.account_type === "cash") return "";
  const label = tx.provider_name || t(tx.account_type);
  const incoming = tx.type === "income" || tx.type === "due" || tx.type === "loan_received";
  return incoming ? `→ ${label}` : `← ${label}`;
}

interface Props {
  transactions: Transaction[];
  onEdit?: (id: string, updates: Partial<Transaction>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", type: "income" as TransactionType, date: "", person: "" });
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        {t("noTransactions")}
      </div>
    );
  }

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      date: tx.date,
      person: tx.person || "",
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async () => {
    if (!onEdit || !editingId) return;
    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try {
      await onEdit(editingId, {
        description: editForm.description,
        amount,
        type: editForm.type,
        date: editForm.date,
        person: editForm.person || null,
      });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!onDelete || !deleteId) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const needsPerson = (type: TransactionType) => type === "loan_given" || type === "loan_received" || type === "due" || type === "due_paid";

  return (
    <>
      <div className="space-y-2.5">
        {transactions.map((tx) => {
          const config = typeConfig[tx.type] || typeConfig.income;
          const Icon = config.icon;
          const isEditing = editingId === tx.id;

          if (isEditing) {
            return (
              <div key={tx.id} className="p-4 rounded-xl glass-card space-y-3 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("editTransaction")}</span>
                  <button onClick={cancelEdit} className="p-1 rounded-lg hover:bg-secondary/80 transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <Select value={editForm.type} onValueChange={(v) => setEditForm((p) => ({ ...p, type: v as TransactionType }))}>
                  <SelectTrigger className="bg-secondary/50 border-border/50 text-sm rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{t("income")}</SelectItem>
                    <SelectItem value="expense">{t("expense")}</SelectItem>
                    <SelectItem value="loan_given">{t("lent")}</SelectItem>
                    <SelectItem value="loan_received">{t("received")}</SelectItem>
                    <SelectItem value="due">{t("due")}</SelectItem>
                    <SelectItem value="due_paid">{t("duePaid")}</SelectItem>
                    <SelectItem value="transfer">{t("transfer")}</SelectItem>
                  </SelectContent>
                </Select>

                <Input placeholder={t("amount")} type="number" min="0" step="any" value={editForm.amount}
                  onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))}
                  className="bg-secondary/50 border-border/50 text-sm rounded-xl h-10" />

                <Input placeholder={t("note")} value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="bg-secondary/50 border-border/50 text-sm rounded-xl h-10" />

                {needsPerson(editForm.type) && (
                  <Input placeholder={t("beneficiary")} value={editForm.person}
                    onChange={(e) => setEditForm((p) => ({ ...p, person: e.target.value }))}
                    className="bg-secondary/50 border-border/50 text-sm rounded-xl h-10" />
                )}

                <Input type="date" value={editForm.date}
                  onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                  className="bg-secondary/50 border-border/50 text-sm rounded-xl h-10" />

                <Button onClick={saveEdit} disabled={saving} className="w-full rounded-xl h-10 gap-2" size="sm">
                  <Check className="w-4 h-4" />
                  {saving ? t("saving") : t("save")}
                </Button>
              </div>
            );
          }

          const isPositive = tx.type === "income" || tx.type === "loan_received" || tx.type === "due";
          const isTransfer = tx.type === "transfer";
          const accountLabel = getAccountLabel(tx, t);

          return (
            <div key={tx.id} className="p-3.5 rounded-xl glass-card flex items-center gap-3 group">
              <div className={`w-8 h-8 rounded-lg ${config.colorClass.replace("text-", "bg-")}/10 flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${config.colorClass}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {tx.description}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDate(tx.date)}
                  {tx.person && ` · ${tx.person}`}
                  {accountLabel && <span className="ml-1 text-primary/70">· {accountLabel}</span>}
                  {(tx.type === "due" || tx.type === "due_paid") && (
                    <span className="ml-1 text-amber-400/80">· {t(config.labelKey)}</span>
                  )}
                </p>
              </div>
              <p className={`text-sm font-display font-bold ${isTransfer ? "text-primary" : isPositive ? "text-income" : "text-expense"}`}>
                {isTransfer ? "" : isPositive ? "+" : "-"}{formatCurrency(tx.amount)}
              </p>
              {(onEdit || onDelete) && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {onEdit && (
                    <button onClick={() => startEdit(tx)}
                      className="p-1.5 rounded-lg hover:bg-secondary/80 transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => setDeleteId(tx.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("deleteTransaction")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">{t("cancel")}</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting} className="rounded-xl">
              {deleting ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
