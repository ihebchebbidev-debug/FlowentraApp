
# User Groups — Implementation Plan

A new feature under **Settings › Administration** to create groups, edit them, and assign users to them. It will mirror the existing **Roles** pattern end-to-end (backend module, tenant-scoped tables, junction table, REST API, React CRUD page + dialogs, i18n in EN/FR). The frontend stub already exists (`SettingsPage.tsx` has a `userGroups` placeholder + `nav.userGroups` key, and the Administration workspace sidebar already links to it) — we replace the placeholder with a real implementation.

## Scope

- Groups CRUD (name, description, active flag) scoped by `TenantId`.
- Assign / remove users to a group (many-to-many).
- List a group's members; list a user's groups.
- Permission-gated in Settings (superadmin + `userGroups.read/write/delete`).
- Full EN + FR translations under the existing `settings` namespace (same as Roles).

Out of scope (can come later): group → role mapping, group → permission mapping, group → skill mapping. The schema will leave room for these but the UI ships with users-only.

## Backend

### 1. Migration — `Backend/Neon/38_user_groups.sql` (next free number)

```sql
CREATE TABLE IF NOT EXISTS "UserGroups" (
  "Id"          SERIAL PRIMARY KEY,
  "TenantId"    INTEGER NOT NULL,
  "Name"        VARCHAR(100) NOT NULL,
  "Description" VARCHAR(500),
  "IsActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "IsDeleted"   BOOLEAN NOT NULL DEFAULT FALSE,
  "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "CreatedBy"   VARCHAR(100),
  "UpdatedAt"   TIMESTAMPTZ,
  "ModifiedBy"  VARCHAR(100),
  UNIQUE ("TenantId", "Name")
);

CREATE TABLE IF NOT EXISTS "UserGroupMembers" (
  "Id"          SERIAL PRIMARY KEY,
  "TenantId"    INTEGER NOT NULL,
  "GroupId"     INTEGER NOT NULL,
  "UserId"      INTEGER NOT NULL,
  "IsActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "AssignedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "AssignedBy"  VARCHAR(100),
  FOREIGN KEY ("GroupId") REFERENCES "UserGroups"("Id") ON DELETE CASCADE,
  FOREIGN KEY ("UserId")  REFERENCES "Users"("Id")      ON DELETE CASCADE,
  UNIQUE ("GroupId", "UserId")
);

CREATE INDEX IF NOT EXISTS "idx_usergroups_tenant"        ON "UserGroups"("TenantId");
CREATE INDEX IF NOT EXISTS "idx_usergroupmembers_group"   ON "UserGroupMembers"("GroupId");
CREATE INDEX IF NOT EXISTS "idx_usergroupmembers_user"    ON "UserGroupMembers"("UserId");
CREATE INDEX IF NOT EXISTS "idx_usergroupmembers_tenant"  ON "UserGroupMembers"("TenantId");
```

Before writing this file we confirm the current max `NN_` number in `Backend/Neon/` and pick the next one.

### 2. New backend module — `Backend/Modules/UserGroups/`

Mirrors `Backend/Modules/Roles/` layout exactly:

```text
Backend/Modules/UserGroups/
├── Controllers/UserGroupsController.cs        // [ApiController][Route("api/[controller]")][Authorize]
├── Models/UserGroup.cs                        // : ITenantEntity, audit fields
├── Models/UserGroupMember.cs                  // : ITenantEntity, junction
├── DTOs/UserGroupDto.cs
├── DTOs/CreateUserGroupRequest.cs
├── DTOs/UpdateUserGroupRequest.cs
├── DTOs/AssignUsersToGroupRequest.cs          // { userIds: int[] }
├── Configurations/UserGroupConfiguration.cs   // IEntityConfiguration, unique(TenantId,Name)
├── Configurations/UserGroupMemberConfiguration.cs
├── Services/IUserGroupService.cs
└── Services/UserGroupService.cs
```

Endpoints (matches `RolesController` shape and route-ordering rule):

```text
GET    /api/UserGroups                         -> list (with memberCount)
GET    /api/UserGroups/{id}                    -> detail
POST   /api/UserGroups                         -> create
PUT    /api/UserGroups/{id}                    -> update
DELETE /api/UserGroups/{id}                    -> soft-delete

GET    /api/UserGroups/{id}/members            -> list members (User summaries)
POST   /api/UserGroups/{id}/members            -> body: { userIds:int[] } bulk assign
DELETE /api/UserGroups/{groupId}/members/{userId}
GET    /api/UserGroups/user/{userId}           -> groups a user belongs to
```

DI registration in `Backend/Program.cs` next to the existing `IRoleService` line:

```csharp
services.AddScoped<IUserGroupService, UserGroupService>();
```

EF entity configs picked up by the existing `IEntityConfiguration` scan (same as `RoleConfiguration`/`UserRoleConfiguration`). `TenantId` is set by the current tenant interceptor (same mechanism Roles/UserRoles rely on).

## Frontend

### 3. Types — `src/types/users.ts` (append)

