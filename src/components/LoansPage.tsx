import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, User, UserPlus, Plus, Loader2, Trash2 } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useContacts } from "@/hooks/useContacts";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoansPage() {
  const { loansByPerson } = useTransactions();
  const { contacts, addContact, deleteContact } = useContacts();
  const queryClient = useQueryClient();
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

  const entries = Object.entries(loansByPerson).sort((a, b) => Math.abs(b[1].net) - Math.abs(a[1].net));
  const oweMe = entries.filter(([, d]) => d.net > 0);
  const iOwe = entries.filter(([, d]) => d.net < 0);
  const settled = entries.filter(([, d]) => d.net === 0 && d.given > 0);

  const toggleSettled = async (id: string, currentSettled: boolean) => {
    const { error } = await supabase.from("transactions").update({ settled: !currentSettled } as any).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    toast.success(currentSettled ? "Marked as pending" : "Marked as settled");
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim()) return;
    try {
      await addContact.mutateAsync(newPersonName.trim());
      setNewPersonName("");
      setShowAddPerson(false);
      toast.success(`"${newPersonName.trim()}" added to contacts`);
    } catch {
      toast.error("Person already exists or failed to add");
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    try {
      await deleteContact.mutateAsync(id);
      toast.success(`"${name}" removed from contacts`);
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  const renderPersonCard = ([person, data]: [string, typeof loansByPerson[string]], i: number) => {
    const isExpanded = expandedPerson === person;
    const pending = data.given - data.received;

    return (
      <motion.div key={person} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl glass-card overflow-hidden hover-lift">
        <button onClick={() => setExpandedPerson(isExpanded ? null : person)} className="w-full p-5 text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{person}</h3>
            </div>
            <span className={`text-sm font-display font-bold ${data.net > 0 ? "text-lent" : data.net < 0 ? "text-received" : "text-cash"}`}>
              {data.net > 0 ? "Owes you " : data.net < 0 ? "You owe " : "Settled "}
              {formatCurrency(Math.abs(data.net))}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-lent/10 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-lent" />
              </div>
              Given: {formatCurrency(data.given)}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-received/10 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-received" />
              </div>
              Received: {formatCurrency(data.received)}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {pending > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-lent/10 text-lent">
                <Clock className="w-3 h-3" />Pending: {formatCurrency(pending)}
              </span>
            )}
            {data.net === 0 && data.given > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-cash/10 text-cash">
                <CheckCircle2 className="w-3 h-3" />Fully Settled
              </span>
            )}
            {data.net < 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-expense/10 text-expense">
                <Clock className="w-3 h-3" />You owe: {formatCurrency(Math.abs(pending))}
              </span>
            )}
          </div>
        </button>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }} className="border-t border-border/50">
            <div className="p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-2">Transaction History</p>
              {data.transactions.map((t) => {
                const isGiven = t.type === "loan_given";
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                    <div className={`w-8 h-8 rounded-lg ${isGiven ? "bg-lent/10" : "bg-received/10"} flex items-center justify-center`}>
                      {isGiven ? <ArrowUpRight className="w-3.5 h-3.5 text-lent" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-received" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(t.date, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <p className={`text-xs font-display font-semibold ${isGiven ? "text-lent" : "text-received"}`}>
                      {formatCurrency(Number(t.amount))}
                    </p>
                    <button onClick={() => toggleSettled(t.id, t.settled)}
                      className={`p-1.5 rounded-lg transition-colors ${t.settled ? "bg-cash/10 text-cash" : "bg-secondary text-muted-foreground hover:text-primary"}`}>
                      {t.settled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Contacts without any loan transactions
  const contactsWithoutLoans = contacts.filter(c => !entries.some(([name]) => name === c.name));

  return (
    <div className="space-y-6">
      {/* Add Person Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Contacts</h2>
        <button onClick={() => setShowAddPerson(!showAddPerson)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
          <UserPlus className="w-3.5 h-3.5" />Add Person
        </button>
      </div>

      {showAddPerson && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="flex gap-2">
          <Input placeholder="Person name" value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            className="bg-secondary/50 border-border/50 text-sm flex-1 rounded-xl"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddPerson(); } }} />
          <Button size="sm" onClick={handleAddPerson}
            disabled={!newPersonName.trim() || addContact.isPending}
            className="bg-primary text-primary-foreground px-4 rounded-xl">
            {addContact.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </Button>
        </motion.div>
      )}

      {/* Contacts without loans */}
      {contactsWithoutLoans.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contactsWithoutLoans.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 text-xs font-medium text-muted-foreground group">
              <User className="w-3 h-3" />
              {c.name}
              <button onClick={() => handleDeleteContact(c.id, c.name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                <Trash2 className="w-3 h-3 text-expense" />
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && contactsWithoutLoans.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">No loans yet</p>
          <p className="text-muted-foreground/50 text-xs mt-1.5">Add a person and start tracking loans</p>
        </div>
      )}

      {oweMe.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">They Owe You</h2>
          <div className="space-y-3">{oweMe.map((e, i) => renderPersonCard(e, i))}</div>
        </div>
      )}
      {iOwe.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">You Owe</h2>
          <div className="space-y-3">{iOwe.map((e, i) => renderPersonCard(e, i))}</div>
        </div>
      )}
      {settled.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Settled</h2>
          <div className="space-y-3">{settled.map((e, i) => renderPersonCard(e, i))}</div>
        </div>
      )}
    </div>
  );
}
