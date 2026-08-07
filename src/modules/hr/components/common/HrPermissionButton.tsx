import { PermissionButton } from '@/components/permissions/PermissionButton';
import type { PermissionAction } from '@/types/permissions';
import type { ComponentProps } from 'react';

type BaseProps = Omit<ComponentProps<typeof PermissionButton>, 'module' | 'action'>;

/**
 * HR-scoped shortcut for `PermissionButton` — always gates on `module="hr"`.
 * Use for every mutating (create/update/delete/approve/…) CTA in the HR module
 * so the UI reflects the same permissions the backend enforces.
 */
export function HrPermissionButton({
  action,
  ...props
}: BaseProps & { action: PermissionAction }) {
  return <PermissionButton module="hr" action={action} {...props} />;
}

export default HrPermissionButton;