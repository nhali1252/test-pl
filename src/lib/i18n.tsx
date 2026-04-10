import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setLocaleConfig } from "@/lib/currency";

export type Lang = "en" | "bn";

export type Country = "BD" | "IN" | "US" | "GB" | "SA" | "AE" | "PK" | "NP" | "LK" | "MY";

interface CountryConfig {
  label: string;
  labelBn: string;
  currency: string;
  localeEn: string;
  localeBn: string;
}

export const countryMap: Record<Country, CountryConfig> = {
  BD: { label: "Bangladesh", labelBn: "বাংলাদেশ", currency: "BDT", localeEn: "en-BD", localeBn: "bn-BD" },
  IN: { label: "India", labelBn: "ভারত", currency: "INR", localeEn: "en-IN", localeBn: "bn-IN" },
  US: { label: "United States", labelBn: "যুক্তরাষ্ট্র", currency: "USD", localeEn: "en-US", localeBn: "en-US" },
  GB: { label: "United Kingdom", labelBn: "যুক্তরাজ্য", currency: "GBP", localeEn: "en-GB", localeBn: "en-GB" },
  SA: { label: "Saudi Arabia", labelBn: "সৌদি আরব", currency: "SAR", localeEn: "en-SA", localeBn: "ar-SA" },
  AE: { label: "UAE", labelBn: "সংযুক্ত আরব আমিরাত", currency: "AED", localeEn: "en-AE", localeBn: "ar-AE" },
  PK: { label: "Pakistan", labelBn: "পাকিস্তান", currency: "PKR", localeEn: "en-PK", localeBn: "en-PK" },
  NP: { label: "Nepal", labelBn: "নেপাল", currency: "NPR", localeEn: "en-NP", localeBn: "en-NP" },
  LK: { label: "Sri Lanka", labelBn: "শ্রীলঙ্কা", currency: "LKR", localeEn: "en-LK", localeBn: "en-LK" },
  MY: { label: "Malaysia", labelBn: "মালয়েশিয়া", currency: "MYR", localeEn: "en-MY", localeBn: "en-MY" },
};

function resolveLocale(lang: Lang, country: Country): string {
  const cfg = countryMap[country];
  return lang === "bn" ? cfg.localeBn : cfg.localeEn;
}

