import { Outlet } from "react-router-dom";
import { PurchasesSubNav } from "./PurchasesSubNav";

/**
 * Module-level layout for Purchases. Renders the persistent sub-nav at the top
 * and delegates the rest of the screen to the matched nested route.
 *
 * Notes:
 *  - Per-record `/report` PDF pages are intentionally mounted OUTSIDE this
 *    layout so the PDF viewer can take the full viewport, mirroring the
 *    Offers / Sales / Service-Orders report pages.
 *  - Individual list / detail / create pages keep their own page-headers
 *    (PurchasePageHeader) — exactly like OffersList renders its own OffersHeader.
 */
export default function PurchasesLayout() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <PurchasesSubNav />
      <div className="flex-1 min-h-0 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
