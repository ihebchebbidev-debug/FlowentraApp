import { Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense } from "react";
import InventoryField from "./InventoryField/InventoryFieldModule";
import Reports from "./reports/ReportsModule";
import { DocumentsModule } from "@/modules/documents/DocumentsModule";
import { DispatcherModule } from "@/modules/dispatcher/DispatcherModule";
import InstallationsModule from "./installations/InstallationsModule";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { PluginGate } from "@/modules/shared/plugins";

// Lazy load Field Dashboard for better initial load
const FieldDashboard = lazyWithRetry(() => import("./components/FieldDashboard").then(m => ({ default: m.FieldDashboard })));

// Lazy load heavy table modules
const ServiceOrders = lazyWithRetry(() => import("./service-orders/ServiceOrdersModule"));
const DispatchModule = lazyWithRetry(() => import("./dispatches/DispatchModule"));

// Lazy load heavy Time Expenses module
const TimeExpensesModule = lazyWithRetry(() => import("./time-expenses/TimeExpensesModule"));

// Minimal loading placeholder for Field Dashboard (no spinner)
const FieldDashboardLoadingPlaceholder = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="h-8 bg-muted rounded w-48" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-muted rounded-lg" />
      ))}
    </div>
    <div className="h-64 bg-muted rounded-lg" />
  </div>
);

// Minimal table loading placeholder (no spinner)
const TableLoadingPlaceholder = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="h-10 bg-muted rounded w-32" />
    </div>
    <div className="flex gap-2">
      <div className="h-10 bg-muted rounded w-64" />
      <div className="h-10 bg-muted rounded w-24" />
    </div>
    <div className="space-y-2">
      <div className="h-12 bg-muted rounded w-full" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-14 bg-muted/60 rounded w-full" />
      ))}
    </div>
  </div>
);

export function FieldModule() {
  console.log("FieldModule rendering");
  return (
    <PluginGate code="PL0015FIELD">
      <Routes>
        <Route index element={<Navigate to="reports" replace />} />
        <Route path="dashboard" element={
          <Suspense fallback={<FieldDashboardLoadingPlaceholder />}>
            <FieldDashboard />
          </Suspense>
        } />
        <Route path="service-orders/*" element={
          <PermissionRoute module="service_orders" action="read">
            <Suspense fallback={<TableLoadingPlaceholder />}>
              <ServiceOrders />
            </Suspense>
          </PermissionRoute>
        } />
        <Route path="dispatches/*" element={
          <PermissionRoute module="service_orders" action="read">
            <Suspense fallback={<TableLoadingPlaceholder />}>
              <DispatchModule />
            </Suspense>
          </PermissionRoute>
        } />
      
        <Route path="dispatcher/*" element={
          <PermissionRoute module="service_orders" action="read">
            <DispatcherModule />
          </PermissionRoute>
        } />
        <Route path="installations/*" element={
          <PermissionRoute module="installations" action="read">
            <InstallationsModule />
          </PermissionRoute>
        } />
      
        <Route path="inventory/*" element={<InventoryField />} />
        <Route
          path="time-expenses/*"
          element={
            <PermissionRoute module="time_tracking" action="read">
              <Suspense fallback={<TableLoadingPlaceholder />}>
                <TimeExpensesModule />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route path="documents/*" element={<DocumentsModule />} />
        <Route path="reports" element={<Reports />} />
      </Routes>
      </PluginGate>
  );
}
