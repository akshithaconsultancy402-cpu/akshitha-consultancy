"use client";

import { formatCurrency } from "@/src/lib/utils";
import { modalOverlay, modalPanel, transitionTheme } from "@/src/lib/ui-classes";
// Import your record type definition
import { ClientRecord } from "../lib/types"; 

interface DeliveredModalProps {
  record: ClientRecord; // Fixes: Property 'record' does not exist error
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeliveredModal({
  record,
  onConfirm,
  onCancel,
}: DeliveredModalProps) {
  // Extract your data and safely calculate the pending balance inline
  const clientName = record?.name || "Client";
  const total = Number(record?.totalFee) || 0;
  const paid = Number(record?.amountPaid) || 0;
  const amountDue = Math.max(0, total - paid);

  return (
    <div className={modalOverlay}>
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-md p-6 ${modalPanel}`}
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Pending balance detected
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {clientName}
          </span>{" "}
          has a pending balance of{" "}
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            {formatCurrency(amountDue)}
          </span>
          . Is the due amount paid now?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 ${transitionTheme}`}
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Yes, paid now
          </button>
        </div>
      </div>
    </div>
  );
}