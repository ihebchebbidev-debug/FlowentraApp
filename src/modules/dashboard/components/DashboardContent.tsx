import { Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense } from "react";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { PluginGate } from "@/modules/shared/plugins";

const TicketsAdminPage = lazyWithRetry(() => import("@/pages/TicketsAdminPage"));

// Lazy load CRM Dashboard for better initial load
const DashboardOverview = lazyWithRetry(() => import("./DashboardOverview"));
const DashboardBuilderPage = lazyWithRetry(() => import("@/modules/dashboard-builder/components/DashboardManager").then(m => ({ default: m.DashboardManager })));
// Lazy load heavy table/data modules for better performance
const ContactsModule = lazyWithRetry(() => import("@/modules/contacts/ContactsModule").then(m => ({ default: m.ContactsModule })));
const SuppliersModule = lazyWithRetry(() => import("@/modules/contacts/SuppliersModule").then(m => ({ default: m.SuppliersModule })));
const SalesModule = lazyWithRetry(() => import("@/modules/sales").then(m => ({ default: m.SalesModule })));
const OffersModule = lazyWithRetry(() => import("@/modules/offers").then(m => ({ default: m.OffersModule })));
const ArticlesModule = lazyWithRetry(() => import("@/modules/articles/ArticlesModule").then(m => ({ default: m.ArticlesModule })));
const InventoryServicesModule = lazyWithRetry(() => import("@/modules/inventory-services/InventoryServicesModule"));
const StockManagementModule = lazyWithRetry(() => import("@/modules/stock-management"));

// Lazy load heavy visualization/complex modules
const CalendarModule = lazyWithRetry(() => import("@/modules/calendar/CalendarModule").then(m => ({ default: m.CalendarModule })));
const FieldModule = lazyWithRetry(() => import("@/modules/field/FieldModule").then(m => ({ default: m.FieldModule })));
const AnalyticsModule = lazyWithRetry(() => import("@/modules/analytics/AnalyticsModule").then(m => ({ default: m.AnalyticsModule })));
const TasksModule = lazyWithRetry(() => import("@/modules/tasks/TasksModule"));
const WorkflowModule = lazyWithRetry(() => import("@/modules/workflow/WorkflowModule").then(m => ({ default: m.WorkflowModule })));
const AutomationModule = lazyWithRetry(() => import("@/modules/automation/AutomationModule").then(m => ({ default: m.AutomationModule })));
const LookupsPage = lazyWithRetry(() => import("@/modules/lookups/pages/LookupsPage"));
const WebsiteBuilderModule = lazyWithRetry(() => import("@/modules/website-builder/WebsiteBuilderModule"));
const HRModule = lazyWithRetry(() => import("@/modules/hr/HRModule"));
const ExternalModule = lazyWithRetry(() => import("@/modules/external/ExternalModule"));

// Lightweight modules - eager load
import { DocumentsModule } from "@/modules/documents";
import { DealsModule } from "@/modules/deals/DealsModule";
import { CommunicationModule } from "@/modules/communication/CommunicationModule";
const EmailCalendarModule = lazyWithRetry(() => import("@/modules/email-calendar/EmailCalendarModule").then(m => ({ default: m.EmailCalendarModule })));
import { SettingsModule } from "@/modules/settings/SettingsModule";
import { NotificationsModule } from "@/modules/notifications/NotificationsModule";
import HelpModule from "./HelpModule";
const PurchasesModule = lazyWithRetry(() => import("@/modules/purchases/PurchasesModule").then(m => ({ default: m.PurchasesModule })));

export function DashboardContent() {
  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <Routes>
        <Route index element={
          <Suspense fallback={<PageSkeleton />}>
            <DashboardOverview />
          </Suspense>
        } />
        <Route path="dashboards" element={
          <Suspense fallback={<PageSkeleton />}>
            <DashboardBuilderPage />
          </Suspense>
        } />

        <Route path="contacts/*" element={
          <PermissionRoute module="contacts" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <ContactsModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="suppliers/*" element={
          <PermissionRoute module="contacts" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <SuppliersModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="offers/*" element={
          <PermissionRoute module="offers" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <OffersModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="sales/*" element={
          <PermissionRoute module="sales" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <SalesModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="documents/*" element={
          <PermissionRoute module="documents" action="read">
            <DocumentsModule />
          </PermissionRoute>
        } />
        <Route path="workflow/*" element={
          <PermissionRoute module="settings" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <WorkflowModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="articles/*" element={
          <PermissionRoute module="articles" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <ArticlesModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="inventory-services/*" element={
          <PermissionRoute module="articles" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <InventoryServicesModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="stock-management/*" element={
          <PermissionRoute module="stock_management" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <StockManagementModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="deals/*" element={
          <PermissionRoute module="deals" action="read">
            <DealsModule />
          </PermissionRoute>
        } />
        <Route path="communication/*" element={
          <PermissionRoute module="contacts" action="read">
            <CommunicationModule />
          </PermissionRoute>
        } />
        <Route path="tasks/*" element={
          <Suspense fallback={<PageSkeleton />}>
            <TasksModule />
          </Suspense>
        } />
        <Route path="automation/*" element={
          <PermissionRoute module="settings" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <AutomationModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="analytics/*" element={
          <PermissionRoute module="sales" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <AnalyticsModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="calendar/*" element={
          <Suspense fallback={<PageSkeleton />}>
            <CalendarModule />
          </Suspense>
        } />
        <Route path="field/*" element={
          <PermissionRoute module="service_orders" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <FieldModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="email-calendar/*" element={
          <Suspense fallback={<PageSkeleton />}>
            <EmailCalendarModule />
          </Suspense>
        } />
        <Route path="notifications" element={<NotificationsModule />} />
        <Route path="lookups/*" element={
          <PluginGate code="PL0037LOOKUPS">
            <PermissionRoute module="settings" action="read">
              <Suspense fallback={<PageSkeleton />}>
                <LookupsPage />
              </Suspense>
            </PermissionRoute>
          </PluginGate>
        } />
        <Route path="settings/*" element={
          <PermissionRoute module="settings" action="read">
            <SettingsModule />
          </PermissionRoute>
        } />
        <Route path="website-builder/*" element={
          <PermissionRoute module="settings" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <WebsiteBuilderModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="hr/*" element={
          <PermissionRoute module="hr" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <HRModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="external/*" element={
          <PermissionRoute module="external_endpoints" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <ExternalModule />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="purchases/*" element={
          <PermissionRoute module="purchases" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <PurchasesModule />
            </Suspense>
          </PermissionRoute>
        } />
        {/* Help/Support route */}
        <Route path="help/*" element={<HelpModule />} />
        {/* Projects: standalone /dashboard/projects URLs redirect into the tasks module */}
        <Route path="projects" element={<Navigate to="/dashboard/tasks/projects" replace />} />
        <Route path="projects/*" element={<Navigate to="/dashboard/tasks/projects" replace />} />
        {/* Tickets Admin */}
        <Route path="ticketsadmin" element={
          <PermissionRoute module="settings" action="read">
            <Suspense fallback={<PageSkeleton />}>
              <TicketsAdminPage />
            </Suspense>
          </PermissionRoute>
        } />
      </Routes>
    </div>
  );
}
