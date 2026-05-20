import { lazy, Suspense, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const PurchaseReportsPage = lazy(() => import("./PurchaseReportsPage"));
const SupplierPerformancePage = lazy(() => import("./SupplierPerformancePage"));
const PriceEvolutionPage = lazy(() => import("./PriceEvolutionPage"));
const SupplierInvoiceAgingPage = lazy(() => import("./SupplierInvoiceAgingPage"));

const TABS = ["overview", "supplier-performance", "price-evolution", "aging"] as const;
type TabKey = typeof TABS[number];

export default function PurchaseReportsHubPage() {
  const { t } = useTranslation("purchases");
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) || "overview";
  const activeTab = useMemo(() => (TABS.includes(tab) ? tab : "overview"), [tab]);

  const setTab = (next: string) => {
    const sp = new URLSearchParams(searchParams);
    if (next === "overview") sp.delete("tab");
    else sp.set("tab", next);
    setSearchParams(sp, { replace: true });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <PurchasePageHeader
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        icon={BarChart3}
        backTo={{ to: "/dashboard/purchases", label: t("dashboard.title") }}
      />

      <Tabs value={activeTab} onValueChange={setTab} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-background sticky top-0 z-10">
          <div className="px-4 sm:px-6 overflow-x-auto">
            <TabsList className="h-11 bg-transparent p-0 gap-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-muted">
                {t("hub.overview", "Overview")}
              </TabsTrigger>
              <TabsTrigger value="supplier-performance" className="data-[state=active]:bg-muted">
                {t("reports.supplierPerformance", "Supplier Performance")}
              </TabsTrigger>
              <TabsTrigger value="price-evolution" className="data-[state=active]:bg-muted">
                {t("reports.priceEvolution", "Price Evolution")}
              </TabsTrigger>
              <TabsTrigger value="aging" className="data-[state=active]:bg-muted">
                {t("reports.aging", "Invoice Aging")}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <Suspense fallback={<PageSkeleton />}>
          <TabsContent value="overview" className="m-0 flex-1">
            <PurchaseReportsPage />
          </TabsContent>
          <TabsContent value="supplier-performance" className="m-0 flex-1">
            <SupplierPerformancePage />
          </TabsContent>
          <TabsContent value="price-evolution" className="m-0 flex-1">
            <PriceEvolutionPage />
          </TabsContent>
          <TabsContent value="aging" className="m-0 flex-1">
            <SupplierInvoiceAgingPage />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}
