import { lazy, Suspense, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  LayoutDashboard,
  Truck,
  Receipt,
  ShieldCheck,
  BarChart3,
  Plus,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PurchasesEmbeddedContext } from "../components/EmbeddedContext";

const PurchaseDashboard = lazy(() => import("./PurchaseDashboard"));
const PurchaseOrderListPage = lazy(() => import("./PurchaseOrderListPage"));
const GoodsReceiptListPage = lazy(() => import("./GoodsReceiptListPage"));
const SupplierInvoiceListPage = lazy(() => import("./SupplierInvoiceListPage"));
const InsightsTab = lazy(() => import("./InsightsTab"));

const VALID_TABS = ["overview", "orders", "receipts", "invoices", "insights"] as const;
type TabKey = (typeof VALID_TABS)[number];

function isTab(v: string | null): v is TabKey {
  return !!v && (VALID_TABS as readonly string[]).includes(v);
}

export default function PurchasesCockpit() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tab: TabKey = isTab(params.get("tab")) ? (params.get("tab") as TabKey) : "overview";

  const setTab = (next: string) => {
    const p = new URLSearchParams(params);
    p.set("tab", next);
    setParams(p, { replace: true });
  };

  const tabs = useMemo(
    () => [
      { key: "overview", label: t("purchases.tabs.overview", "Overview"), icon: LayoutDashboard },
      { key: "orders", label: t("purchases.tabs.orders", "Orders"), icon: ShoppingCart },
      { key: "receipts", label: t("purchases.tabs.receipts", "Receipts"), icon: Truck },
      { key: "invoices", label: t("purchases.tabs.invoices", "Invoices"), icon: Receipt },
      { key: "insights", label: t("purchases.tabs.insights", "Insights"), icon: BarChart3 },
    ],
    [t],
  );

  const primaryAction = (() => {
    switch (tab) {
      case "orders":
        return { label: t("purchases.newOrder", "New Order"), to: "/dashboard/purchases/orders/add" };
      case "receipts":
        return { label: t("purchases.newReceipt", "New Receipt"), to: "/dashboard/purchases/receipts/add" };
      case "invoices":
        return { label: t("purchases.newInvoice", "New Invoice"), to: "/dashboard/purchases/invoices/add" };
      default:
        return null;
    }
  })();

  return (
    <PurchasesEmbeddedContext.Provider value={true}>
      <div className="flex flex-col h-full">
        {/* Unified cockpit header */}
        <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
                  {t("purchases.cockpitTitle", "Purchases")}
                </h1>
                <p className="text-[11px] text-muted-foreground truncate">
                  {t(
                    "purchases.cockpitSubtitle",
                    "Orders, receipts, invoices, compliance & insights",
                  )}
                </p>
              </div>
            </div>
            {primaryAction && (
              <Button size="sm" onClick={() => navigate(primaryAction.to)} className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-1" /> {primaryAction.label}
              </Button>
            )}
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <div className="px-2 pt-2 overflow-x-auto">
              <TabsList className="bg-transparent p-0 h-auto gap-1">
                {tabs.map((tb) => {
                  const Icon = tb.icon;
                  return (
                    <TabsTrigger
                      key={tb.key}
                      value={tb.key}
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-md px-3 py-1.5 text-xs md:text-sm gap-1.5"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tb.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </Tabs>
        </div>

        {/* Tab content (each existing page renders without its own header) */}
        <div className="flex-1 min-h-0 overflow-auto">
          <Suspense fallback={<PageSkeleton />}>
            {tab === "overview" && <PurchaseDashboard />}
            {tab === "orders" && <PurchaseOrderListPage />}
            {tab === "receipts" && <GoodsReceiptListPage />}
            {tab === "invoices" && <SupplierInvoiceListPage />}
            {tab === "insights" && <InsightsTab />}
          </Suspense>
        </div>
      </div>
    </PurchasesEmbeddedContext.Provider>
  );
}