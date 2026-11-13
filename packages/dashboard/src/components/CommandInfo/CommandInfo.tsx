import { Switch } from '@headlessui/react';
import Link from 'next/link';
import { trpc } from '../../utils/trpc';
import { toast } from 'react-toastify';

const CommandInfo = ({
  name,
  description,
  guildId,
  commandId,
  disabled,
  toggleSupported
}: {
  name: string;
  description: string;
  guildId: string;
  commandId: string;
  disabled: boolean;
  toggleSupported: boolean;
}) => {
  const utils = trpc.useContext();
  const { mutate, isLoading } = trpc.command.toggleCommand.useMutation({
    onSuccess: (_, input) => Promise.all([
      utils.command.getDisabledCommands.invalidate({ guildId: input.guildId }),
      utils.guild.getGuildAndUser.invalidate({ id: input.guildId }),
      utils.guild.getRecentActivity.invalidate({ guildId: input.guildId })
    ]),
    onError: error => toast.error(error.message)
  });

  return (
    <article className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="break-words font-mono font-semibold text-white">/{name}</h2>
        <p className="muted mt-1 break-words">{description}</p>
        {toggleSupported ? (
          <p className={`mt-2 text-xs font-medium ${disabled ? 'text-slate-400' : 'text-emerald-300'}`}>
            {disabled ? 'Disabled' : 'Enabled'}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Link href={`/dashboard/${guildId}/commands/${commandId}`}>
          <a className="button" aria-label={`Edit /${name} permissions`}>Edit permissions</a>
        </Link>
        {toggleSupported ? <Switch
          disabled={isLoading}
          checked={!disabled}
          onChange={enabled => mutate({ guildId, commandId, status: !enabled })}
          className={`${
            disabled ? 'bg-slate-600' : 'bg-indigo-500'
          } relative inline-flex h-6 w-11 items-center rounded-full`}
        >
          {' '}
          <span className="sr-only">Enable /{name}</span>
          <span
            aria-hidden="true"
            className={`${
              disabled ? 'translate-x-1' : 'translate-x-6'
            } inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch> : <span className="text-sm text-slate-400" title="The bot does not check dashboard toggles for this command">
          Toggle unavailable
        </span>}
      </div>
    </article>
  );
};

export default CommandInfo;
