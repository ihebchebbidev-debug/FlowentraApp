import { createContext, useContext } from "react";

/**
 * When true, Purchases pages know they are being rendered inside the
 * PurchasesCockpit tab shell and should suppress their own page header
 * (the cockpit renders one shared header instead).
 */
export const PurchasesEmbeddedContext = createContext<boolean>(false);

export function useIsPurchasesEmbedded() {
  return useContext(PurchasesEmbeddedContext);
}