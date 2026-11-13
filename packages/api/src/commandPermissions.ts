// Shared by the role editor and API payload boundary. Keep the transport's numeric
// type contract: this extraction does not tighten the existing tRPC validator.
export type PermissionRule = { id: string; type: number; permission: boolean };
export type PermissionRole = { id: string; name: string; color: number };
export type PermissionMode = 'allow' | 'deny';
export type RolePermissionDraft = {
  allowedRoles: PermissionRole[];
  deniedRoles: PermissionRole[];
  mode: PermissionMode;
};

export function decodeRolePermissions(
  roles: readonly PermissionRole[], permissions: readonly PermissionRule[]
): RolePermissionDraft {
  const everyone = (id: string) => roles.some(role => role.id === id && role.name === '@everyone');
  const everyoneAllowed = permissions.find(rule => rule.type === 1 && everyone(rule.id))?.permission ?? true;
  const matchingRoles = (allowed: boolean) => permissions
    .filter(rule => rule.type === 1 && rule.permission === allowed && !everyone(rule.id))
    .map(rule => roles.find(role => role.id === rule.id))
    .filter((role): role is PermissionRole => Boolean(role))
    .map(({ id, name, color }) => ({ id, name, color }));
  return { allowedRoles: matchingRoles(true), deniedRoles: matchingRoles(false), mode: everyoneAllowed ? 'allow' : 'deny' };
}

export function selectPermissionRole(
  draft: RolePermissionDraft, mode: PermissionMode, role: PermissionRole
): RolePermissionDraft {
  const { id, name, color } = role;
  return {
    ...draft,
    allowedRoles: mode === 'allow' ? [...draft.allowedRoles, { id, name, color }] : draft.allowedRoles.filter(r => r.id !== id),
    deniedRoles: mode === 'deny' ? [...draft.deniedRoles, { id, name, color }] : draft.deniedRoles.filter(r => r.id !== id)
  };
}

export function removePermissionRole(
  draft: RolePermissionDraft, mode: PermissionMode, id: string
): RolePermissionDraft {
  return mode === 'allow'
    ? { ...draft, allowedRoles: draft.allowedRoles.filter(role => role.id !== id) }
    : { ...draft, deniedRoles: draft.deniedRoles.filter(role => role.id !== id) };
}

export function serializeRolePermissions(draft: RolePermissionDraft) {
  // The editor sends only exceptions to the selected @everyone default.
  return {
    permissions: (draft.mode === 'allow' ? draft.deniedRoles : draft.allowedRoles)
      .map(role => ({ id: role.id, type: 1, permission: draft.mode === 'deny' })),
    type: draft.mode
  };
}

export function commandPermissionPayload(
  guildId: string, mode: string, permissions: readonly PermissionRule[], current: readonly PermissionRule[]
) {
  // Preserve input order and all non-role overrides, including types the editor
  // cannot edit. Do not silently normalize the API's existing accepted inputs.
  return { permissions: [
    { id: guildId, type: 1, permission: mode === 'allow' },
    ...permissions,
    ...current.filter(rule => rule.type !== 1)
  ] };
}
