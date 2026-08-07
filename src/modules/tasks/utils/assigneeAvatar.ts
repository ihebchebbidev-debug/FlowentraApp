import type { User } from '@/types/users';

type AssigneePicSource = {
  assigneeId?: string | number | null;
  assigneeProfilePicUrl?: string | null;
  avatar?: string | null;
  profilePictureUrl?: string | null;
};

export function getProfilePicForUserId(
  assigneeId: string | number | undefined | null,
  usersMap?: Map<number, User>
): string | undefined {
  if (!assigneeId || !usersMap) return undefined;
  const id = typeof assigneeId === 'string' ? parseInt(assigneeId, 10) : assigneeId;
  if (Number.isNaN(id)) return undefined;
  return usersMap.get(id)?.profilePictureUrl || undefined;
}

export function resolveAssigneeProfilePic(
  task: AssigneePicSource,
  usersMap?: Map<number, User>
): string | undefined {
  const direct =
    task.assigneeProfilePicUrl ??
    task.avatar ??
    task.profilePictureUrl;
  if (direct) return direct || undefined;
  return getProfilePicForUserId(task.assigneeId, usersMap);
}

export function enrichTaskAssigneeAvatar<T extends AssigneePicSource>(
  task: T,
  usersMap?: Map<number, User>
): T & { assigneeProfilePicUrl?: string } {
  const assigneeProfilePicUrl = resolveAssigneeProfilePic(task, usersMap);
  if (!assigneeProfilePicUrl || task.assigneeProfilePicUrl === assigneeProfilePicUrl) {
    return task as T & { assigneeProfilePicUrl?: string };
  }
  return { ...task, assigneeProfilePicUrl };
}
