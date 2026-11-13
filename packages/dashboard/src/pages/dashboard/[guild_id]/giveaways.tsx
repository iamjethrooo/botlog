import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactElement } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { requirePageSession } from '../../../shared/get-server-session';
import { trpc } from '../../../utils/trpc';
import type { NextPageWithLayout } from '../../_app';

const actions = [
  { name: 'giveaway', title: 'Start a giveaway', description: 'Choose a prize, end time, and optional entry fee in Discord.' },
  { name: 'reroll', title: 'Reroll a giveaway', description: 'Choose new winners in Discord using the giveaway message ID.' },
];

const GiveawaysPage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const guildId = typeof query.guild_id === 'string' ? query.guild_id : '';
  const { data, isLoading, error } = trpc.command.getCommands.useQuery({ guildId }, { enabled: Boolean(guildId) });

  return (
    <section>
      <p className="eyebrow">Server features</p>
      <h1 className="page-title mt-2">Giveaways</h1>
      <p className="muted mt-3 mb-6">Manage which roles can run giveaway commands. Run those commands in Discord.</p>
      <div className="surface mb-4 p-5">
        <h2 className="font-semibold text-white">Giveaway channel</h2>
        <p className="muted mt-1">Ask the bot operator to confirm the configured giveaway channel, then run <code>/giveaway</code> there. Open the command’s permissions below to choose which roles can host.</p>
      </div>
      {isLoading ? <p className="status-panel" role="status">Checking giveaway commands…</p> : error ? (
        <p className="status-panel" role="alert">{error.message}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {actions.map(action => {
            const command = data?.commands.find(command => command.type === 1 && command.name === action.name);
            return (
              <article className="surface flex flex-col p-5" key={action.name}>
                <p className="font-mono text-sm font-semibold text-indigo-200">/{action.name}</p>
                <h2 className="mt-2 font-semibold text-white">{action.title}</h2>
                <p className="muted mt-1 mb-4">{action.description}</p>
                {command ? (
                  <Link href={`/dashboard/${guildId}/commands/${command.id}`}>
                    <a className="button mt-auto self-start" aria-label={`Edit /${action.name} permissions`}>Edit permissions</a>
                  </Link>
                ) : <p className="muted mt-auto">This command isn’t registered for this server.</p>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

GiveawaysPage.getLayout = (page: ReactElement) => <DashboardLayout>{page}</DashboardLayout>;
export const getServerSideProps = requirePageSession;
export default GiveawaysPage;
