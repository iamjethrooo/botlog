import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  decodeRolePermissions, removePermissionRole, selectPermissionRole, serializeRolePermissions
} from '@bbc-bot/api/src/commandPermissions';
import type { PermissionMode, PermissionRole, PermissionRule } from '@bbc-bot/api/src/commandPermissions';
import { trpc } from '../../utils/trpc';
import { RolePermissionPicker } from './RolePermissionPicker';

function draftSignature(payload: ReturnType<typeof serializeRolePermissions>) {
  return JSON.stringify([payload.type, payload.permissions.map(rule => rule.id).sort()]);
}

export default function CommandPermissionsEditor({ guildId, commandId, roles, permissions }: {
  guildId: string;
  commandId: string;
  roles: PermissionRole[];
  permissions: PermissionRule[];
}) {
  const [draft, setDraft] = useState(() => decodeRolePermissions(roles, permissions));
  const payload = serializeRolePermissions(draft);
  const signature = draftSignature(payload);
  const [savedSignature, setSavedSignature] = useState(signature);
  const isDirty = signature !== savedSignature;
  const exceptions = draft.mode === 'allow' ? draft.deniedRoles : draft.allowedRoles;
  const [openAllowModal, setOpenAllowModal] = useState(false);
  const [openDenyModal, setOpenDenyModal] = useState(false);
  const { mutate, isLoading } = trpc.command.editCommandPermissions.useMutation();
  const utils = trpc.useContext();

  function handleSave() {
    mutate({ guildId, commandId, ...payload }, {
      onSuccess: result => {
        setSavedSignature(signature);
        void utils.command.getCommandAndGuildChannels.invalidate({ guildId, commandId });
        void utils.guild.getRecentActivity.invalidate({ guildId });
        if (result.activityRecorded === false) {
          toast.warn('Permissions updated in Discord. The activity entry could not be saved.');
        } else {
          toast.success('Permissions updated!');
        }
      },
      onError: error => toast.error(error.message)
    });
  }

  return (
    <div className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Role permissions</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-amber-200" role="status">{isDirty ? 'Unsaved changes' : ''}</span>
          <button type="button" disabled={isLoading} onClick={handleSave}
            className="button button-primary">{isLoading ? 'Saving…' : 'Save permissions'}</button>
        </div>
      </div>
      <fieldset className="mt-5 grid gap-3" disabled={isLoading}>
        <legend className="sr-only">Default access</legend>
        {(['allow', 'deny'] as const).map(mode => {
          const exceptionMode: PermissionMode = mode === 'allow' ? 'deny' : 'allow';
          const open = exceptionMode === 'allow' ? openAllowModal : openDenyModal;
          const setOpen = exceptionMode === 'allow' ? setOpenAllowModal : setOpenDenyModal;
          return (
            <div className="rounded-xl border border-white/10 p-4" key={mode}>
              <label className="flex items-center gap-3 text-sm font-medium text-white">
                <input className="accent-indigo-300" type="radio" checked={draft.mode === mode} value={mode} name="role"
                  onChange={() => setDraft(state => ({ ...state, mode }))} />
                {mode === 'allow' ? 'Allow for everyone except' : 'Deny for everyone except'}
              </label>
              {draft.mode === mode ? (
                <RolePermissionPicker roles={exceptionMode === 'allow' ? draft.allowedRoles : draft.deniedRoles}
                  allRoles={roles} open={open}
                  onToggle={() => setOpen(state => !state)}
                  onRemove={id => setDraft(state => removePermissionRole(state, exceptionMode, id))}
                  onSelect={role => {
                    setDraft(state => selectPermissionRole(state, exceptionMode, role));
                    setOpen(false);
                  }} />
              ) : null}
            </div>
          );
        })}
      </fieldset>
      <section className="mt-5 rounded-xl border border-indigo-300/20 bg-indigo-300/5 p-4">
        <h3 className="font-semibold text-indigo-200">Role access preview</h3>
        <p className="muted mt-1">Default for @everyone: {draft.mode === 'allow' ? 'Allowed' : 'Denied'}</p>
        {exceptions.length ? (
          <div className="mt-3">
            <p className="text-sm font-medium text-slate-100">{draft.mode === 'allow' ? 'Denied roles' : 'Allowed roles'}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {exceptions.map(role => <li className="max-w-full break-words rounded-lg bg-white/5 px-2.5 py-1 text-sm text-slate-200" key={role.id}>@{role.name}</li>)}
            </ul>
          </div>
        ) : <p className="muted mt-1">No role exceptions.</p>}
        <p className="muted mt-3">Discord also applies its Administrator rules and any user or channel overrides.</p>
      </section>
    </div>
  );
}
