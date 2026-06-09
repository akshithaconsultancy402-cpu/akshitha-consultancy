"use client";

import type { ClientRecord } from "@/src/lib/types";
import {
  buildOneHourReminderUrl,
  buildWhatsAppUrl,
  isToday,
} from "@/src/lib/utils";

interface RecordActionsProps {
  record: ClientRecord;
  onMarkDelivered: (id: string) => void;
  onEdit: (record: ClientRecord) => void;
  onDelete: (record: ClientRecord) => void;
}

export function RecordActions({
  record,
  onMarkDelivered,
  onEdit,
  onDelete,
}: RecordActionsProps) {
  const showReminder =
    record.status !== "delivered" && isToday(record.bookedSlotDateTime);

  return (
    <div className="flex flex-wrap gap-1 sm:justify-end">
      <button
        type="button"
        onClick={() => onEdit(record)}
        title="Edit record"
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
      >
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Edit
      </button>
      <button
        type="button"
        onClick={() => onDelete(record)}
        title="Delete record"
        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
      >
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Delete
      </button>
      {record.status !== "delivered" && (
        <button
          type="button"
          onClick={() => onMarkDelivered(record.id)}
          className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
        >
          Mark Delivered
        </button>
      )}
      <a
        href={buildWhatsAppUrl(record)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1da851]"
      >
        WhatsApp
      </a>
      {showReminder && (
        <a
          href={buildOneHourReminderUrl(record)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
        >
          ⏰ Remind 1hr
        </a>
      )}
    </div>
  );
}
