import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TransactionType, FlowType } from "@/hooks/useTransactions";
import { useI18n } from "@/lib/i18n";

export interface FilterValues {
  dateFrom: string;
  dateTo: string;
  type: TransactionType | "all";
  flowType: FlowType | "all";
}

interface Props {
  filters: FilterValues;
  onChange: (f: FilterValues) => void;
}

export default function TransactionFilters({ filters, onChange }: Props) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <Input type="date" value={filters.dateFrom} onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        className="bg-secondary border-border text-xs" placeholder="From" />
      <Input type="date" value={filters.dateTo} onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        className="bg-secondary border-border text-xs" placeholder="To" />
      <Select value={filters.type} onValueChange={(v) => onChange({ ...filters, type: v as TransactionType | "all" })}>
        <SelectTrigger className="bg-secondary border-border text-xs"><SelectValue placeholder={t("type")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTypes")}</SelectItem>
          <SelectItem value="income">{t("income")}</SelectItem>
          <SelectItem value="expense">{t("expense")}</SelectItem>
          <SelectItem value="loan_given">{t("loanGiven")}</SelectItem>
          <SelectItem value="loan_received">{t("loanReceived")}</SelectItem>
          <SelectItem value="due">{t("due")}</SelectItem>
          <SelectItem value="due_paid">{t("duePaid")}</SelectItem>
          <SelectItem value="transfer">{t("transfer")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.flowType} onValueChange={(v) => onChange({ ...filters, flowType: v as FlowType | "all" })}>
        <SelectTrigger className="bg-secondary border-border text-xs"><SelectValue placeholder="Flow" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allFlows")}</SelectItem>
          <SelectItem value="cash">{t("cash")}</SelectItem>
          <SelectItem value="loan">{t("lent")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
