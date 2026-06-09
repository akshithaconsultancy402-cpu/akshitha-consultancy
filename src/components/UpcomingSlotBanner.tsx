"use client";

import type { ClientRecord } from "@/src/lib/types";
import { formatSlotTime } from "@/src/lib/utils";
import { transitionTheme } from "@/src/lib/ui-classes";

interface UpcomingSlotBannerProps {
  alerts: ClientRecord[];
}

export function UpcomingSlotBanner({ alerts }: UpcomingSlotBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((record) => (
        <div
          key={record.id}
          className={`flex items-start gap-3 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-3 shadow-sm dark:border-amber-600 dark:from-amber-950/80 dark:to-orange-950/60 ${transitionTheme}`}
          role="alert"
        >
          <span className="text-xl" aria-hidden>
            ⚠️
          </span>
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100 sm:text-base">
            UPCOMING SLOT:{" "}
            <span className="font-bold">{record.name}</span> has a slot at{" "}
            <span className="font-bold">
              {formatSlotTime(record.bookedSlotDateTime)}
            </span>
            !
          </p>
        </div>
      ))}
    </div>
  );
}
