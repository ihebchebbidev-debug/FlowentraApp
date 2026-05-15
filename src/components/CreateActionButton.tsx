/**
 * CreateActionButton — drop-in replacement for the page-level "Create / Add"
 * <Button> that becomes inert with an explanatory tooltip when the user is in
 * cross-company view-all mode and has not yet selected a target company.
 *
 * Use this for any action that creates a new tenant-scoped record (offers,
 * sales, contacts, articles, dispatches, service orders, projects, …).
 *
 * Behavior:
 *  - Outside view-all mode: behaves exactly like <Button>.
 *  - In view-all mode without a selected target company: visually disabled,
 *    aria-disabled, click intercepted, wrapped in a Radix tooltip explaining
 *    why and prompting the user to pick a company.
 *  - In view-all mode with a target company selected: behaves exactly like
 *    <Button> — submits as usual.
 *
 * The component never renders the destination link itself; pages keep their
 * existing onClick / navigate logic. We only intercept the click when the
 * guard is active.
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

export interface CreateActionButtonProps extends ButtonProps {
  /**
   * Override the tooltip message shown when the action is blocked.
   * Defaults to a translated "Select a target company first…" message.
   */
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
        return;
      }
      onClick?.(event);
    },
    [isBlocked, onClick],
  );

  const button = (
    <Button
      ref={ref}
      onClick={handleClick}
      disabled={disabled || isBlocked}
      aria-disabled={disabled || isBlocked}
      data-blocked={isBlocked || undefined}
      className={cn(className)}
      {...rest}
    >
      {children}
    </Button>
  );

  if (!isBlocked) return button;

  // Wrap disabled buttons in a span so the tooltip still receives pointer
  // events (disabled buttons swallow them in most browsers).
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex">
            {button}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center">
          {blockedTooltip ?? guard.reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default CreateActionButton;