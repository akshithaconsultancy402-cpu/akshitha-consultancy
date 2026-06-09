export type ServiceType = "land" | "marriage" | "slot";
export type RecordStatus = "active" | "delivered";
export type TabId = "dashboard" | "records" | "period" | "reports";

export interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  serviceType: ServiceType;
  location: string;
  landSize: string;
  surveyPlotNumber: string;
  buyerName: string;
  sellerName: string;
  bookedSlotDateTime: string;
  totalFee: number;
  amountPaid: number;
  status: RecordStatus;
  createdAt: string;
}

export const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "land", label: "Land Registration" },
  { value: "marriage", label: "Marriage Registration" },
  { value: "slot", label: "Slot Booking/Re-writing" },
];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  land: "Land Registration",
  marriage: "Marriage Registration",
  slot: "Slot Booking/Re-writing",
};

export const TABS: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "records", label: "All Records" },
  { id: "period", label: "Today & This Month" },
  { id: "reports", label: "Date Range Reports" },
];

export const STORAGE_KEY = "writer-app-records-v2";

export const emptyForm = {
  name: "",
  phone: "",
  serviceType: "land" as ServiceType,
  location: "",
  landSize: "",
  surveyPlotNumber: "",
  buyerName: "",
  sellerName: "",
  bookedSlotDateTime: "",
  totalFee: "",
  amountPaid: "",
};
