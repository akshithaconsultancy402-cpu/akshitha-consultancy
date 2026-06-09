import type { ClientRecord } from "./types";
import { SERVICE_LABELS } from "./types";

export function getAmountDue(record: Pick<ClientRecord, "totalFee" | "amountPaid">) {
  return Math.max(0, record.totalFee - record.amountPaid);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocalDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayLocalKey() {
  return getLocalDateKey(new Date());
}

/** Calendar date key (YYYY-MM-DD) in local timezone — ignores UTC offset drift. */
export function toDateKey(dateStr: string) {
  if (!dateStr) return "";
  const dateOnly = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateStr.length === 10 && dateOnly) return dateOnly[1];
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) return getLocalDateKey(parsed);
  return dateOnly?.[1] ?? "";
}

export function isToday(dateStr: string) {
  if (!dateStr) return false;
  return toDateKey(dateStr) === getTodayLocalKey();
}

export function isThisMonth(dateStr: string) {
  if (!dateStr) return false;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  return (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth()
  );
}

export function isInDateRange(dateStr: string, start: string, end: string) {
  if (!dateStr || !start || !end) return false;
  const key = toDateKey(dateStr);
  return key >= start && key <= end;
}

export function toDatetimeLocalValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatSlotTime(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function buildWhatsAppUrl(record: ClientRecord) {
  const phone = record.phone.replace(/\D/g, "");
  const service = SERVICE_LABELS[record.serviceType];

  if (record.status === "delivered") {
    const message = `Thank you for choosing Akshitha Consultancy, ${record.name}! Your ${service} documentation has been successfully processed and delivered. We appreciate your business. Regards, Ramesh Aithagoni.`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
  }

  const due = getAmountDue(record);
  const message =
    due > 0
      ? `Hello ${record.name}, reminder for your ${service} service. Pending balance: ${formatCurrency(due)}. Please contact us.`
      : `Hello ${record.name}, reminder regarding your ${service} service. Please contact us if you have any questions.`;
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

export function buildOneHourReminderUrl(record: ClientRecord) {
  const phone = record.phone.replace(/\D/g, "");
  const due = getAmountDue(record);
  const service = SERVICE_LABELS[record.serviceType];
  const slotTime = formatSlotTime(record.bookedSlotDateTime);

  let message = `Hello ${record.name}, this is a reminder from Akshitha Consultancy regarding your ${service} booking scheduled today at ${slotTime}. Please arrive 15 minutes early with all required documents.`;

  if (due > 0) {
    message += ` Note: A pending balance of ${formatCurrency(due)} is required to be cleared for document delivery.`;
  }

  message += " See you soon!";

  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

export function getReportFinancials(records: ClientRecord[]) {
  return {
    revenueBooked: records.reduce((s, r) => s + r.totalFee, 0),
    incomeCollected: records.reduce((s, r) => s + r.amountPaid, 0),
    outstandingDue: records.reduce((s, r) => s + getAmountDue(r), 0),
  };
}

export function getTotalMarketOutstanding(records: ClientRecord[]) {
  return records.reduce((s, r) => s + getAmountDue(r), 0);
}

/** Slot is today and starts within the next `hours` (local time). */
export function isUpcomingWithinHours(
  bookedSlotDateTime: string,
  hours = 2,
) {
  if (!bookedSlotDateTime || !isToday(bookedSlotDateTime)) return false;
  const slot = new Date(bookedSlotDateTime);
  if (Number.isNaN(slot.getTime())) return false;
  const now = Date.now();
  const diffMs = slot.getTime() - now;
  return diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000;
}

export function getUpcomingSlotAlerts(
  records: ClientRecord[],
  hours = 2,
) {
  return records
    .filter(
      (r) =>
        r.status !== "delivered" &&
        isUpcomingWithinHours(r.bookedSlotDateTime, hours),
    )
    .sort(
      (a, b) =>
        new Date(a.bookedSlotDateTime).getTime() -
        new Date(b.bookedSlotDateTime).getTime(),
    );
}

export function printRecordsTable(records: ClientRecord[]) {
  const generated = new Date().toLocaleString("en-IN");
  const rows = records
    .map((r) => {
      const due = getAmountDue(r);
      return `<tr>
        <td>${escapeHtml(r.name)}<br/><small>${escapeHtml(r.phone)}</small></td>
        <td>${escapeHtml(SERVICE_LABELS[r.serviceType])}</td>
        <td>${escapeHtml(r.location || "—")}</td>
        <td>${escapeHtml(formatDateTime(r.bookedSlotDateTime))}</td>
        <td>${formatCurrency(r.totalFee)}</td>
        <td>${formatCurrency(r.amountPaid)}</td>
        <td>${formatCurrency(due)}</td>
        <td>${r.status === "delivered" ? "Delivered" : "Active"}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Akshitha Consultancy — Client Records</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
    h1 { font-size: 1.25rem; margin: 0 0 4px; }
    p { margin: 0 0 16px; color: #64748b; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Akshitha Consultancy — All Client Records</h1>
  <p>Proprietor: Ramesh Aithagoni · Generated ${escapeHtml(generated)} · ${records.length} record(s)</p>
  <table>
    <thead>
      <tr>
        <th>Client</th>
        <th>Service</th>
        <th>Location</th>
        <th>Slot</th>
        <th>Total Fee</th>
        <th>Paid</th>
        <th>Due</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="8">No records</td></tr>'}</tbody>
  </table>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function searchRecords(records: ClientRecord[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return records;
  return records.filter((r) => {
    const haystack = [
      r.name,
      r.phone,
      SERVICE_LABELS[r.serviceType],
      r.location,
      r.landSize,
      r.surveyPlotNumber,
      r.buyerName,
      r.sellerName,
      r.status,
      formatCurrency(r.totalFee),
      formatCurrency(r.amountPaid),
      formatCurrency(getAmountDue(r)),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function createSeedRecords(): ClientRecord[] {
  const today = new Date();
  const todayIso = today.toISOString();
  const todaySlot = new Date(today);
  todaySlot.setHours(11, 0, 0, 0);

  return [
    {
      id: "seed-1",
      name: "Ramesh Kumar",
      phone: "9876543210",
      serviceType: "land",
      location: "Vijayawada",
      landSize: "2.5 acres",
      surveyPlotNumber: "SY-4421",
      buyerName: "Ramesh Kumar",
      sellerName: "Venkat Rao",
      bookedSlotDateTime: todaySlot.toISOString(),
      totalFee: 45000,
      amountPaid: 20000,
      status: "active",
      createdAt: todayIso,
    },
    {
      id: "seed-2",
      name: "Priya Sharma",
      phone: "9123456780",
      serviceType: "marriage",
      location: "Guntur",
      landSize: "",
      surveyPlotNumber: "",
      buyerName: "",
      sellerName: "",
      bookedSlotDateTime: "",
      totalFee: 15000,
      amountPaid: 15000,
      status: "delivered",
      createdAt: todayIso,
    },
    {
      id: "seed-3",
      name: "Suresh Babu",
      phone: "9988776655",
      serviceType: "slot",
      location: "Tenali",
      landSize: "",
      surveyPlotNumber: "",
      buyerName: "Suresh Babu",
      sellerName: "",
      bookedSlotDateTime: todaySlot.toISOString(),
      totalFee: 8000,
      amountPaid: 3000,
      status: "active",
      createdAt: todayIso,
    },
  ];
}
