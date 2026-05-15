import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { OffersList } from "./components/OffersList";
import { OfferDetail } from "./components/OfferDetail";
import { AddOffer } from "./pages/AddOffer";
import { EditOffer } from "./pages/EditOffer";
import { PluginGate } from "@/modules/shared/plugins";
const OfferReportPage = lazy(() => import("./pages/OfferReportPage"));

export function OffersModule() {
  return (
    <PluginGate code="PL0005OFFERS">
      <Routes>
        <Route index element={<OffersList />} />
        <Route path="add" element={<AddOffer />} />
        <Route path=":id" element={<OfferDetail />} />
        <Route path=":id/edit" element={<EditOffer />} />
        <Route path=":id/report" element={<Suspense fallback={null}><OfferReportPage /></Suspense>} />
      </Routes>
      </PluginGate>
  );
}