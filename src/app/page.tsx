"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeliveredModal } from "@/src/components/DeliveredModal";
import { EditClientModal } from "@/src/components/EditClientModal";
import { RecordsTable } from "@/src/components/RecordsTable";
import { ThemeToggle } from "@/src/components/ThemeToggle";
import { UpcomingSlotBanner } from "@/src/components/UpcomingSlotBanner";
import {
  badgeClass,
  btnSecondary,
  cardClass,
  cardHeaderBorder,
  headingBase,
  headingLg,
  inputClass,
  labelClass,
  pageBg,
  panelMuted,
  headerClass,
  tabInactive,
  textMuted,
  textSubtle,
  transitionTheme,
} from "@/src/lib/ui-classes";
import {
  emptyForm,
  SERVICE_OPTIONS,
  STORAGE_KEY,
  TABS,
  type ClientRecord,
  type TabId,
} from "@/src/lib/types";
import {
  createSeedRecords,
  formatCurrency,
  formatDate,
  getAmountDue,
  getReportFinancials,
  getUpcomingSlotAlerts,
  isInDateRange,
  isThisMonth,
  isToday,
  printRecordsTable,
  searchRecords,
} from "@/src/lib/utils";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className={`${cardClass} p-5`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${textSubtle}`}>
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className={`mt-1 text-xs text-slate-400 dark:text-slate-500`}>{sub}</p>}
    </div>
  );
}

export default function App() {
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [search, setSearch] = useState("");
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [deliverTarget, setDeliverTarget] = useState<ClientRecord | null>(null);
  const [editTarget, setEditTarget] = useState<ClientRecord | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecords(JSON.parse(stored) as ClientRecord[]);
      } catch {
        setRecords(createSeedRecords());
      }
    } else {
      setRecords(createSeedRecords());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  }, [records, hydrated]);

  const formAmountDue = useMemo(() => {
    const total = parseFloat(form.totalFee) || 0;
    const paid = parseFloat(form.amountPaid) || 0;
    return Math.max(0, total - paid);
  }, [form.totalFee, form.amountPaid]);

  const stats = useMemo(() => {
    const pending = records.filter((r) => getAmountDue(r) > 0).length;
    const slotsToday = records.filter((r) =>
      isToday(r.bookedSlotDateTime),
    ).length;
    const totalDue = records.reduce((sum, r) => sum + getAmountDue(r), 0);
    return { total: records.length, slotsToday, pending, totalDue };
  }, [records]);

  const filteredRecords = useMemo(
    () => searchRecords(records, search),
    [records, search],
  );

  const todayRecords = useMemo(
    () => records.filter((r) => isToday(r.createdAt)),
    [records],
  );
  const monthRecords = useMemo(
    () => records.filter((r) => isThisMonth(r.createdAt)),
    [records],
  );
  const todaySlots = useMemo(
    () => records.filter((r) => isToday(r.bookedSlotDateTime)),
    [records],
  );
  const monthSlots = useMemo(
    () => records.filter((r) => isThisMonth(r.bookedSlotDateTime)),
    [records],
  );

  const reportRecords = useMemo(() => {
    if (!reportStart || !reportEnd) return [];
    return records.filter((r) =>
      isInDateRange(r.createdAt, reportStart, reportEnd),
    );
  }, [records, reportStart, reportEnd]);

  const reportFinancials = useMemo(
    () => getReportFinancials(reportRecords),
    [reportRecords],
  );

  const upcomingAlerts = useMemo(
    () => getUpcomingSlotAlerts(records, 2),
    [records, now],
  );

  const updateField = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    const totalFee = parseFloat(form.totalFee) || 0;
    const amountPaid = parseFloat(form.amountPaid) || 0;

    const record: ClientRecord = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      serviceType: form.serviceType,
      location: form.location.trim(),
      landSize: form.landSize.trim(),
      surveyPlotNumber: form.surveyPlotNumber.trim(),
      buyerName: form.buyerName.trim(),
      sellerName: form.sellerName.trim(),
      bookedSlotDateTime: form.bookedSlotDateTime
        ? new Date(form.bookedSlotDateTime).toISOString()
        : "",
      totalFee,
      amountPaid: Math.min(amountPaid, totalFee),
      status: "active",
      createdAt: new Date().toISOString(),
    };

    setRecords((prev) => [record, ...prev]);
    setForm({ ...emptyForm, serviceType: form.serviceType });
  };

  const markDelivered = (id: string, settlePayment: boolean) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          status: "delivered" as const,
          amountPaid: settlePayment ? r.totalFee : r.amountPaid,
        };
      }),
    );
  };

  const handleMarkDelivered = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record || record.status === "delivered") return;

    const due = getAmountDue(record);
    if (due > 0) {
      setDeliverTarget(record);
      return;
    }
    markDelivered(id, false);
  };

  const handleDeliverConfirm = () => {
    if (!deliverTarget) return;
    markDelivered(deliverTarget.id, true);
    setDeliverTarget(null);
  };

  const handleDeliverCancel = () => {
    alert(
      "Cannot mark as Delivered. Please clear the due amount first!",
    );
    setDeliverTarget(null);
  };

  const handleEdit = (record: ClientRecord) => {
    setEditTarget(record);
  };

  const handleSaveEdit = (updated: ClientRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r)),
    );
    setEditTarget(null);
  };

  const handleDelete = (record: ClientRecord) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${record.name}'s record? This cannot be undone.`,
    );
    if (confirmed) {
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      if (editTarget?.id === record.id) setEditTarget(null);
      if (deliverTarget?.id === record.id) setDeliverTarget(null);
    }
  };

  const focusNextFormField = (current: HTMLElement) => {
    const form = formRef.current;
    if (!form) return;

    const inputs = Array.from(
      form.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not([readonly]), select',
      ),
    );

    if (current.tagName === "BUTTON") {
      form.requestSubmit();
      return;
    }

    const index = inputs.indexOf(current);
    if (index >= 0 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    } else {
      form.requestSubmit();
    }
  };

  const handleFormFieldKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    focusNextFormField(e.currentTarget);
  };

  if (!hydrated) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${pageBg}`}>
        <p className={textMuted}>Loading register…</p>
      </div>
    );
  }

  return (
    <div className={pageBg}>
      <header className={headerClass}>
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className={`${headingLg} sm:text-xl`}>Akshitha Consultancy</h1>
              <p className={textSubtle}>
                Proprietor: Ramesh Aithagoni | Client records, payments &amp;
                delivery tracking
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <span className="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 sm:inline">
                {records.length} records
              </span>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => (
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

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <>
            <UpcomingSlotBanner alerts={upcomingAlerts} />

            <div className={`rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-5 shadow-sm dark:border-amber-700 dark:from-amber-950/80 dark:via-slate-900 dark:to-amber-950/60 sm:p-6 ${transitionTheme}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Total Market Outstanding Due (₹)
              </p>
              <p className="mt-2 text-3xl font-extrabold text-amber-900 dark:text-amber-100 sm:text-4xl">
                {formatCurrency(stats.totalDue)}
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/80">
                Pending collection across all {stats.total} clients in the
                database
              </p>
            </div>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Clients"
                value={stats.total}
                accent="text-indigo-600"
              />
              <StatCard
                label="Slots Booked Today"
                value={stats.slotsToday}
                accent="text-violet-600"
              />
              <StatCard
                label="Pending Payments"
                value={stats.pending}
                sub={`${stats.pending} client(s) with balance`}
                accent="text-amber-600"
              />
              <StatCard
                label="Delivered"
                value={records.filter((r) => r.status === "delivered").length}
                accent="text-emerald-600"
              />
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className={headingBase}>New Client Registration</h2>
              <p className={`mt-1 ${textMuted}`}>
                Fill in client and service details. Amount due is calculated
                automatically.
              </p>

              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="mt-5 space-y-5"
              >
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
                      onChange={(e) =>
                        updateField(
                          "serviceType",
                          e.target.value as typeof form.serviceType,
                        )
                      }
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
                      onChange={(e) =>
                        updateField("surveyPlotNumber", e.target.value)
                      }
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
                      onChange={(e) =>
                        updateField("sellerName", e.target.value)
                      }
                      onKeyDown={handleFormFieldKeyDown}
                      className={inputClass}
                      placeholder="Seller full name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Booked Slot Date / Time
                    </label>
                    <input
                      type="datetime-local"
                      value={form.bookedSlotDateTime}
                      onChange={(e) =>
                        updateField("bookedSlotDateTime", e.target.value)
                      }
                      onKeyDown={handleFormFieldKeyDown}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className={panelMuted}>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Payments
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Total Fee Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.totalFee}
                        onChange={(e) =>
                          updateField("totalFee", e.target.value)
                        }
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
                        step="1"
                        value={form.amountPaid}
                        onChange={(e) =>
                          updateField("amountPaid", e.target.value)
                        }
                        onKeyDown={handleFormFieldKeyDown}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Amount Due</label>
                      <div
                        className={`flex h-[42px] items-center rounded-xl border px-3.5 text-sm font-bold ${transitionTheme} ${
                          formAmountDue > 0
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        }`}
                      >
                        {formatCurrency(formAmountDue)}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  onKeyDown={handleFormFieldKeyDown}
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 sm:w-auto"
                >
                  Save Client Record
                </button>
              </form>
            </section>
          </>
        )}

        {/* ── ALL RECORDS ── */}
        {activeTab === "records" && (
          <section className={cardClass}>
            <div className={`${cardHeaderBorder} p-4 sm:p-5`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={headingBase}>All Records</h2>
                  <p className={textMuted}>Searchable customer database</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => printRecordsTable(filteredRecords)}
                    className={`inline-flex items-center justify-center gap-2 ${btnSecondary}`}
                  >
                    📥 Export / Print Table
                  </button>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone, plot, location…"
                    className={`${inputClass} sm:max-w-sm`}
                  />
                </div>
              </div>
            </div>
            <RecordsTable
              records={filteredRecords}
              onMarkDelivered={handleMarkDelivered}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </section>
        )}

        {/* ── TODAY & THIS MONTH ── */}
        {activeTab === "period" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Today"
                value={todayRecords.length}
                sub="New records"
                accent="text-indigo-600"
              />
              <StatCard
                label="This Month"
                value={monthRecords.length}
                sub="New records"
                accent="text-violet-600"
              />
              <StatCard
                label="Slots Today"
                value={todaySlots.length}
                sub="Booked slots"
                accent="text-sky-600"
              />
              <StatCard
                label="Slots This Month"
                value={monthSlots.length}
                sub="Booked slots"
                accent="text-teal-600"
              />
            </div>

            <PeriodSection
              title="Today's Records"
              records={todayRecords}
              onMarkDelivered={handleMarkDelivered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No records added today."
            />
            <PeriodSection
              title="This Month's Records"
              records={monthRecords}
              onMarkDelivered={handleMarkDelivered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No records added this month."
            />
            <PeriodSection
              title="Today's Booked Slots"
              records={todaySlots}
              onMarkDelivered={handleMarkDelivered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No slots booked for today."
            />
            <PeriodSection
              title="This Month's Booked Slots"
              records={monthSlots}
              onMarkDelivered={handleMarkDelivered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No slots booked this month."
            />
          </div>
        )}

        {/* ── DATE RANGE REPORTS ── */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className={headingBase}>Date Range Reports</h2>
              <p className={`mt-1 ${textMuted}`}>
                Select a period to view total clients registered in that range.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Start Date</label>
                      <input
                        type="date"
                        value={reportStart}
                        onChange={(e) => setReportStart(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>End Date</label>
                      <input
                        type="date"
                        value={reportEnd}
                        onChange={(e) => setReportEnd(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/50">
                    <p className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-300">
                      Total Clients in Range
                    </p>
                    <p className="mt-1 text-3xl font-bold text-indigo-700 dark:text-indigo-200">
                      {reportStart && reportEnd ? reportRecords.length : "—"}
                    </p>
                    {reportStart && reportEnd && (
                      <p className="mt-1 text-xs text-indigo-500 dark:text-indigo-400">
                        {formatDate(reportStart)} – {formatDate(reportEnd)}
                      </p>
                    )}
                  </div>
                </div>

                {reportStart && reportEnd ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FinancialStat
                      label="Total Revenue Booked (₹)"
                      value={formatCurrency(reportFinancials.revenueBooked)}
                      accent="text-indigo-700 dark:text-indigo-300"
                      bg="bg-indigo-50 border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800"
                    />
                    <FinancialStat
                      label="Total Income Collected (₹)"
                      value={formatCurrency(reportFinancials.incomeCollected)}
                      accent="text-emerald-700 dark:text-emerald-300"
                      bg="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800"
                    />
                    <FinancialStat
                      label="Total Outstanding Due (₹)"
                      value={formatCurrency(reportFinancials.outstandingDue)}
                      accent="text-amber-700 dark:text-amber-300"
                      bg="bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800"
                    />
                  </div>
                ) : (
                  <div className={`flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400`}>
                    Select start and end dates to view financial summary
                  </div>
                )}
              </div>
            </section>

            {reportStart && reportEnd && (
              <section className={cardClass}>
                <div className={`${cardHeaderBorder} p-4 sm:p-5`}>
                  <h3 className={`font-bold text-slate-900 dark:text-slate-100`}>
                    Clients in Selected Range
                  </h3>
                </div>
                <RecordsTable
                  records={reportRecords}
                  onMarkDelivered={handleMarkDelivered}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  emptyMessage="No clients found in this date range."
                />
              </section>
            )}
          </div>
        )}
      </main>

      {deliverTarget && (
        <DeliveredModal
          clientName={deliverTarget.name}
          amountDue={getAmountDue(deliverTarget)}
          onConfirm={handleDeliverConfirm}
          onCancel={handleDeliverCancel}
        />
      )}

      {editTarget && (
        <EditClientModal
          record={editTarget}
          onSave={handleSaveEdit}
          onCancel={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

function PeriodSection({
  title,
  records,
  onMarkDelivered,
  onEdit,
  onDelete,
  emptyMessage,
}: {
  title: string;
  records: ClientRecord[];
  onMarkDelivered: (id: string) => void;
  onEdit: (record: ClientRecord) => void;
  onDelete: (record: ClientRecord) => void;
  emptyMessage: string;
}) {
  return (
    <section className={cardClass}>
      <div className={`flex items-center justify-between ${cardHeaderBorder} px-4 py-3 sm:px-5`}>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <span className={badgeClass}>
          {records.length}
        </span>
      </div>
      <RecordsTable
        records={records}
        onMarkDelivered={onMarkDelivered}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage={emptyMessage}
      />
    </section>
  );
}

function FinancialStat({
  label,
  value,
  accent,
  bg,
}: {
  label: string;
  value: string;
  accent: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${transitionTheme} ${bg}`}>
      <p className="text-xs font-semibold leading-snug text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-xl font-bold sm:text-2xl ${accent}`}>{value}</p>
    </div>
  );
}
