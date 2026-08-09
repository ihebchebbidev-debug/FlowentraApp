import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, Table as TableIcon, List as ListIcon } from "lucide-react";
import { CompanyFilter, type CompanyFilterValue } from "@/components/CompanyFilter";
import { isViewAllMode } from "@/utils/tenant";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilter: boolean;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  paymentFilter: string;
  onPaymentChange: (v: string) => void;
  companyId: CompanyFilterValue;
  onCompanyChange: (v: CompanyFilterValue) => void;
  viewMode: "list" | "table";
  onViewModeChange: (v: "list" | "table") => void;
}

const STATUSES = [
  "draft",
  "validated",
  "ordered",
  "partially_received",
  "received",
  "closed",
  "cancelled",
];

const PAYMENT_STATUSES = ["pending", "partial", "paid"];

export function PurchaseOrdersSearchControls(props: Props) {
  const { t } = useTranslation("purchases");
  const viewAll = isViewAllMode();

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("orders.searchPlaceholder", "Search orders...")}
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="ps-8 h-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant={
              props.showFilters || props.hasActiveFilter ? "default" : "outline"
            }
            size="sm"
            className="h-9"
            onClick={props.onToggleFilters}
          >
            <Filter className="h-3.5 w-3.5 sm:me-1.5" />
            <span className="hidden sm:inline">
              {t("filters.title", "Filters")}
            </span>
            {props.hasActiveFilter && (
              <Badge variant="secondary" className="ms-1.5 h-4 px-1 text-px-10">
                •
              </Badge>
            )}
          </Button>
          <div className="hidden md:flex items-center border border-border rounded-md p-0.5">
            <Button
              variant={props.viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => props.onViewModeChange("table")} data-non-list-view="true"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={props.viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => props.onViewModeChange("list")}
            >
              <ListIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {props.showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Select value={props.statusFilter} onValueChange={props.onStatusChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={t("filters.status", "Status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("filters.allStatuses", "All statuses")}
              </SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={props.paymentFilter}
            onValueChange={props.onPaymentChange}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={t("filters.payment", "Payment")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("filters.allPayments", "All payments")}
              </SelectItem>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`paymentStatus.${s}`, s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
