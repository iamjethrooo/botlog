import type { DashboardActivityKind, Prisma } from '@prisma/client';
import { trpc } from '../../utils/trpc';

const dateTime = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
const labels: Record<DashboardActivityKind, string> = {
  COMMAND_TOGGLE: 'Command availability changed',
  COMMAND_PERMISSIONS: 'Role permissions changed',
  VOICE_HUB: 'Voice hub changed',
};

function isSnapshot(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function describeSnapshot(kind: DashboardActivityKind, value: Prisma.JsonValue, guildId: string): string[] {
  if (!isSnapshot(value)) return ['Details unavailable'];

  switch (kind) {
    case 'COMMAND_TOGGLE':
      return typeof value.enabled === 'boolean' ? [value.enabled ? 'Enabled' : 'Disabled'] : ['Details unavailable'];
    case 'COMMAND_PERMISSIONS': {
      const { roles } = value;
      if (!Array.isArray(roles)) return ['Details unavailable'];
      if (!roles.length) return ['No explicit role rules'];
      return roles.map(role => {
        if (!isSnapshot(role) || typeof role.id !== 'string' || typeof role.allowed !== 'boolean') {
          return 'Role details unavailable';
        }
        const name = role.id === guildId ? '@everyone' : `Role ${role.id}`;
        return `${name}: ${role.allowed ? 'Allowed' : 'Denied'}`;
      });
    }
    case 'VOICE_HUB': {
      const { hub, hubChannel } = value;
      if ((hub !== null && typeof hub !== 'string') ||
        (hubChannel !== null && typeof hubChannel !== 'string')) return ['Details unavailable'];
      const lines = [hub && hubChannel ? 'Enabled' : hub || hubChannel ? 'Setup incomplete' : 'Disabled'];
      if (hubChannel) lines.push(`Voice channel: ${hubChannel}`);
      if (hub) lines.push(`Category: ${hub}`);
      return lines;
    }
  }
}

export default function ServerActivity({ guildId }: { guildId: string }) {
  const { data, error, isLoading, isFetching, refetch } = trpc.guild.getRecentActivity.useQuery(
    { guildId },
    { refetchOnWindowFocus: false, retry: false }
  );

  return (
    <section className="surface mt-6 p-5 sm:p-6" aria-labelledby="activity-heading">
      <h2 className="text-lg font-semibold text-white" id="activity-heading">Recent activity</h2>
      <p className="muted mt-1">The latest 25 changes recorded through the dashboard.</p>
      {isLoading ? (
        <p className="muted mt-4" role="status">Loading activity…</p>
      ) : error ? (
        <div className="mt-4">
          <p className="muted" role="alert">Couldn’t load activity for this server.</p>
          <button className="button mt-3" type="button" disabled={isFetching} onClick={() => void refetch()}>Try again</button>
        </div>
      ) : data?.length ? (
        <ol className="mt-4 divide-y divide-white/10 border-t border-white/10">
          {data.map(event => (
            <li className="py-3" key={event.id}>
              <details>
                <summary className="cursor-pointer rounded-md py-1 text-sm font-semibold text-indigo-200">
                  {labels[event.kind]}{event.commandName ? ` · ${event.commandName}` : ''}
                  <span className="muted mt-1 block break-words font-normal">
                    <span title={event.actorDiscordId}>{event.actorName || `Discord user ${event.actorDiscordId}`}</span>
                    {' · '}
                    <time dateTime={event.createdAt.toISOString()}>{dateTime.format(event.createdAt)} UTC</time>
                  </span>
                </summary>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {([['Before', event.before], ['After', event.after]] as const).map(([label, snapshot]) => (
                    <div className="min-w-0 rounded-xl bg-white/5 p-3" key={label}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-300">{label}</dt>
                      <dd className="mt-1">
                        <ul className="space-y-1 break-words text-sm text-slate-100">
                          {describeSnapshot(event.kind, snapshot, guildId).map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}
                        </ul>
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            </li>
          ))}
        </ol>
      ) : <p className="muted mt-4">No dashboard changes have been recorded yet.</p>}
    </section>
  );
}
