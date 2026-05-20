import { lazy, Suspense, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShoppingCart, BarChart3, ShieldCheck, ScrollText, Users } from "lucide-react";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const PurchaseDashboard = lazy(() => import("./PurchaseDashboard"));
const PurchaseOrderListPage = lazy(() => import("./PurchaseOrderListPage"));
const GoodsReceiptListPage = lazy(() => import("./GoodsReceiptListPage"));
const SupplierInvoiceListPage = lazy(() => import("./SupplierInvoiceListPage"));

const TABS = ["overview", "orders", "receipts", "invoices"] as const;
type TabKey = typeof TABS[number];

export default function PurchasesHubPage() {
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
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        icon={ShoppingCart}
        actions={
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/purchases/reports">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                {t("dashboard.reports")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/purchases/compliance">
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                {t("dashboard.compliance")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/purchases/audit-log">
                <ScrollText className="h-4 w-4 mr-1.5" />
                {t("dashboard.auditLog")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/suppliers">
                <Users className="h-4 w-4 mr-1.5" />
                {t("dashboard.suppliers")}
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setTab} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-background sticky top-0 z-10">
          <div className="px-4 sm:px-6 overflow-x-auto">
            <TabsList className="h-11 bg-transparent p-0 gap-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-muted">
                {t("hub.overview", "Overview")}
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-muted">
                {t("orders.title")}
              </TabsTrigger>
              <TabsTrigger value="receipts" className="data-[state=active]:bg-muted">
                {t("receipts.title")}
              </TabsTrigger>
              <TabsTrigger value="invoices" className="data-[state=active]:bg-muted">
                {t("invoices.title")}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <Suspense fallback={<PageSkeleton />}>
          <TabsContent value="overview" className="m-0 flex-1">
            <PurchaseDashboard />
          </TabsContent>
          <TabsContent value="orders" className="m-0 flex-1">
            <PurchaseOrderListPage />
          </TabsContent>
          <TabsContent value="receipts" className="m-0 flex-1">
            <GoodsReceiptListPage />
          </TabsContent>
          <TabsContent value="invoices" className="m-0 flex-1">
            <SupplierInvoiceListPage />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}
