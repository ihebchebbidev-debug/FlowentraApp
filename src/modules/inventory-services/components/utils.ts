import { AlertTriangle, Building, Car, CheckCircle, Package, Warehouse, Wrench } from "lucide-react";
import type { TFunction } from "i18next";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
    case "active":
      return "bg-success/10 text-success";
    case "low_stock":
      return "bg-warning/10 text-warning";
    case "out_of_stock":
    case "inactive":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const getStatusLabel = (status: string, t?: TFunction): string => {
  const normalized = (status || "").toLowerCase();
  if (t) {
    const translated = t(normalized, {
      defaultValue: normalized ? normalized.replace(/_/g, " ") : t("detail.unknown", { defaultValue: "Unknown" }),
    });
    return translated;
  }

  // Fallback to previous English labels when no translator provided
  switch (normalized) {
    case "available":
      return "Available";
    case "active":
      return "Active";
    case "low_stock":
      return "Low Stock";
    case "out_of_stock":
      return "Out of Stock";
    case "inactive":
      return "Inactive";
    case "discontinued":
      return "Discontinued";
    default:
      return normalized || "Unknown";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "available":
    case "active":
      return CheckCircle;
    case "low_stock":
    case "out_of_stock":
      return AlertTriangle;
    default:
      return Package;
  }
};

export const getLocationIcon = (locationType: string) => {
  switch (locationType) {
    case "warehouse":
      return Building;
    case "vehicle":
      return Car;
    default:
      return Warehouse;
  }
};

export const getTypeIcon = (type: string) => {
  return type === "service" ? Wrench : Package;
};

export type InventoryServiceItem = any;
