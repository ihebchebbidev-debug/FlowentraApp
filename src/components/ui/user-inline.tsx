import { UserAvatar } from '@/components/ui/user-avatar';
import { useUserProfile } from '@/lib/userProfileCache';
import { cn } from '@/lib/utils';

interface UserInlineProps {
  /** Numeric user id (admin or regular) that we can resolve against the API. */
  userId?: string | number | null;
  /** Fallback / override name if already known from the parent payload. */
  name?: string | null;
  /** Fallback / override profile picture URL. */
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  /** When false, only the avatar is rendered. */
  showName?: boolean;
  /** Optional label prefix like "by" or a small icon slot. */
  prefix?: React.ReactNode;
}

/**
 * Inline user chip: small avatar + name. Resolves the profile picture and
 * display name from the shared user cache when a numeric userId is provided.
 */
export function UserInline({
  userId,
  name,
  src,
  size = 'xs',
  className,
  showName = true,
  prefix,
}: UserInlineProps) {
  const profile = useUserProfile(userId);
  const displayName = name || profile?.name || (userId != null ? String(userId) : '');
  const picture = src || profile?.picture;
  const seed = userId ?? displayName ?? 'user';

  return (
    <span className={cn('inline-flex items-center gap-1.5 min-w-0', className)}>
      {prefix}
      <UserAvatar size={size} src={picture} name={displayName} seed={seed} />
      {showName && <span className="truncate">{displayName}</span>}
    </span>
  );
}
