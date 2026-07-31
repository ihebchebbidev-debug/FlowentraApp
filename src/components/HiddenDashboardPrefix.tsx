/**
 * Hides the "/dashboard" segment from the address bar without refactoring routes.
 *
 * How it works:
 *  1. When the router lands on /dashboard/<rest>, we rewrite the browser URL
 *     (history.replaceState only — React Router is never told) to /<rest>.
 *  2. When the browser URL is a bare /<rest> that belongs to the dashboard
 *     (initial load, refresh, back/forward, pasted deep link), we navigate the
 *     router back to /dashboard/<rest> and step 1 hides it again.
 *
 * Paths listed below are real top-level routes and are left untouched.
 */
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Routes that exist outside the dashboard and must never be prefixed. */
const PASSTHROUGH = [
  "/",
  "/login",
  "/user-login",
  "/qa-login",
  "/verify-email",
  "/two-factor",
  "/onboarding",
  "/tests",
  "/select-company",
  "/dashboard",
  "/public",
  "/oauth",
  "/db-console",
  // legacy standalone paths that already have their own redirect rules
  "/offers",
  "/sales",
  "/service-orders",
  "/calendar",
  "/ticketsadmin",
  "/projects",
  "/support",
];

function isPassthrough(pathname: string) {
  return PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Runs once before React mounts: turns a bare dashboard URL into its internal
 * /dashboard/... form so the router matches on the very first render (no
 * NotFound flash on refresh or deep links).
 */
export function restoreDashboardPrefix() {
  if (typeof window === "undefined") return;
  const { pathname, search, hash } = window.location;
  if (!isPassthrough(pathname)) {
    window.history.replaceState(window.history.state, "", "/dashboard" + pathname + search + hash);
  }
}

export function HiddenDashboardPrefix() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { pathname, search, hash } = location;

    // 1) Inside the dashboard → hide the prefix in the address bar.
    if (pathname.startsWith("/dashboard/")) {
      const visible = pathname.slice("/dashboard".length) + search + hash;
      if (window.location.pathname + window.location.search + window.location.hash !== visible) {
        window.history.replaceState(window.history.state, "", visible);
      }
      return;
    }

    // 2) A bare dashboard path (refresh / back / deep link) → restore internally.
    if (!isPassthrough(pathname)) {
      navigate("/dashboard" + pathname + search + hash, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

export default HiddenDashboardPrefix;
