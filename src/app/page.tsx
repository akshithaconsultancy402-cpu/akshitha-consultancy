"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { motion } from 'framer-motion';
import { DeliveredModal } from "@/src/components/DeliveredModal";
import EditClientModal from "@/src/components/EditClientModal";
import { RecordsTable } from "@/src/components/RecordsTable";
import { ThemeToggle } from "@/src/components/ThemeToggle";
import { supabase } from '../lib/supabase';
import MoneyVsMonthsChart from "../components/MoneyVsMonthsChart";
import { UpcomingSlotBanner } from "@/src/components/UpcomingSlotBanner";
import {
  badgeClass, btnSecondary, cardClass, cardHeaderBorder, headingBase, headingLg,
  inputClass, labelClass, pageBg, panelMuted, headerClass, tabInactive, textMuted,
  textSubtle, transitionTheme,
} from "@/src/lib/ui-classes";
import { emptyForm, SERVICE_OPTIONS, type ClientRecord } from "@/src/lib/types";
import {
  formatCurrency, getAmountDue, getReportFinancials, getUpcomingSlotAlerts,
  isInDateRange, isThisMonth, isToday, printRecordsTable, searchRecords,
} from "@/src/lib/utils";

const NAVIGATION_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "records", label: "All Records" },
  { id: "period", label: "Time Periods" },
  { id: "reports", label: "Reports" },
  { id: "finance", label: "Finance Analytics" },
] as const;

/* ── Helper Sub-Components ── */
function StatCard({ label, value, accent, sub }: { label: string; value: number | string; accent: string; sub: string }) {
  return (
    <div className={`${cardClass} p-4`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${textSubtle}`}>{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${accent}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function FinancialStat({ label, value, accent, bg }: { label: string; value: string; accent: string; bg: string }) {
  return (
    <div className={`rounded-xl border p-4 ${bg} dark:bg-slate-800/50 dark:border-slate-700 print:bg-white print:border-slate-300`}>
      <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 print:text-slate-700">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent} dark:text-slate-100`}>{value}</p>
    </div>
  );
}

