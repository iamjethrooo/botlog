import { useRouter } from 'next/router';
import type { ReactElement, ReactNode } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import ServerActivity from '../../../components/ServerActivity/ServerActivity';
import { requirePageSession } from '../../../shared/get-server-session';
import { trpc } from '../../../utils/trpc';
import type { NextPageWithLayout } from '../../_app';
import Link from 'next/link';
import type { FeatureHealth } from '@bbc-bot/api/src/guildFeatureHealth';

const badgeStyles = {
  ready: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  attention: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  neutral: 'border-white/10 bg-white/5 text-slate-200'
};

const channelStatuses = {
  healthy: { status: 'Healthy', tone: 'ready' },
  attention: { status: 'Needs attention', tone: 'attention' },
  disabled: { status: 'Disabled', tone: 'neutral' },
  unavailable: { status: 'Check unavailable', tone: 'attention' }
} as const;

function channelCardStatus(health: FeatureHealth | undefined, hasSettings: boolean, checkFailed: boolean) {
  if (!hasSettings) return { status: 'Setup pending', tone: 'neutral' as const, detail: 'Waiting for server settings.' };
  if (checkFailed) return { status: 'Check unavailable', tone: 'attention' as const, detail: 'Couldn’t verify the Discord setup.', nextStep: 'Check again in a moment.' };
  if (!health) return { status: 'Checking…', tone: 'neutral' as const, detail: 'Checking saved settings and Discord.' };
  return { ...channelStatuses[health.state], detail: health.detail, nextStep: health.nextStep };
}

