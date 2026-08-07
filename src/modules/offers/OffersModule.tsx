import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { OffersList } from "./components/OffersList";
import { OfferDetail } from "./components/OfferDetail";
import { AddOffer } from "./pages/AddOffer";
import { EditOffer } from "./pages/EditOffer";
import { PluginGate } from "@/modules/shared/plugins";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";
const OfferReportPage = lazy(() => import("./pages/OfferReportPage"));

export function OffersModule() {
  return (
    <PluginGate code="PL0005OFFERS">
      <Routes>
        <Route index element={<PermissionRoute module="offers" action="read"><OffersList /></PermissionRoute>} />
        <Route path="add" element={<PermissionRoute module="offers" action="create"><AddOffer /></PermissionRoute>} />
        <Route path=":id" element={<PermissionRoute module="offers" action="read"><OfferDetail /></PermissionRoute>} />
        <Route path=":id/edit" element={<PermissionRoute module="offers" action="update"><EditOffer /></PermissionRoute>} />
        <Route path=":id/report" element={<PermissionRoute module="offers" action="read"><Suspense fallback={null}><OfferReportPage /></Suspense></PermissionRoute>} />
      </Routes>
    </PluginGate>
  );
}