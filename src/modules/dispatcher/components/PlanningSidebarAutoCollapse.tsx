import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

const RESTORE_KEY = "sidebar:auto-collapsed-prev-open";

function useOptionalSidebar() {
  try {
    return useSidebar();
  } catch {
    return null;
  }
}

export function PlanningSidebarAutoCollapse() {
  const sidebar = useOptionalSidebar();
  const setOpen = sidebar?.setOpen;
  const wasOpenOnEntry = sidebar?.open ?? false;

  useEffect(() => {
    if (!setOpen) return;

    if (wasOpenOnEntry) {
      try {
        sessionStorage.setItem(RESTORE_KEY, JSON.stringify(true));
      } catch {
        /* ignore */
      }
    }

    setOpen(false);

    return () => {
      try {
        const shouldRestore = sessionStorage.getItem(RESTORE_KEY) !== null;
        if (shouldRestore) {
          sessionStorage.removeItem(RESTORE_KEY);
          setOpen(true);
        }
      } catch {
        /* ignore */
      }
    };
    // Run only for the Planning board mount/unmount. Including `setOpen` or
    // `open` re-runs when the user manually opens the sidebar and closes it again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}