const translations = {
  en: {
    profile: "Profile",
    language: "Language",
    english: "English",
    bangla: "বাংলা",
    newTransaction: "New Transaction",
    type: "Type",
    amount: "Amount",
    note: "Note",
    date: "Date",
    beneficiary: "Beneficiary",
    addTransaction: "Add Transaction",
    income: "Income",
    expense: "Expense",
    due: "Due",
    duePaid: "Due Paid",
    lent: "Lent",
    received: "Received",
    netBalance: "Net Balance",
    cash: "Cash",
    monthlySummary: "Monthly Summary",
    checkForUpdates: "Check for Updates",
    appUpdate: "App Update",
    beneficiaryRequired: "Beneficiary is required",
    amountRequired: "Amount is required",
    dateRequired: "Date is required",
    updateAvailable: "New update available",
    updateNow: "Update Now",
    home: "Home",
    history: "History",
    dues: "Dues",
    loans: "Loans",
    charts: "Charts",
    more: "More",
    recentTransactions: "Recent Transactions",
    noTransactions: "No transactions yet.",
    search: "Search transactions...",
    allTypes: "All Types",
    allFlows: "All Flows",
    loanGiven: "Loan Given",
    loanReceived: "Loan Received",
    editTransaction: "Edit Transaction",
    deleteTransaction: "Delete Transaction",
    deleteConfirm: "This action cannot be undone. Your balances will be recalculated automatically.",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save Changes",
    saving: "Saving...",
    deleting: "Deleting...",
    added: "Added!",
    update: "Update",
    profileInfo: "Profile Info",
    edit: "Edit",
    name: "Name",
    username: "Username",
    changePassword: "Change Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
    signOut: "Sign Out",
    back: "Back",
    personalFinance: "Personal Finance",
    generateReport: "Generate Monthly PDF Report",
    incomeVsExpense: "Income vs Expense",
    flowBreakdown: "Flow Breakdown",
    dueTaken: "Due Taken",
    duePaidLabel: "Due Paid",
    currentDue: "Current Due",
    addNew: "Add New",
    selectPerson: "Select a person",
    noContacts: "No contacts yet. Add one above.",
    personName: "Person name",
    required: "Required",
    enterValidAmount: "Enter a valid amount",
    selectAPerson: "Select a person",
    noOutstandingLoan: "This person has no outstanding loan",
    cannotReceiveMore: "Cannot receive more than",
    loading: "Loading...",
    noData: "No data to display",
    dueRemaining: "Due Remaining",
    totalDueTaken: "Total Due Taken",
    totalDuePaidLabel: "Total Due Paid",
    recentDueTransactions: "Recent Due Transactions",
    noDueTransactions: "No due transactions yet.",
    addDueFromMain: "Add due from the main + button.",
    usernameRequired: "Username is required",
    usernameExists: "Username already exists",
    accountExists: "Account already exists",
    noAccountWithUsername: "No account found with this username",
    loginFailed: "Login failed",
    profileUpdateFailed: "Profile update failed",
    profileUpdated: "Profile updated!",
    nameRequired: "Name is required",
    emailOrUsername: "Email or Username",
    checkEmailConfirm: "Check your email to confirm your account!",
    resetLinkSent: "Password reset link sent! Check your email.",
    passwordMin8: "Password must be at least 8 characters",
    passwordUppercase: "Password must contain an uppercase letter",
    passwordNumber: "Password must contain a number",
    invalidEmailUsername: "Invalid email or username",
    transfer: "Transfer",
    bank: "Bank",
    mfs: "MFS",
    accountType: "Account",
    depositTo: "Deposit To",
    payFrom: "Pay From",
    fromAccount: "From Account",
    toAccount: "To Account",
    bankName: "Bank Name",
    mfsService: "MFS Service",
    selectProvider: "Select provider",
    addNewProvider: "Add New",
    providerNamePlaceholder: "Enter name",
    sameAccountNotAllowed: "From and To cannot be the same",
    insufficientBalance: "Insufficient balance",
    transferSuccessful: "Transfer successful",
    accountBalances: "Account Balances",
    noProviders: "No providers added yet",
    manageProviders: "Manage Accounts",
    providerDeleteFailed: "Failed to delete provider",
    country: "Country / Region",
  },
  bn: {
    profile: "প্রোফাইল",
    language: "ভাষা",
    english: "English",
    bangla: "বাংলা",
    newTransaction: "নতুন ট্রানজেকশন",
    type: "ধরন",
    amount: "পরিমাণ",
    note: "নোট",
    date: "তারিখ",
    beneficiary: "ব্যক্তি",
    addTransaction: "ট্রানজেকশন যোগ করুন",
    income: "আয়",
    expense: "খরচ",
    due: "দেনা",
    duePaid: "দেনা পরিশোধ",
    lent: "ধার দেওয়া",
    received: "ফেরত পাওয়া",
    netBalance: "নেট ব্যালেন্স",
    cash: "ক্যাশ",
    monthlySummary: "মাসিক সারাংশ",
    checkForUpdates: "আপডেট চেক করুন",
    appUpdate: "অ্যাপ আপডেট",
    beneficiaryRequired: "ব্যক্তির নাম প্রয়োজন",
    amountRequired: "পরিমাণ প্রয়োজন",
    dateRequired: "তারিখ প্রয়োজন",
    updateAvailable: "নতুন আপডেট পাওয়া গেছে",
    updateNow: "এখনই আপডেট করুন",
    home: "হোম",
    history: "ইতিহাস",
    dues: "দেনা",
    loans: "ধার",
    charts: "চার্ট",
    more: "আরও",
    recentTransactions: "সাম্প্রতিক ট্রানজেকশন",
    noTransactions: "কোনো ট্রানজেকশন নেই।",
    search: "ট্রানজেকশন খুঁজুন...",
    allTypes: "সব ধরন",
    allFlows: "সব ফ্লো",
    loanGiven: "ধার দেওয়া",
    loanReceived: "ধার ফেরত",
    editTransaction: "ট্রানজেকশন সম্পাদনা",
    deleteTransaction: "ট্রানজেকশন মুছুন",
    deleteConfirm: "এটি পূর্বাবস্থায় ফেরানো যাবে না। আপনার ব্যালেন্স স্বয়ংক্রিয়ভাবে পুনঃগণনা হবে।",
    cancel: "বাতিল",
    delete: "মুছুন",
    save: "পরিবর্তন সংরক্ষণ",
    saving: "সংরক্ষণ হচ্ছে...",
    deleting: "মুছে ফেলা হচ্ছে...",
    added: "যোগ হয়েছে!",
    update: "আপডেট",
    profileInfo: "প্রোফাইল তথ্য",
    edit: "সম্পাদনা",
    name: "নাম",
    username: "ব্যবহারকারী নাম",
    changePassword: "পাসওয়ার্ড পরিবর্তন",
    newPassword: "নতুন পাসওয়ার্ড",
    confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
    updatePassword: "পাসওয়ার্ড আপডেট",
    signOut: "সাইন আউট",
    back: "ফিরে যান",
    personalFinance: "ব্যক্তিগত অর্থ",
    generateReport: "মাসিক পিডিএফ রিপোর্ট তৈরি করুন",
    incomeVsExpense: "আয় বনাম খরচ",
    flowBreakdown: "ফ্লো বিভাজন",
    dueTaken: "দেনা নেওয়া",
    duePaidLabel: "দেনা পরিশোধ",
    currentDue: "বর্তমান দেনা",
    addNew: "নতুন যোগ করুন",
    selectPerson: "একজন ব্যক্তি নির্বাচন করুন",
    noContacts: "এখনও কোনো পরিচিতি নেই। উপরে যোগ করুন।",
    personName: "ব্যক্তির নাম",
    required: "আবশ্যক",
    enterValidAmount: "সঠিক পরিমাণ দিন",
    selectAPerson: "একজন ব্যক্তি নির্বাচন করুন",
    noOutstandingLoan: "এই ব্যক্তির কোনো বকেয়া ধার নেই",
    cannotReceiveMore: "এর বেশি গ্রহণ করা যাবে না",
    loading: "লোড হচ্ছে...",
    noData: "দেখানোর মতো কোনো তথ্য নেই",
    dueRemaining: "বাকি দেনা",
    totalDueTaken: "মোট দেনা নেওয়া",
    totalDuePaidLabel: "মোট দেনা পরিশোধ",
    recentDueTransactions: "সাম্প্রতিক দেনা ট্রানজেকশন",
    noDueTransactions: "এখনো কোনো দেনা ট্রানজেকশন নেই।",
    addDueFromMain: "মূল + বোতাম থেকে দেনা যোগ করুন।",
    usernameRequired: "ব্যবহারকারী নাম প্রয়োজন",
    usernameExists: "ব্যবহারকারী নাম ইতিমধ্যে ব্যবহৃত",
    accountExists: "অ্যাকাউন্ট ইতিমধ্যে আছে",
    noAccountWithUsername: "এই ব্যবহারকারী নামে কোনো অ্যাকাউন্ট নেই",
    loginFailed: "লগইন ব্যর্থ",
    profileUpdateFailed: "প্রোফাইল আপডেট ব্যর্থ",
    profileUpdated: "প্রোফাইল আপডেট হয়েছে!",
    nameRequired: "নাম প্রয়োজন",
    emailOrUsername: "ইমেইল বা ব্যবহারকারী নাম",
    checkEmailConfirm: "আপনার অ্যাকাউন্ট নিশ্চিত করতে ইমেইল চেক করুন!",
    resetLinkSent: "পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! ইমেইল চেক করুন।",
    passwordMin8: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে",
    passwordUppercase: "পাসওয়ার্ডে একটি বড় হাতের অক্ষর থাকতে হবে",
    passwordNumber: "পাসওয়ার্ডে একটি সংখ্যা থাকতে হবে",
    invalidEmailUsername: "ভুল ইমেইল বা ব্যবহারকারী নাম",
    transfer: "ট্রান্সফার",
    bank: "ব্যাংক",
    mfs: "এমএফএস",
    accountType: "অ্যাকাউন্ট",
    depositTo: "জমা করুন",
    payFrom: "থেকে পরিশোধ",
    fromAccount: "উৎস অ্যাকাউন্ট",
    toAccount: "গন্তব্য অ্যাকাউন্ট",
    bankName: "ব্যাংকের নাম",
    mfsService: "এমএফএস সেবা",
    selectProvider: "প্রদানকারী নির্বাচন",
    addNewProvider: "নতুন যোগ",
    providerNamePlaceholder: "নাম লিখুন",
    sameAccountNotAllowed: "উৎস ও গন্তব্য একই হতে পারে না",
    insufficientBalance: "অপর্যাপ্ত ব্যালেন্স",
    transferSuccessful: "ট্রান্সফার সফল",
    accountBalances: "অ্যাকাউন্ট ব্যালেন্স",
    noProviders: "এখনো কোনো প্রদানকারী যোগ হয়নি",
    manageProviders: "অ্যাকাউন্ট ব্যবস্থাপনা",
    providerDeleteFailed: "প্রদানকারী মুছতে ব্যর্থ",
    country: "দেশ / অঞ্চল",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  country: Country;
  setCountry: (country: Country) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  country: "BD",
  setCountry: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem("pocket-ledger-lang");
      return (saved === "bn" ? "bn" : "en") as Lang;
    } catch {
      return "en";
    }
  });

  const [country, setCountryState] = useState<Country>(() => {
    try {
      const saved = localStorage.getItem("pocket-ledger-country");
      if (saved && saved in countryMap) return saved as Country;
      return "BD";
    } catch {
      return "BD";
    }
  });

  // Sync locale config whenever lang or country changes
  useEffect(() => {
    const locale = resolveLocale(lang, country);
    const currency = countryMap[country].currency;
    setLocaleConfig(locale, currency);
  }, [lang, country]);

  // Also set on mount
  useEffect(() => {
    const locale = resolveLocale(lang, country);
    const currency = countryMap[country].currency;
    setLocaleConfig(locale, currency);
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try { localStorage.setItem("pocket-ledger-lang", newLang); } catch {}
  };

  const setCountry = (newCountry: Country) => {
    setCountryState(newCountry);
    try { localStorage.setItem("pocket-ledger-country", newCountry); } catch {}
  };

  const t = (key: string): string => {
    const dict = translations[lang] as Record<string, string>;
    const fallback = translations.en as Record<string, string>;
    return dict[key] ?? fallback[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, country, setCountry, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
