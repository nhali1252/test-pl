// Shared locale state — updated by I18nProvider
let _locale = "en-BD";
let _currency = "BDT";

export function setLocaleConfig(locale: string, currency: string) {
  _locale = locale;
  _currency = currency;
}

export function getLocaleConfig() {
  return { locale: _locale, currency: _currency };
}

function safeNum(n: unknown): number {
  if (n == null) return 0;
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function formatCurrency(n: unknown): string {
  const v = safeNum(n);
  try {
    return new Intl.NumberFormat(_locale, {
      style: "currency",
      currency: _currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(v);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);
  }
}

export function formatNumber(n: unknown, decimals = 0): string {
  const v = safeNum(n);
  try {
    return new Intl.NumberFormat(_locale, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: 0,
    }).format(v);
  } catch {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(v);
  }
}

export function formatCompactNumber(n: unknown): string {
  const v = safeNum(n);
  try {
    return new Intl.NumberFormat(_locale, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(v);
  } catch {
    return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(v);
  }
}

export function getCurrencySymbol(): string {
  try {
    const parts = new Intl.NumberFormat(_locale, {
      style: "currency",
      currency: _currency,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value || _currency;
  } catch {
    return _currency;
  }
}

/** Locale-aware date formatting */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(_locale, options);
  } catch {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", options);
  }
}

/** Locale-aware month label */
export function formatMonthLabel(
  monthStr: string,
  options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }
): string {
  try {
    return new Date(monthStr + "-01").toLocaleDateString(_locale, options);
  } catch {
    return new Date(monthStr + "-01").toLocaleDateString("en-US", options);
  }
}

/** Short month for chart axis */
export function formatMonthShort(monthStr: string): string {
  try {
    return new Date(monthStr + "-01").toLocaleDateString(_locale, { month: "short" });
  } catch {
    return new Date(monthStr + "-01").toLocaleDateString("en-US", { month: "short" });
  }
}
