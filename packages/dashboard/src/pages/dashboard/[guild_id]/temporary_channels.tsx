import { useRouter } from 'next/router';
import type { ReactElement } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { trpc } from '../../../utils/trpc';
import type { NextPageWithLayout } from '../../_app';
import { toast } from 'react-toastify';
import { requirePageSession } from '../../../shared/get-server-session';

const TemporaryChannelsDashboardPage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const guildId = typeof query.guild_id === 'string' ? query.guild_id : '';
  const { data, isLoading, error } = trpc.guild.getGuildAndUser.useQuery(
    { id: guildId },
    { enabled: Boolean(guildId) }
  );
  const utils = trpc.useContext();
  const refreshSettings = () => Promise.all([
    utils.guild.getGuildAndUser.invalidate({ id: guildId }),
    utils.guild.getRecentActivity.invalidate({ guildId }),
    utils.guild.getChannelFeatureHealth.invalidate({ guildId })
  ]);
  const createHub = trpc.hub.create.useMutation({
    onSuccess: async () => {
      await refreshSettings();
      toast.success('Temporary channels enabled');
    },
    onError: error => toast.error(error.message),
  });
  const deleteHub = trpc.hub.delete.useMutation({
    onSuccess: async () => {
      await refreshSettings();
      toast.success('Temporary channels disabled');
    },
    onError: error => toast.error(error.message),
  });

  if (isLoading) return <p className="status-panel" role="status">Loading settings…</p>;
  if (error || !data?.guild) {
    return <p className="status-panel" role="alert">{error?.message ?? 'Server settings are unavailable.'}</p>;
  }

  const { hub, hubChannel } = data.guild;
  const enabled = Boolean(hub && hubChannel);
  const hasHub = Boolean(hub || hubChannel);
  const removalDetails = hub && hubChannel ? 'the configured voice channel and its category' :
    hubChannel ? 'the configured voice channel' : 'the configured category';

  function disableHub() {
    if (window.confirm(`Disable the voice hub? This deletes ${removalDetails} from Discord.`)) {
      deleteHub.mutate({ guildId });
    }
  }

  return (
    <div>
      <p className="eyebrow">Server settings</p>
      <h1 className="page-title mt-2">Temporary channels</h1>
      <p className="muted mt-3 mb-6">Let members create their own voice channels by joining a voice hub.</p>
      <section className="surface flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="font-semibold text-white">Voice hub</h2>
          <p className={`mt-2 text-sm font-medium ${enabled ? 'text-emerald-300' : 'text-slate-300'}`}>
            {enabled ? 'Enabled' : hasHub ? 'Setup incomplete' : 'Disabled'}
          </p>
          {hubChannel ? (
            <a className="mt-3 inline-block text-sm text-indigo-200 underline" href={`https://discord.com/channels/${guildId}/${hubChannel}`} target="_blank" rel="noreferrer">
              Open configured channel in Discord <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          {hasHub ? <p className="muted mt-2">Disabling the hub deletes {removalDetails} from Discord.</p> : null}
        </div>
        {hasHub ? (
          <button className="button button-danger" disabled={createHub.isLoading || deleteHub.isLoading} onClick={disableHub} type="button">
            {deleteHub.isLoading ? 'Disabling…' : 'Disable hub'}
          </button>
        ) : (
          <button className="button button-primary" disabled={createHub.isLoading || deleteHub.isLoading}
            onClick={() => createHub.mutate({ guildId, name: 'Join To Create' })} type="button">
            {createHub.isLoading ? 'Enabling…' : 'Enable hub'}
          </button>
        )}
      </section>
    </div>
  );
};

TemporaryChannelsDashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export const getServerSideProps = requirePageSession;

export default TemporaryChannelsDashboardPage;
