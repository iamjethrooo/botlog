import type { PermissionRole } from '@bbc-bot/api/src/commandPermissions';

export function RolePermissionPicker({ roles, allRoles, open, onToggle, onSelect, onRemove }: {
  roles: PermissionRole[];
  allRoles: PermissionRole[];
  open: boolean;
  onToggle: () => void;
  onSelect: (role: PermissionRole) => void;
  onRemove: (id: string) => void;
}) {
  const selectedIds = new Set(roles.map(role => role.id));
  const availableRoles = allRoles.filter(role => !selectedIds.has(role.id) && role.name !== '@everyone');

  return (
    <div className="mt-4 grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {roles.filter(role => role.name !== '@everyone').map(role => (
          <button
            key={role.id}
            type="button"
            onClick={() => onRemove(role.id)}
            aria-label={`Remove ${role.name}`}
            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-slate-100 hover:bg-white/10"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" aria-hidden="true"
              style={{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#94a3b8' }} />
            <span className="min-w-0 break-words">@{role.name}</span>
            <span className="text-slate-300" aria-hidden="true">×</span>
          </button>
        ))}
        <button type="button" onClick={onToggle} aria-expanded={open} className="button">
          {open ? 'Close role list' : '+ Add role'}
        </button>
      </div>
      {open ? (
        <div className="max-h-56 overflow-auto rounded-lg border border-white/10 bg-[#10121c] p-2">
          {availableRoles.length ? availableRoles.map(role => (
            <button type="button" onClick={() => onSelect(role)}
              className="block w-full break-words rounded-md px-3 py-2 text-left text-sm text-slate-100 hover:bg-white/10 focus-visible:outline-offset-[-2px]" key={role.id}>
              {role.name}
            </button>
          )) : <p className="muted px-3 py-2">No more roles to add.</p>}
        </div>
      ) : null}
    </div>
  );
}
