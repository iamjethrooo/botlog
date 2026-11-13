import type { ReactNode } from 'react';
import Logo from '../Logo/Logo';
import Link from 'next/link';
import { trpc } from '../../utils/trpc';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AccountMenu from '../AccountMenu/AccountMenu';

const sections = [
  { path: '', label: 'Overview' },
  { path: '/commands', label: 'Commands' },
  { path: '/temporary_channels', label: 'Temporary Voice' },
  { path: '/welcome_messages', label: 'Welcome Messages' },
  { path: '/giveaways', label: 'Giveaways' }
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const guildId = typeof router.query.guild_id === 'string' ? router.query.guild_id : '';
  const { data, error, isFetching, isLoading, refetch } = trpc.guild.getAll.useQuery();
  const guild = data?.apiGuilds.find(server => server.id === guildId);
  const hasSettings = data?.dbGuilds.some(server => server.id === guildId);
  const isOverview = router.pathname === '/dashboard/[guild_id]';

  return (
    <>
      <Head><title>Server settings | BBC Bot</title></Head>
      <header className="site-header">
        <div className="site-width flex flex-wrap items-center justify-between gap-3 py-4">
          <Logo />
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Link href="/dashboard"><a className="button"><span aria-hidden="true">←</span> All servers</a></Link>
            <AccountMenu />
          </div>
        </div>
      </header>
      <div className="site-width grid gap-6 py-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:py-10">
        <aside className="surface self-start p-4">
          <p className="eyebrow">Server settings</p>
          {data && !error && data.apiGuilds.length > 0 ? (
            <label className="mt-3 block text-sm text-slate-300">
              Switch server
              <select
                className="field mt-1 w-full"
                value={guild?.id ?? ''}
                onChange={event => {
                  if (event.target.value) void router.push(`/dashboard/${event.target.value}`);
                }}
              >
                {!guild ? <option value="" disabled>Choose a server</option> : null}
                {data.apiGuilds.map(server => <option key={server.id} value={server.id}>{server.name}</option>)}
              </select>
            </label>
          ) : null}
          {guild && !error && hasSettings ? (
            <nav aria-label="Server settings" className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3 lg:flex-col">
              {sections.map(section => {
                const active = section.path ? router.pathname.includes(`[guild_id]${section.path}`) : router.pathname.endsWith('[guild_id]');
                return (
                  <Link href={`/dashboard/${guildId}${section.path}`} key={section.path}>
                    <a aria-current={active ? 'location' : undefined} className={`rounded-lg px-3 py-2 text-sm font-medium ${active ? 'bg-indigo-300/15 text-indigo-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                      {section.label}
                    </a>
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </aside>
        <main className="min-w-0">
          {isLoading ? <p className="status-panel" role="status">Checking server access…</p> : error ? (
            <div className="status-panel">
              <p role="alert">{error.message}</p>
              <button className="button mt-3" type="button" disabled={isFetching} onClick={() => void refetch()}>Try again</button>
            </div>
          ) : !guild ? (
            <p className="status-panel" role="status">This server is no longer in your manageable server list. <Link href="/dashboard"><a className="text-indigo-200 underline">View your servers</a></Link></p>
          ) : !hasSettings && !isOverview ? (
            <p className="status-panel" role="status">BBC Bot has joined, and server settings are still being set up. <Link href={`/dashboard/${guildId}`}><a className="text-indigo-200 underline">View setup status</a></Link></p>
          ) : children}
        </main>
      </div>
    </>
  );
};

export default DashboardLayout;
