import { forwardRef, type ComponentProps } from 'react';
import { PermissionButton } from '@/components/permissions/PermissionButton';
import type { PermissionAction } from '@/types/permissions';

type BaseProps = Omit<ComponentProps<typeof PermissionButton>, 'module' | 'action'>;

/**
 * HR-scoped shortcut for `PermissionButton` — always gates on `module="hr"`.
 * Use for every mutating (create/update/delete/approve/…) CTA in the HR module
 * so the UI reflects the same permissions the backend enforces.
 * Forwards refs so it can be used as a Radix `asChild` trigger.
 */
export const HrPermissionButton = forwardRef<
  HTMLButtonElement,
  BaseProps & { action: PermissionAction }
>(function HrPermissionButton({ action, ...props }, ref) {
  return <PermissionButton ref={ref} module="hr" action={action} {...props} />;
});

export default HrPermissionButton;
