import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const PurchaseReportsPage = lazy(() => import("./PurchaseReportsPage"));
const ComplianceDashboardPage = lazy(() => import("./ComplianceDashboardPage"));
const PurchaseAuditLogPage = lazy(() => import("./PurchaseAuditLogPage"));
const SupplierPerformancePage = lazy(() => import("./SupplierPerformancePage"));
const PriceEvolutionPage = lazy(() => import("./PriceEvolutionPage"));
const SupplierInvoiceAgingPage = lazy(() => import("./SupplierInvoiceAgingPage"));

export default function InsightsTab() {
  const { t } = useTranslation();
  const [sub, setSub] = useState("reports");

  const subs = [
    { key: "reports", label: t("purchases.insights.reports", "Reports") },
    { key: "compliance", label: t("purchases.insights.compliance", "Compliance") },
    { key: "performance", label: t("purchases.insights.performance", "Supplier Perf.") },
    { key: "price", label: t("purchases.insights.price", "Price Evolution") },
    { key: "aging", label: t("purchases.insights.aging", "Invoice Aging") },
    { key: "audit", label: t("purchases.insights.audit", "Audit Log") },
  ];

  return (
    <Tabs value={sub} onValueChange={setSub} className="w-full">
      <div className="px-3 pt-3 pb-1 sticky top-0 bg-background/80 backdrop-blur z-10 border-b border-border">
        <TabsList className="bg-muted/50 h-9">
          {subs.map((s) => (
            <TabsTrigger key={s.key} value={s.key} className="text-xs px-3 py-1.5">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="px-0 pb-6">
        <Suspense fallback={<PageSkeleton />}>
          <TabsContent value="reports" className="m-0"><PurchaseReportsPage /></TabsContent>
          <TabsContent value="compliance" className="m-0"><ComplianceDashboardPage /></TabsContent>
          <TabsContent value="performance" className="m-0"><SupplierPerformancePage /></TabsContent>
          <TabsContent value="price" className="m-0"><PriceEvolutionPage /></TabsContent>
          <TabsContent value="aging" className="m-0"><SupplierInvoiceAgingPage /></TabsContent>
          <TabsContent value="audit" className="m-0"><PurchaseAuditLogPage /></TabsContent>
        </Suspense>
      </div>
    </Tabs>
  );
}