function PeriodSection({ title, records, onMarkDelivered, onEdit, onDelete, emptyMessage }: {
  title: string; records: ClientRecord[]; onMarkDelivered: (id: string) => void;
  onEdit: (r: ClientRecord) => void; onDelete: (r: ClientRecord) => void; emptyMessage: string;
}) {
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <h2 className={headingBase}>{title}</h2>
      {records.length === 0 ? (
        <p className={`mt-3 ${textMuted}`}>{emptyMessage}</p>
      ) : (
        <div className="mt-4">
          <RecordsTable records={records} onMarkDelivered={onMarkDelivered} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
    </section>
  );
}

export default function Page() {
  // --- 1. STATE INITIALIZATION ---
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [form, setForm] = useState({ ...emptyForm, totalFee: 0, amountPaid: 0 });
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [recordFilter, setRecordFilter] = useState<"all" | "today_slots" | "total_pending" | "delivered">("all");
  const [deliverTarget, setDeliverTarget] = useState<ClientRecord | null>(null);
  const [editTarget, setEditTarget] = useState<ClientRecord | null>(null);
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  
  const formRef = useRef<HTMLFormElement>(null);

  // --- 2. HANDLERS ---
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
  
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
  
      if (error) {
        setAuthError(error.message || "Sign in failed");
        return;
      }
  
      if (data?.session) {
        setSession(data.session);
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (err: any) {
      setAuthError(err.message || "An error occurred");
      console.error("Auth error:", err);
    } finally {
      setAuthLoading(false);
    }
  };
  
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError("");
  
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // This auto-detects localhost or Vercel
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });
  
      if (error) {
        setAuthError(error.message || "Google sign-in failed");
        setAuthLoading(false);
      }
    } catch (err: any) {
      setAuthError(err.message || "An error occurred with Google sign-in");
      console.error("Google auth error:", err);
      setAuthLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleMarkDelivered = (id: string) => {
    const record = records.find(r => r.id === id);
    if (record) setDeliverTarget(record);
  };

  const handleDeliverConfirm = () => { setDeliverTarget(null); };
  const handleDeliverCancel = () => setDeliverTarget(null);
  const handleEdit = (record: ClientRecord) => setEditTarget(record);
  const handleSaveEdit = (updated: ClientRecord) => {
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditTarget(null);
  };
  const handleDelete = (record: ClientRecord) => {
    setRecords(prev => prev.filter(r => r.id !== record.id));
  };

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFormFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const formElements = Array.from(formRef.current?.elements || []) as HTMLElement[];
      const currentIndex = formElements.indexOf(e.target as HTMLElement);
      const nextElement = formElements[currentIndex + 1];
      if (nextElement) nextElement.focus();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRecord: ClientRecord = {
      ...form,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "active",
    } as ClientRecord;
  
    // Save to Supabase
    const { data, error } = await supabase
      .from('records')
      .insert([newRecord]);
  
    if (error) {
      console.error("Error saving record:", error);
      alert("Failed to save record");
      return;
    }
  
    // Update local state
    setRecords(prev => [newRecord, ...prev]);
    setForm({ ...emptyForm, totalFee: 0, amountPaid: 0 });
    formRef.current?.reset();
    alert("Record saved successfully!");
  };

  // --- 3. DERIVED DATA ---
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    // Check if there's an existing session on mount
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
      }
    };
    
    getSession();
  
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setSession(session);
        } else {
          setSession(null);
        }
      }
    );
  
    return () => subscription?.unsubscribe();
  }, []);
  
  // Load records from Supabase on page load
  useEffect(() => {
    const loadRecords = async () => {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .order('createdAt', { ascending: false });
  
      if (error) {
        console.error("Error loading records:", error);
        return;
      }
  
      if (data) {
        setRecords(data as ClientRecord[]);
      }
    };
  
    loadRecords();
  }, []);
  
  const filteredRecords = useMemo(() => {
    let filtered = searchRecords(records, search, recordFilter);
  
    if (recordFilter === "today_slots") {
      filtered = filtered.filter(r => r.bookedSlotDateTime && isToday(r.bookedSlotDateTime));
    } else if (recordFilter === "total_pending") {
      filtered = filtered.filter(r => r.status !== "delivered" && r.bookedSlotDateTime);
    } else if (recordFilter === "delivered") {
      filtered = filtered.filter(r => r.status === "delivered");
    }
  
    return filtered;
  }, [records, search, recordFilter]);
    
  const upcomingAlerts = useMemo(() => getUpcomingSlotAlerts(records), [records]);
  
  const isMarriageSelected = form.serviceType === "marriage"
  
  const formAmountDue = useMemo(() => getAmountDue({ totalFee: Number(form.totalFee) || 0, amountPaid: Number(form.amountPaid) || 0 }), [form.totalFee, form.amountPaid]);
  const stats = useMemo(() => {
    const totalDue = records.reduce((sum, r) => sum + getAmountDue(r), 0);;
    const todayClients = records.filter(r => isToday(r.createdAt)).length;
    const todayPendingSlots = records.filter(r => r.bookedSlotDateTime && isToday(r.bookedSlotDateTime) && r.status !== "delivered").length;
    const totalPendingSlots = records.filter(r => r.status !== "delivered" && r.bookedSlotDateTime).length;
    return { totalDue, todayClients, todayPendingSlots, totalPendingSlots };
  }, [records]);

  const todayRecords = useMemo(() => records.filter(r => isToday(r.createdAt)), [records]);
  const monthRecords = useMemo(() => records.filter(r => isThisMonth(r.createdAt)), [records]);
  const todaySlots = useMemo(() => records.filter(r => r.bookedSlotDateTime && isToday(r.bookedSlotDateTime)), [records]);
  const monthSlots = useMemo(() => records.filter(r => r.bookedSlotDateTime && isThisMonth(r.bookedSlotDateTime)), [records]);

  const reportRecords = useMemo(() => {
    if (!reportStart || !reportEnd) return [];
    return records.filter(r => isInDateRange(r.createdAt, reportStart, reportEnd));
  }, [records, reportStart, reportEnd]);

  const reportFinancials = useMemo(() => getReportFinancials(reportRecords), [reportRecords]);

  const financeMetrics = useMemo(() => {
    const todayIncome = records
      .filter(r => isToday(r.createdAt))
      .reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0);
    const monthIncome = records
      .filter(r => isThisMonth(r.createdAt))
      .reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0);
    return { todayIncome, monthIncome };
  }, [records]);

  // --- 4. RENDER ---
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white text-center">Admin Login</h2>
          
          {authError && (
            <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm">
              {authError}
            </div>
          )}
  
          <form onSubmit={handleEmailAuth} className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <input 
                type="email" 
                required
                placeholder="test@example.com" 
                value={authEmail} 
                onChange={(e) => setAuthEmail(e.target.value)}
                disabled={authLoading}
                className={`${inputClass} disabled:opacity-50`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                value={authPassword} 
                onChange={(e) => setAuthPassword(e.target.value)}
                disabled={authLoading}
                className={`${inputClass} disabled:opacity-50`}
              />
            </div>
            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-blue-600 p-3 text-white rounded-lg font-semibold hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
  
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-400">or</span>
            </div>
          </div>
  
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={authLoading}
            className="w-full mt-4 bg-white text-slate-900 p-3 rounded-lg font-semibold hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {authLoading ? "Loading..." : "Continue with Google"}
          </button>
  
          <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs font-semibold text-slate-300 mb-2">Demo Credentials:</p>
            <p className="text-xs text-slate-400">Email: <code className="text-slate-300">test@example.com</code></p>
            <p className="text-xs text-slate-400">Password: <code className="text-slate-300">Test123!@#</code></p>
          </div>
        </div>
      </div>
    );
  }

  if (!hydrated) return null;

  return (
    <div className={`${pageBg} print:bg-white`}>
      <header className={`${headerClass} print:hidden`}>
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-14 w-14 overflow-hidden shrink-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={52}
                  height={52}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <h1 className={`${headingLg} sm:text-xl`}>Akshitha Consultancy</h1>
                <p className={textSubtle}>
                  Proprietor: Ramesh Aithagoni | Client records, payments &amp; delivery tracking
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <span className="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 sm:inline">
                {records.length} records
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 shadow-sm hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-rose-950/30 transition"
              >
                Logout Account
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAVIGATION_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${transitionTheme} ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : tabInactive
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 print:p-0">
        {/* ── DASHBOARD TAB CONTENT ── */}
        {activeTab === "dashboard" && (
          <>
            <UpcomingSlotBanner alerts={upcomingAlerts} />

            <div className={`rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-5 shadow-sm dark:border-amber-700 dark:from-amber-950/80 dark:via-slate-900 dark:to-amber-950/60 sm:p-6 ${transitionTheme} print:hidden`}>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Total Market Outstanding Due (₹)
              </p>
              <p className="mt-2 text-3xl font-extrabold text-amber-900 dark:text-amber-100 sm:text-4xl">
                {formatCurrency(stats.totalDue)}
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/80">
                Pending collection across all active client entries inside system registers
              </p>
            </div>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
              <StatCard label="Today Clients" value={stats.todayClients} accent="text-indigo-600" sub="Registered / slots today" />
              <StatCard label="Today Pending Slots" value={stats.todayPendingSlots} accent="text-rose-500" sub="Active bookings today" />
              <StatCard label="Total Pending Slots" value={stats.totalPendingSlots} accent="text-amber-500" sub="Awaiting dynamic processing" />
              <StatCard label="Delivered Works" value={records.filter((r) => r.status === "delivered").length} accent="text-emerald-600" sub="Fully closed records" />
            </section>

            <section className={`${cardClass} p-5 sm:p-6 print:hidden`}>
              <h2 className={headingBase}>New Client Registration</h2>
              <p className={`mt-1 ${textMuted}`}>
                Select a service type below to display its tailored data fields dynamically.
              </p>

              <form ref={formRef} onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>Client Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      onKeyDown={handleFormFieldKeyDown}
                      className={inputClass}
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Phone Number *</label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      onKeyDown={handleFormFieldKeyDown}
                      className={inputClass}
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Service Type</label>
                    <select
                      value={form.serviceType}
                      onChange={(e) => updateField("serviceType", e.target.value as any)}
                      onKeyDown={handleFormFieldKeyDown}
                      className={inputClass}
                    >
                      {SERVICE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      value={form.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      onKeyDown={handleFormFieldKeyDown}
                      className={inputClass}
                      placeholder="Village / town / district"
                    />
                  </div>

                  {isMarriageSelected ? (
                    <>
                      <div>
                        <label className={labelClass}>Groom Full Name</label>
                        <input
                          value={form.buyerName}
                          onChange={(e) => updateField("buyerName", e.target.value)}
                          onKeyDown={handleFormFieldKeyDown}
                          className={inputClass}
                          placeholder="Groom's Name"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Bride Full Name</label>
                        <input
                          value={form.sellerName}
                          onChange={(e) => updateField("sellerName", e.target.value)}
                          onKeyDown={handleFormFieldKeyDown}
                          className={inputClass}
                          placeholder="Bride's Name"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Date of Marriage</label>
                        <input
                          type="date"
                          value={form.landSize}
                          onChange={(e) => updateField("landSize", e.target.value)}
                          onKeyDown={handleFormFieldKeyDown}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Witness 1 (Name &amp; Phone)</label>
                        <input
                          value={form.surveyPlotNumber}
                          onChange={(e) => updateField("surveyPlotNumber", e.target.value)}
                          onKeyDown={handleFormFieldKeyDown}
                          className={inputClass}
                          placeholder="e.g. Anand Kumar - 98480..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={labelClass}>Land Size</label>
                        <input
                          value={form.landSize}
                          onChange={(e) => updateField("landSize", e.target.value)}
                          onKeyDown={handleFormFieldKeyDown}
                          className={inputClass}
                          placeholder="e.g. 2 acres, 240 sq.yd"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Survey / Plot Number</label>
                        <input
                          value={form.surveyPlotNumber}
                          onChange={(e) => updateField("surveyPlotNumber", e.target.value)}
                          onKeyDown={handleFormFieldKeyDown}
                          className={inputClass}
                          placeholder="SY-1234 / Plot 45"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Buyer Name</label>
                        <input
                          value={form.buyerName}
                          onChange={(e) => updateField("buyerName", e.target.value)}
                          onKeyDown={handleFormFieldKeyDown}
                          className={inputClass}
                          placeholder="Buyer full name"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Seller Name</label>
                        <input
                          value={form.sellerName}
                          onChange={(e) => updateField("sellerName", e.target.value)}
                          onKeyDown={handleFormFieldKeyDown}
                          className={inputClass}
                          placeholder="Seller full name"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className={labelClass}>Booked Slot Date / Time</label>
                    <input
                      type="datetime-local"
                      value={form.bookedSlotDateTime}
                      onChange={(e) => updateField("bookedSlotDateTime", e.target.value)}
                      onKeyDown={handleFormFieldKeyDown}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className={panelMuted}>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Payments</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Total Fee Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.totalFee}
                        onChange={(e) => updateField("totalFee", e.target.value)}
                        onKeyDown={handleFormFieldKeyDown}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Amount Paid (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.amountPaid}
                        onChange={(e) => updateField("amountPaid", e.target.value)}
                        onKeyDown={handleFormFieldKeyDown}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Amount Due</label>
                      <div className={`flex h-[42px] items-center rounded-xl border px-3.5 text-sm font-bold ${transitionTheme} ${
                        formAmountDue > 0
                          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      }`}>
                        {formatCurrency(formAmountDue)}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 sm:w-auto"
                >
                  Save Client Record
                </button>
              </form>
            </section>
          </>
        )}

        {/* ── ALL RECORDS TAB CONTENT ── */}
        {activeTab === "records" && (
          <section className={`${cardClass} print:border-none print:shadow-none`}>
            <div className={`${cardHeaderBorder} p-4 sm:p-5 print:hidden`}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className={headingBase}>All Records</h2>
                    <p className={textMuted}>Searchable database filter sub-pipelines</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => printRecordsTable(filteredRecords)}
                    className={`inline-flex items-center justify-center gap-2 ${btnSecondary}`}
                  >
                    📥 Export / Print Table
                  </button>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-t pt-3 border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
                    {(["all", "today_slots", "total_pending", "delivered"] as const).map((filterOpt) => {
                      const labels: Record<string, string> = {
                        all: "All Records",
                        today_slots: "Today's Slots",
                        total_pending: "Total Pending",
                        delivered: "Delivered Slots",
                      };
                      return (
                        <button
                          key={filterOpt}
                          type="button"
                          onClick={() => setRecordFilter(filterOpt)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${transitionTheme} ${
                            recordFilter === filterOpt
                              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          {labels[filterOpt]}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search customer records..."
                    className={`${inputClass} sm:max-w-xs`}
                  />
                </div>
              </div>
            </div>

            <div className="hidden print:block mb-6 text-center border-b pb-4 border-slate-300">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
                Akshitha Consultancy Ledger
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Full Active Registry Sheet — Printed on {new Date().toLocaleDateString()}
              </p>
            </div>
            <RecordsTable
              records={filteredRecords}
              onMarkDelivered={handleMarkDelivered}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </section>
        )}

        {/* ── TIME PERIODS TAB CONTENT ── */}
        {activeTab === "period" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 print:hidden">
              <StatCard label="Today" value={todayRecords.length} sub="New records" accent="text-indigo-600" />
              <StatCard label="This Month" value={monthRecords.length} sub="New records" accent="text-violet-600" />
              <StatCard label="Slots Today" value={todaySlots.length} sub="Booked slots" accent="text-sky-600" />
              <StatCard label="Slots This Month" value={monthSlots.length} sub="Booked slots" accent="text-teal-600" />
            </div>

            <PeriodSection title="Today's Records" records={todayRecords} onMarkDelivered={handleMarkDelivered} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="No records added today." />
            <PeriodSection title="This Month's Records" records={monthRecords} onMarkDelivered={handleMarkDelivered} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="No records added this month." />
            <PeriodSection title="Today's Booked Slots" records={todaySlots} onMarkDelivered={handleMarkDelivered} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="No slots booked for today." />
            <PeriodSection title="This Month's Booked Slots" records={monthSlots} onMarkDelivered={handleMarkDelivered} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="No slots booked this month." />
          </div>
        )}

        {/* ── DATE RANGE REPORTS TAB CONTENT ── */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <section className={`${cardClass} p-5 sm:p-6 print:border-none print:shadow-none print:p-0`}>
              <h2 className={`${headingBase} print:hidden`}>Date Range Reports</h2>

              <div className="hidden print:block mb-6 text-center border-b pb-4 border-slate-300">
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
                  Akshitha Consultancy — Financial Range Report
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Statements from <strong>{reportStart || "—"}</strong> to <strong>{reportEnd || "—"}</strong>
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 print:flex print:flex-col">
                <div className="space-y-4 print:w-full">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:hidden">
                    <div>
                      <label className={labelClass}>Start Date</label>
                      <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>End Date</label>
                      <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/50 print:bg-white print:border-slate-300">
                    <p className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-300 print:text-slate-700">Total Clients in Range</p>
                    <p className="mt-1 text-3xl font-bold text-indigo-700 dark:text-indigo-200 print:text-slate-900">
                      {reportStart && reportEnd ? reportRecords.length : "—"}
                    </p>
                  </div>
                </div>

                {reportStart && reportEnd ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 print:grid-cols-3 print:w-full">
                    <FinancialStat label="Total Revenue Booked" value={formatCurrency(reportFinancials.revenueBooked)} accent="text-indigo-700 print:text-slate-900" bg="bg-indigo-50" />
                    <FinancialStat label="Total Income Collected" value={formatCurrency(reportFinancials.incomeCollected)} accent="text-emerald-700 print:text-slate-900" bg="bg-emerald-50" />
                    <FinancialStat label="Total Outstanding Due" value={formatCurrency(reportFinancials.outstandingDue)} accent="text-amber-700 print:text-slate-900" bg="bg-amber-50" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 print:hidden">
                    Select start and end dates to view financial summary
                  </div>
                )}
              </div>

              {reportStart && reportEnd && (
                <div className="mt-6 hidden print:block">
                  <RecordsTable
                    records={reportRecords}
                    onMarkDelivered={handleMarkDelivered}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── FINANCE TAB SECTION ── */}
        {activeTab === "finance" && (
          <div className="space-y-6 print:hidden">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className={`${cardClass} p-5 border-l-4 border-l-indigo-500`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${textSubtle}`}>Today&apos;s Income</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-800 dark:text-slate-100">{formatCurrency(financeMetrics.todayIncome)}</p>
                <p className="text-xs text-slate-400 mt-1">Payments recorded today</p>
              </div>
              <div className={`${cardClass} p-5 border-l-4 border-l-emerald-500`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${textSubtle}`}>This Month&apos;s Income</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(financeMetrics.monthIncome)}</p>
                <p className="text-xs text-slate-400 mt-1">Calendar month aggregation</p>
              </div>
              <div className={`${cardClass} p-5 border-l-4 border-l-amber-500`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${textSubtle}`}>Total Pending Money</p>
                <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">{formatCurrency(stats.totalDue)}</p>
                <p className="text-xs text-slate-400 mt-1">Outstanding receivables</p>
              </div>
            </div>

            <MoneyVsMonthsChart
              records={records}
              currentIncome={financeMetrics.monthIncome}
              currentPending={stats.totalDue}
            />
          </div>
        )}
      </main>

      {/* Modals & Dialog Portals */}
      {deliverTarget && (
        <DeliveredModal
          record={deliverTarget}
          onConfirm={handleDeliverConfirm}
          onCancel={handleDeliverCancel}
        />
      )}

      {editTarget && (
        <EditClientModal
          record={editTarget}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}