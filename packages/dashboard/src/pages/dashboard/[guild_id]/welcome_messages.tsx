import { useState, type FormEvent, type ReactElement } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/DashboardLayout';
import { requirePageSession } from '../../../shared/get-server-session';
import { trpc } from '../../../utils/trpc';
import type { NextPageWithLayout } from '../../_app';

type WelcomeSettings = {
  welcomeMessageEnabled: boolean;
  welcomeMessageChannel: string | null;
  welcomeMessage: string | null;
};

function WelcomeEditor({ guildId, settings, channels }: {
  guildId: string;
  settings: WelcomeSettings;
  channels: { id: string; name: string }[];
}) {
  const [enabled, setEnabled] = useState(settings.welcomeMessageEnabled);
  const [channelId, setChannelId] = useState(settings.welcomeMessageChannel ?? '');
  const [message, setMessage] = useState(settings.welcomeMessage ?? '');
  const utils = trpc.useContext();
  const save = trpc.guild.updateWelcomeSettings.useMutation({
    onSuccess: ({ settings: saved, channels: refreshedChannels }) => {
      utils.guild.getWelcomeSettings.setData({ guildId }, { settings: saved, channels: refreshedChannels });
      setChannelId(saved.welcomeMessageChannel ?? '');
      setMessage(saved.welcomeMessage ?? '');
      void utils.guild.getGuildAndUser.invalidate({ id: guildId });
      void utils.guild.getChannelFeatureHealth.invalidate({ guildId });
      toast.success('Welcome settings saved.');
    },
  });
  const validChannel = channels.some(channel => channel.id === channelId);
  const validMessage = message.trim().length > 0 && message.trim().length <= 2000;
  const preview = message.replace(/\{member\}/g, 'Alex').replace(/\{server\}/g, 'your server');

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate({ guildId, enabled, channelId: validChannel ? channelId : null, message: message.trim() });
  }

  return (
    <form className="surface p-5 sm:p-6" onSubmit={handleSave}>
      <fieldset disabled={save.isLoading} className="grid gap-5">
        <legend className="sr-only">Welcome message settings</legend>
        <label className="flex items-start gap-3">
          <input className="mt-1 h-4 w-4 accent-indigo-300" type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />
          <span>
            <span className="block font-semibold text-white">Send a welcome message</span>
            <span className="muted">Post when a new member joins this server.</span>
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-white">
          Destination channel
          <select className="field w-full" value={channelId} onChange={event => setChannelId(event.target.value)} required={enabled}>
            <option value="">Select a text channel</option>
            {channelId && !validChannel ? <option value={channelId}>Previously selected channel (unavailable)</option> : null}
            {channels.map(channel => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
          </select>
          <span className="muted font-normal">BBC Bot needs permission to view the channel and send messages there.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-white">
          Welcome message
          <textarea className="field w-full resize-y" rows={5} maxLength={2000} value={message}
            placeholder="Welcome {member} to {server}!" required={enabled} onChange={event => setMessage(event.target.value)} />
          <span className="muted font-normal">Use <code>{'{member}'}</code> for the new member’s display name and <code>{'{server}'}</code> for the server name.</span>
        </label>
        {message.trim() ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="eyebrow">Example preview</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-100">{preview}</p>
          </div>
        ) : null}
        {save.error ? <p className="text-sm text-rose-200" role="alert">{save.error.message}</p> : null}
        <button className="button button-primary justify-self-start" disabled={enabled && (!validChannel || !validMessage)} type="submit">
          {save.isLoading ? 'Saving…' : 'Save welcome settings'}
        </button>
      </fieldset>
    </form>
  );
}

const WelcomeMessagesPage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const guildId = typeof query.guild_id === 'string' ? query.guild_id : '';
  const { data, isLoading, error } = trpc.guild.getWelcomeSettings.useQuery({ guildId }, {
    enabled: Boolean(guildId),
    refetchOnWindowFocus: false
  });

  return (
    <section>
      <p className="eyebrow">Server features</p>
      <h1 className="page-title mt-2">Welcome Messages</h1>
      <p className="muted mt-3 mb-6">Greet new members in a channel of your choice.</p>
      {isLoading ? <p className="status-panel" role="status">Loading welcome settings…</p> : error || !data ? (
        <p className="status-panel" role="alert">{error?.message ?? 'Welcome settings are unavailable.'}</p>
      ) : <WelcomeEditor key={guildId} guildId={guildId} settings={data.settings} channels={data.channels} />}
    </section>
  );
};

WelcomeMessagesPage.getLayout = (page: ReactElement) => <DashboardLayout>{page}</DashboardLayout>;
export const getServerSideProps = requirePageSession;
export default WelcomeMessagesPage;
