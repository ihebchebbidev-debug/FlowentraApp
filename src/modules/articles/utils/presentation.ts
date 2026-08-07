import { AlertTriangle, CheckCircle, Package } from "lucide-react";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "status-success";
    case "low_stock":
      return "status-warning";
    case "out_of_stock":
      return "status-error";
    default:
      return "status-info";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "available":
      return CheckCircle;
    case "low_stock":
    case "out_of_stock":
      return AlertTriangle;
    default:
      return Package;
  }
};
