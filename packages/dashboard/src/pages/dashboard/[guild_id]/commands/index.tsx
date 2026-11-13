import { useRouter } from 'next/router';
import { useState, type ReactElement } from 'react';
import CommandInfo from '../../../../components/CommandInfo';
import DashboardLayout from '../../../../components/DashboardLayout';
import { requirePageSession } from '../../../../shared/get-server-session';
import { trpc } from '../../../../utils/trpc';
import { NextPageWithLayout } from '../../../_app';

const CommandsDashboardPage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const guildId = typeof query.guild_id === 'string' ? query.guild_id : '';

  const { data: guildData, isLoading, error } = trpc.guild.getGuildAndUser.useQuery(
    { id: guildId },
    { enabled: Boolean(guildId), refetchOnWindowFocus: false }
  );

  if (isLoading) {
    return <p className="status-panel" role="status">Loading server…</p>;
  }

  if (error || !guildData?.guild) {
    return <div className="status-panel" role="alert">{error?.message ?? 'Guild unavailable'}</div>;
  }

  return <CommandsDashboardPageComponent guildId={guildId} />;
};

const CommandsDashboardPageComponent = ({
  guildId
}: {
  guildId: string;
}): ReactElement => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { data, isLoading, error: commandsError } = trpc.command.getCommands.useQuery({
    guildId
  });

  const { data: disabledCommandsData, isLoading: disabledCommandsLoading, error: disabledError } =
    trpc.command.getDisabledCommands.useQuery({ guildId });
  const disabledIds = new Set(disabledCommandsData?.disabledCommands);
  const searchTerm = search.trim().toLowerCase().replace(/^\//, '');
  const visibleCommands = data?.commands.filter(command => {
    if (!command.name.toLowerCase().includes(searchTerm)) return false;
    if (filter === 'all') return true;
    if (filter === 'unavailable') return !command.toggleSupported;
    if (!command.toggleSupported) return false;
    return filter === 'toggleable' || disabledIds.has(command.id) === (filter === 'disabled');
  }) ?? [];

  return (
    <div>
      <p className="eyebrow">Server settings</p>
      <h1 className="page-title mt-2">Commands</h1>
      <p className="muted mt-3 mb-6">Set command availability and edit role permissions.</p>
      {commandsError || disabledError ? (
        <p className="status-panel" role="alert">{(commandsError || disabledError)?.message}</p>
      ) : data?.commands &&
      !isLoading &&
      disabledCommandsData?.disabledCommands &&
      !disabledCommandsLoading ? (
        <div className="grid gap-3">
          <div className="surface grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="grid gap-1.5 text-sm text-slate-300">
              Search commands
              <input className="field" type="search" placeholder="Search by name" value={search} onChange={event => setSearch(event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm text-slate-300">
              Availability
              <select className="field" value={filter} onChange={event => setFilter(event.target.value)}>
                <option value="all">All commands</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
                <option value="toggleable">Supports toggling</option>
                <option value="unavailable">Toggle unavailable</option>
              </select>
            </label>
          </div>
          <p className="muted" role="status">{visibleCommands.length} of {data.commands.length} commands</p>
          {visibleCommands.map(command => (
            <CommandInfo
              key={command.id}
              guildId={guildId}
              commandId={command.id}
              disabled={disabledIds.has(command.id)}
              name={command.name}
              description={command.description}
              toggleSupported={command.toggleSupported}
            />
          ))}
          {visibleCommands.length === 0 ? (
            <p className="status-panel">{data.commands.length === 0 ? 'No commands are registered for this server.' : 'No commands match your search and filter.'}</p>
          ) : null}
        </div>
      ) : (
        <p className="status-panel" role="status">Loading commands…</p>
      )}
    </div>
  );
};

CommandsDashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export const getServerSideProps = requirePageSession;

export default CommandsDashboardPage;
