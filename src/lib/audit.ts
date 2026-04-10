export type AuditEvent =
  | "app_started"
  | "language_changed"
  | "update_checked"
  | "update_available"
  | "update_applied"
  | "update_failed"
  | "due_created"
  | "due_paid_created"
  | "beneficiary_validation_failed"
  | "unknown_transaction_type"
  | "calculation_fallback"
  | "runtime_error"
  | "form_validation_failed"
  | "sw_registration_error"
  | "offline_ready"
  | "transfer_created"
  | "country_changed";

interface AuditEntry {
  event: AuditEvent;
  timestamp: string;
  details?: string;
}

const MAX_ENTRIES = 200;
const STORAGE_KEY = "pocket-ledger-audit";

function getLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLog(entries: AuditEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {}
}

export function audit(event: AuditEvent, details?: string) {
  const entry: AuditEntry = { event, timestamp: new Date().toISOString(), details };
  const log = getLog();
  log.push(entry);
  saveLog(log);
  if (import.meta.env.DEV) {
    console.debug(`[Audit] ${event}`, details || "");
  }
}

export function getAuditLog(): AuditEntry[] {
  return getLog();
}

export function clearAuditLog() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// Global error handler
export function setupGlobalErrorHandlers() {
  window.addEventListener("error", (e) => {
    audit("runtime_error", `${e.message} at ${e.filename}:${e.lineno}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    audit("runtime_error", `Unhandled rejection: ${String(e.reason)}`);
  });
}
