import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Receipt,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  // When the path is non-index, NavLink's default behaviour is fine.
  // For the index ("Overview") we need an exact match so that /orders
  // doesn't also light up Overview.
  end?: boolean;
  // Some nested pages should keep a parent tab highlighted even though their
  // path is a sibling (e.g. /reports/supplier-performance ➜ keep Reports active).
  matchPrefixes?: string[];
}

/**
 * Sticky sub-navigation for the Purchases module, mirroring the flat per-entity
 * structure used by Offers / Sales / Service Orders. Replaces the previous
 * `?tab=…` cockpit so every section is a real, bookmarkable, breadcrumb-friendly
 * URL.
 */
export function PurchasesSubNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const items: NavItem[] = [
    {
      to: "/dashboard/purchases",
      label: t("purchases.tabs.overview", "Overview"),
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/dashboard/purchases/orders",
      label: t("purchases.tabs.orders", "Orders"),
      icon: ShoppingCart,
    },
    {
      to: "/dashboard/purchases/receipts",
      label: t("purchases.tabs.receipts", "Receipts"),
      icon: Truck,
    },
    {
      to: "/dashboard/purchases/invoices",
      label: t("purchases.tabs.invoices", "Invoices"),
      icon: Receipt,
    },
    {
      to: "/dashboard/purchases/compliance",
      label: t("purchases.tabs.compliance", "Compliance"),
      icon: ShieldCheck,
    },
    {
      to: "/dashboard/purchases/reports",
      label: t("purchases.tabs.reports", "Reports"),
      icon: BarChart3,
      matchPrefixes: ["/dashboard/purchases/reports"],
    },
    {
      to: "/dashboard/purchases/audit-log",
      label: t("purchases.tabs.audit", "Audit"),
      icon: ClipboardList,
    },
  ];

  return (
    <div className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
      <nav
        aria-label="Purchases sections"
        className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-thin"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const prefixActive =
            item.matchPrefixes?.some((p) => pathname.startsWith(p)) ?? false;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs md:text-sm font-medium whitespace-nowrap transition-colors",
                  isActive || prefixActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
