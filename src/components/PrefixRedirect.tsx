/**
 * Tiny helper: redirects /<from>(/...) → /dashboard/<from>(/...) while
 * preserving every trailing segment AND the query string.
 *
 * <Navigate to="/dashboard/sales" /> would turn /sales/9 into /dashboard/sales,
 * losing the id. PrefixRedirect keeps the splat so deep-link refreshes like
 * /sales/9 land on /dashboard/sales/9 with id=9 intact.
 */
import { Navigate, useLocation, useParams } from "react-router-dom";

export function PrefixRedirect({ to }: { to: string }) {
  const params = useParams();
  const location = useLocation();
  // react-router stores the wildcard tail under params['*']
  const rest = (params as Record<string, string | undefined>)["*"] ?? "";
  const target = rest ? `${to}/${rest}${location.search}${location.hash}` : `${to}${location.search}${location.hash}`;
  return <Navigate to={target} replace />;
}

export default PrefixRedirect;
