/**
 * CreateActionButton — drop-in replacement for the page-level "Create / Add"
 * <Button> that becomes inert with an explanatory tooltip when the user is in
 * cross-company view-all mode and has not yet selected a target company.
 *
 * Behavior:
 *  - Outside view-all mode: behaves exactly like <Button>.
 *  - In view-all mode without a selected target company: visually muted with
 *    a tooltip AND a toast on click explaining the user must pick a company.
 *    We deliberately keep the button clickable (not natively `disabled`) so
 *    the click feedback fires — previously the button felt "dead" because
 *    native disabled buttons swallow pointer events silently.
 *  - In view-all mode with a target company selected: behaves exactly like
 *    <Button>.
 */
import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCreateActionGuard } from '@/hooks/useCreateActionGuard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface CreateActionButtonProps extends ButtonProps {
  blockedTooltip?: string;
}

export const CreateActionButton = React.forwardRef<
  HTMLButtonElement,
  CreateActionButtonProps
>(function CreateActionButton(
  { onClick, disabled, className, children, blockedTooltip, ...rest },
  ref,
) {
  const guard = useCreateActionGuard();
  const isBlocked = guard.disabled;

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isBlocked) {
        event.preventDefault();
        event.stopPropagation();
        toast.warning(blockedTooltip ?? guard.reason);
        return;
      }
      onClick?.(event);
    },
    [isBlocked, onClick, blockedTooltip, guard.reason],
  );

  const button = (
    <Button
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled || isBlocked}
      data-blocked={isBlocked || undefined}
      className={cn(isBlocked && 'opacity-60 cursor-help', className)}
      {...rest}
    >
      {children}
    </Button>
  );

  if (!isBlocked) return button;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center">
          {blockedTooltip ?? guard.reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default CreateActionButton;
