import { Button, ButtonProps } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionModule, PermissionAction } from "@/types/permissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreateActionGuard, useMutationActionGuard } from "@/hooks/useCreateActionGuard";

interface PermissionButtonProps extends ButtonProps {
  module: PermissionModule;
  action: PermissionAction;
  hideWhenDisabled?: boolean;
  tooltipWhenDisabled?: string;
}

/**
 * A button that is disabled or hidden based on user permissions.
 * Use this for create, edit, delete actions throughout the app.
 */
export function PermissionButton({
  module,
  action,
  hideWhenDisabled = false,
  tooltipWhenDisabled = "You don't have permission to perform this action",
  children,
  disabled,
  onClick,
  ...props
}: PermissionButtonProps) {
  const { isMainAdmin, hasPermission, isLoading } = usePermissions();
  // For any mutating action (create / update / delete) gate on cross-company
  // view-all mode requiring a target company to be selected.
  const createGuard = useCreateActionGuard();
  const mutationGuard = useMutationActionGuard();
  const isMutatingAction =
    action === "create" || action === "update" || action === "delete";
  const activeGuard = action === "create" ? createGuard : mutationGuard;
  const isCreateBlocked = isMutatingAction && activeGuard.disabled;

  const hasAccess = isMainAdmin || hasPermission(module, action);
  const isDisabled = disabled || isLoading || !hasAccess || isCreateBlocked;

  // Hide completely if no permission and hideWhenDisabled is true
  if (hideWhenDisabled && !hasAccess && !isLoading) {
    return null;
  }

  // If disabled due to permission, show tooltip
  if (!hasAccess && !isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button {...props} disabled={true}>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipWhenDisabled}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // If disabled because we're in cross-company view-all mode without a
  // selected target company, show an explanatory tooltip and intercept clicks.
  if (isCreateBlocked) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex">
              <Button
                {...props}
                disabled={true}
                aria-disabled
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-center">
            <p>{activeGuard.reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button {...props} onClick={onClick} disabled={isDisabled}>
      {children}
    </Button>
  );
}

export default PermissionButton;