function FeatureCard({ title, description, status, tone, href, icon, detail, nextStep }: {
  title: string;
  description: string;
  status: string;
  tone: keyof typeof badgeStyles;
  href?: string;
  icon: ReactNode;
  detail: string;
  nextStep?: string;
}) {
  return (
    <article className="surface flex h-full flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-indigo-300/20 bg-indigo-300/10 text-indigo-200" aria-hidden="true">
          {icon}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStyles[tone]}`}>{status}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="muted mt-2">{description}</p>
      <div className="mb-4 mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-medium text-slate-200">{detail}</p>
        {nextStep ? <p className="muted mt-1">{nextStep}</p> : null}
      </div>
      <div className="mt-auto flex justify-end">
        {href ? (
          <Link href={href}><a className="button" aria-label={`Configure ${title}`}>Configure <span aria-hidden="true">→</span></a></Link>
        ) : <button className="button" type="button" disabled>Configure</button>}
      </div>
    </article>
  );
}

const GuildIndexPage: NextPageWithLayout = () => {
  const { query } = useRouter();
  const guildId = typeof query.guild_id === 'string' ? query.guild_id : '';
  const { data: servers } = trpc.guild.getAll.useQuery();
  const server = servers?.apiGuilds.find(guild => guild.id === guildId);
  const utils = trpc.useContext();

  const { data, isLoading, isFetching, error, refetch } = trpc.guild.getGuildAndUser.useQuery(
    { id: guildId },
    { enabled: Boolean(guildId) }
  );
  const settings = data?.guild;
  const commands = trpc.command.getCommands.useQuery(
    { guildId },
    { enabled: Boolean(settings) }
  );
  const channelHealth = trpc.guild.getChannelFeatureHealth.useQuery(
    { guildId },
    { enabled: Boolean(settings), retry: false, refetchOnWindowFocus: false }
  );

  if (isLoading) {
    return <p className="status-panel" role="status">Loading server…</p>;
  }

  if (error) {
    return <div className="status-panel" role="alert">{error.message}</div>;
  }

  const disabledIds = new Set(settings?.disabledCommands);
  const registeredCommands = commands.error ? undefined : commands.data?.commands;
  const disabledCount = registeredCommands?.filter(command => command.toggleSupported && disabledIds.has(command.id)).length ?? 0;
  const commandStatus = !settings ? 'Setup pending' : commands.error ? 'Unavailable' :
    !registeredCommands ? 'Checking…' : registeredCommands.length ? 'Registered' : 'Needs attention';
  const commandDetail = registeredCommands ? `${registeredCommands.length} registered · ${disabledCount} disabled` :
    commands.error ? 'Couldn’t check command status' : 'Command status pending';
  const missingGiveawayCommands = ['giveaway', 'reroll'].filter(name =>
    !registeredCommands?.some(command => command.type === 1 && command.name === name));
  const giveawayStatus = !settings ? 'Setup pending' : commands.error ? 'Unavailable' :
    !registeredCommands ? 'Checking…' : missingGiveawayCommands.length ? 'Needs attention' : 'Commands ready';
  const giveawayDetail = !registeredCommands ? commandDetail : missingGiveawayCommands.length ?
    `Missing: ${missingGiveawayCommands.map(name => `/${name}`).join(', ')}` : '/giveaway and /reroll are registered.';
  const checksRunning = isFetching || commands.isFetching || channelHealth.isFetching;

  return (
    <section>
      <header className="hero-grid rounded-3xl border border-indigo-300/20 bg-indigo-950/40 p-5 sm:p-8">
        <p className="eyebrow">Server overview</p>
        <h1 className="page-title mt-2 break-words">{server?.name ?? settings?.name ?? 'Server overview'}</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-emerald-200">BBC Bot is a member</span>
          <span className="rounded-full border border-white/15 bg-[#10121c] px-2.5 py-1 text-slate-200">{server?.owner ? 'Owner' : 'Administrator'}</span>
        </div>
      </header>
      <section className="mt-7" aria-labelledby="features-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white" id="features-heading">Feature gallery</h2>
            <p className="muted mt-1">See what’s ready and what needs attention.</p>
          </div>
          {settings ? (
            <button className="button" type="button" disabled={checksRunning} onClick={() => {
              void Promise.all([refetch(), commands.refetch(), channelHealth.refetch()]);
            }}>{checksRunning ? 'Checking…' : 'Recheck features'}</button>
          ) : null}
        </div>
        {!settings ? (
          <div className="surface mt-4 p-5">
            <h2 className="font-semibold text-white">Waiting for server setup</h2>
            <p className="muted mt-2">BBC Bot has joined, but its server settings haven’t been registered yet.</p>
            <button className="button mt-4" disabled={isFetching} onClick={() => {
              void refetch();
              void utils.guild.getAll.invalidate();
            }} type="button">
              {isFetching ? 'Checking…' : 'Check again'}
            </button>
          </div>
        ) : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <FeatureCard
            title="Commands"
            description="Manage command availability and choose which roles can run each command."
            status={commandStatus}
            tone={commands.error || registeredCommands?.length === 0 ? 'attention' : registeredCommands?.length ? 'ready' : 'neutral'}
            href={settings ? `/dashboard/${guildId}/commands` : undefined}
            detail={commandDetail}
            nextStep={commands.error ? 'Recheck features to retry the Discord command lookup.' :
              registeredCommands?.length === 0 ? 'Check the bot’s slash command registration in Discord.' :
              registeredCommands ? 'Open settings to review availability and role permissions.' : undefined}
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m4 7 5 5-5 5m9 0h7" /></svg>}
          />
          <FeatureCard
            title="Temporary Voice"
            description="Let members create their own temporary voice channels by joining a hub."
            {...channelCardStatus(channelHealth.data?.voice, Boolean(settings), Boolean(channelHealth.error))}
            href={settings ? `/dashboard/${guildId}/temporary_channels` : undefined}
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9v6h4l5 4V5L7 9H3Zm13 1a3 3 0 0 1 0 4m3-7a7 7 0 0 1 0 10" /></svg>}
          />
          <FeatureCard
            title="Welcome Messages"
            description="Greet new members with a custom message in a text channel."
            {...channelCardStatus(channelHealth.data?.welcome, Boolean(settings), Boolean(channelHealth.error))}
            href={settings ? `/dashboard/${guildId}/welcome_messages` : undefined}
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2ZM8 9h8m-8 4h5" /></svg>}
          />
          <FeatureCard
            title="Giveaways"
            description="Choose who can start giveaways and reroll winners with BBC Bot."
            status={giveawayStatus}
            tone={commands.error || (registeredCommands && missingGiveawayCommands.length) ? 'attention' : registeredCommands ? 'ready' : 'neutral'}
            href={settings ? `/dashboard/${guildId}/giveaways` : undefined}
            detail={giveawayDetail}
            nextStep={registeredCommands && !missingGiveawayCommands.length
              ? 'Confirm the giveaway channel in the bot’s runtime settings, then review command permissions.'
              : registeredCommands ? 'Check command registration before setting up role permissions.' : undefined}
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h18v4H3zm2 4v8h14v-8M12 8v12m0-12H8a2.5 2.5 0 1 1 2.5-2.5L12 8Zm0 0h4a2.5 2.5 0 1 0-2.5-2.5L12 8Z" /></svg>}
          />
        </div>
      </section>
      <ServerActivity guildId={guildId} />
    </section>
  );
};

GuildIndexPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export const getServerSideProps = requirePageSession;

export default GuildIndexPage;
