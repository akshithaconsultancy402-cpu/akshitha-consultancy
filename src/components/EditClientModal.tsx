"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SERVICE_OPTIONS,
  type ClientRecord,
  type RecordStatus,
  type ServiceType,
} from "@/src/lib/types";
import {
  cardHeaderBorder,
  inputClass,
  labelClass,
  modalOverlay,
  modalPanel,
  panelMuted,
  transitionTheme,
} from "@/src/lib/ui-classes";
import { formatCurrency, toDatetimeLocalValue } from "@/src/lib/utils";

interface EditClientModalProps {
  record: ClientRecord;
  onSave: (updated: ClientRecord) => void;
  onCancel: () => void;
}

interface EditForm {
  name: string;
  phone: string;
  serviceType: ServiceType;
  location: string;
  landSize: string;
  surveyPlotNumber: string;
  buyerName: string;
  sellerName: string;
  bookedSlotDateTime: string;
  totalFee: string;
  amountPaid: string;
  status: RecordStatus;
}

function recordToForm(record: ClientRecord): EditForm {
  return {
    name: record.name,
    phone: record.phone,
    serviceType: record.serviceType,
    location: record.location,
    landSize: record.landSize,
    surveyPlotNumber: record.surveyPlotNumber,
    buyerName: record.buyerName,
    sellerName: record.sellerName,
    bookedSlotDateTime: toDatetimeLocalValue(record.bookedSlotDateTime),
    totalFee: String(record.totalFee),
    amountPaid: String(record.amountPaid),
    status: record.status,
  };
}

export function EditClientModal({
  record,
  onSave,
  onCancel,
}: EditClientModalProps) {
  const [form, setForm] = useState<EditForm>(() => recordToForm(record));

  useEffect(() => {
    setForm(recordToForm(record));
  }, [record]);

  const amountDue = useMemo(() => {
    const total = parseFloat(form.totalFee) || 0;
    const paid = parseFloat(form.amountPaid) || 0;
    return Math.max(0, total - paid);
  }, [form.totalFee, form.amountPaid]);

  const update = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    const totalFee = parseFloat(form.totalFee) || 0;
    const amountPaid = parseFloat(form.amountPaid) || 0;

    onSave({
      ...record,
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
      status: form.status,
    });
  };

  return (
    <div className={modalOverlay}>
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden shadow-2xl ${modalPanel}`}
      >
        <div className={`${cardHeaderBorder} px-6 py-4`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Edit Client Record
          </h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Update details for {record.name}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Client Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Service Type</label>
              <select
                value={form.serviceType}
                onChange={(e) =>
                  update("serviceType", e.target.value as ServiceType)
                }
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
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as RecordStatus)
                }
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Land Size</label>
              <input
                value={form.landSize}
                onChange={(e) => update("landSize", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Survey / Plot Number</label>
              <input
                value={form.surveyPlotNumber}
                onChange={(e) => update("surveyPlotNumber", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Booked Slot Date / Time</label>
              <input
                type="datetime-local"
                value={form.bookedSlotDateTime}
                onChange={(e) =>
                  update("bookedSlotDateTime", e.target.value)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Buyer Name</label>
              <input
                value={form.buyerName}
                onChange={(e) => update("buyerName", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Seller Name</label>
              <input
                value={form.sellerName}
                onChange={(e) => update("sellerName", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className={panelMuted}>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Payments
            </h4>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Total Fee Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.totalFee}
                  onChange={(e) => update("totalFee", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.amountPaid}
                  onChange={(e) => update("amountPaid", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Amount Due</label>
                <div
                  className={`flex h-[42px] items-center rounded-xl border px-3.5 text-sm font-bold ${transitionTheme} ${
                    amountDue > 0
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  }`}
                >
                  {formatCurrency(amountDue)}
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className={`flex flex-col-reverse gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-600 sm:flex-row sm:justify-end ${transitionTheme}`}>
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 ${transitionTheme}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
