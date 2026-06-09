"use client";

import type { ClientRecord } from "@/src/lib/types";
import { SERVICE_LABELS } from "@/src/lib/types";
import { RecordActions } from "@/src/components/RecordActions";
import {
  tableDivide,
  tableHead,
  tableRowHover,
  textMuted,
} from "@/src/lib/ui-classes";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getAmountDue,
} from "@/src/lib/utils";

interface RecordsTableProps {
  records: ClientRecord[];
  onMarkDelivered: (id: string) => void;
  onEdit: (record: ClientRecord) => void;
  onDelete: (record: ClientRecord) => void;
  emptyMessage?: string;
}

function StatusBadge({ status }: { status: ClientRecord["status"] }) {
  const styles =
    status === "delivered"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-700/30"
      : "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-700/30";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${styles}`}
    >
      {status === "delivered" ? "Delivered" : "Active"}
    </span>
  );
}

export function RecordsTable({
  records,
  onMarkDelivered,
  onEdit,
  onDelete,
  emptyMessage = "No records found.",
}: RecordsTableProps) {
  if (records.length === 0) {
    return (
      <p className={`px-4 py-12 text-center text-sm ${textMuted}`}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className={tableHead}>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Location / Plot</th>
              <th className="px-4 py-3">Buyer / Seller</th>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Fees</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={tableDivide}>
            {records.map((record) => {
              const due = getAmountDue(record);
              return (
                <tr key={record.id} className={tableRowHover}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {record.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {record.phone}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      Added {formatDate(record.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {SERVICE_LABELS[record.serviceType]}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <p>{record.location || "—"}</p>
                    {record.landSize && (
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {record.landSize}
                        {record.surveyPlotNumber
                          ? ` · ${record.surveyPlotNumber}`
                          : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <p>{record.buyerName || "—"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {record.sellerName || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {formatDateTime(record.bookedSlotDateTime)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700 dark:text-slate-200">
                      {formatCurrency(record.totalFee)}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Paid {formatCurrency(record.amountPaid)}
                    </p>
                    <p
                      className={`text-xs font-medium ${due > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}
                    >
                      Due {formatCurrency(due)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="max-w-[240px] px-4 py-3">
                    <RecordActions
                      record={record}
                      onMarkDelivered={onMarkDelivered}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={`lg:hidden ${tableDivide}`}>
        {records.map((record) => {
          const due = getAmountDue(record);
          return (
            <article key={record.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {record.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {record.phone}
                  </p>
                </div>
                <StatusBadge status={record.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Service:
                  </span>{" "}
                  {SERVICE_LABELS[record.serviceType]}
                </p>
                <p>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Location:
                  </span>{" "}
                  {record.location || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Plot:
                  </span>{" "}
                  {record.surveyPlotNumber || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Slot:
                  </span>{" "}
                  {formatDateTime(record.bookedSlotDateTime)}
                </p>
                <p className="col-span-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Fees:
                  </span>{" "}
                  {formatCurrency(record.totalFee)} · Paid{" "}
                  {formatCurrency(record.amountPaid)} ·{" "}
                  <span
                    className={
                      due > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : ""
                    }
                  >
                    Due {formatCurrency(due)}
                  </span>
                </p>
              </div>
              <RecordActions
                record={record}
                onMarkDelivered={onMarkDelivered}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </article>
          );
        })}
      </div>
    </>
  );
}