```ts
export interface UserGroup {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt?: string;
}
export interface CreateUserGroupRequest { name: string; description?: string }
export interface UpdateUserGroupRequest { name: string; description?: string; isActive?: boolean }
```

### 4. API client — `src/services/api/userGroupsApi.ts`

Copy `rolesApi.ts` verbatim, swap URLs to `/api/UserGroups`, add `getMembers(id)`, `assignUsers(id, userIds[])`, `removeUser(groupId, userId)`, `getUserGroups(userId)`. Re-export via `src/services/userGroupsApi.ts` for parity with `src/services/rolesApi.ts`.

### 5. UI components — under `src/modules/settings/components/`

- `UserGroupManagement.tsx` — page component (mirrors `RoleManagement.tsx`): list card, search, "Create group" button, table of groups with member count, edit/delete actions, "Manage members" action opening the assignment modal.
- `CreateUserGroupModal.tsx` — mirrors `CreateRoleModal.tsx` (name + description form, toast, `emitDataEvent('userGroups:changed')`).
- `EditUserGroupModal.tsx` — mirrors `EditRoleModal.tsx`.
- `GroupMembersModal.tsx` — mirrors `RoleAssignmentModal.tsx` but user→group: two lists (available users / current members), add/remove, bulk save via `POST /members`.

### 6. Wire into Settings — `src/modules/settings/pages/SettingsPage.tsx`

- Add `canViewUserGroups = isMainAdmin || hasPermission('userGroups','read')` next to `canViewUsers/canViewRoles`.
- Flip existing nav item `{ id:'userGroups', ..., visible: canViewUserGroups }`.
- Replace `renderUserGroupsPlaceholder()` with a `renderUserGroupsContent()` that renders `<UserGroupManagement />` — same structure as `renderRolesContent()`.
- `adminHeaderMap['userGroups']` keys are already there (`nav.userGroups`, `userGroups.description`) — reuse.

The existing Administration workspace sidebar entry (`workspaces.config.ts` → `/dashboard/settings?section=userGroups`) needs no change; it already points at this section.

### 7. Permissions

Register a new permission module string `userGroups` alongside `users` / `roles` (in whatever `PERMISSION_MODULES` list the app uses on both FE and BE) with actions `read / write / delete`. Superadmin gets it by default via existing seeder logic. If the seeder is code-side we'll add a one-line entry; if it's SQL we'll append `INSERT`s in the same migration.

### 8. Data-event bus

Emit `userGroups:changed` after any create/update/delete/assignment mutation so tables refetch (matches `roles:changed` usage).

## i18n

All keys live under the existing `settings` namespace (same as Roles). Add to `src/modules/settings/locale/en.json` and `fr.json`:

```text
nav.userGroups                              // already present, keep
userGroups.title, userGroups.description
userGroups.create.{title,desc,nameLabel,namePlaceholder,
                   descriptionLabel,descriptionPlaceholder,
                   create,creating,cancel,
                   createSuccessTitle,createSuccess,
                   createFailedTitle,createFailed,nameRequired}
userGroups.edit.{title,desc,save,saving,
                 updateSuccess,updateFailed}
userGroups.delete.{confirmTitle,confirmDesc,deleteSuccess,deleteFailed}
userGroups.table.{name,description,members,status,actions,noGroupsPrompt}
userGroups.members.{title,desc,available,current,add,remove,save,
                    saveSuccess,saveFailed}
userGroups.status.{active,inactive}
```

FR is a straight translation pass (same keys, French copy).

Also add `workspace.modules.userGroups` in the workspace/i18n namespace already referenced by `workspaces.config.ts:183` for both EN and FR.

## Architecture

```text
Frontend (React)                     Backend (.NET)                Postgres
──────────────────                   ─────────────────             ─────────
SettingsPage.tsx
  └─ UserGroupManagement.tsx  ─────► UserGroupsController ───────► UserGroups
       ├─ CreateUserGroupModal        │   ├─ IUserGroupService     UserGroupMembers
       ├─ EditUserGroupModal          │   └─ EF + TenantInterceptor    │
       └─ GroupMembersModal           └─ AuthN via [Authorize]          │
              │                                                        │
   userGroupsApi.ts ── GET/POST/PUT/DELETE /api/UserGroups ─────────────┘
```

## Verification

1. `dotnet build` for backend.
2. Run migration `38_user_groups.sql` in dev DB; confirm tables and indexes.
3. Frontend typecheck (`tsgo`) — must be clean.
4. Manual: Settings › Administration › User groups → create, edit, add members, remove members, delete; deep-link via `/dashboard/settings?section=userGroups`.
5. Language switch to FR: all labels/toasts translated (no raw keys visible).
6. Permission check: non-admin user without `userGroups.read` sees the section hidden.

## Open items to confirm before coding

- Exact next free number in `Backend/Neon/` (probably `38_`).
- Whether the tenant scoping is applied via EF global filter/interceptor (assumed yes, same as Roles).
- Whether the permission catalogue is TS-only or also needs a SQL seed row.

I'll resolve these three during the first implementation pass and adjust the file names/seeder accordingly.
