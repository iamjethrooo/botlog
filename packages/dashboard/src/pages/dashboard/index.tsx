import type { NextPage } from 'next';
import Head from 'next/head';
import Logo from '../../components/Logo/Logo';
import { requirePageSession } from '../../shared/get-server-session';
import { trpc } from '../../utils/trpc';
import GuildSelectBox from '../../components/GuildSelectBox/GuildSelectBox';
import AccountMenu from '../../components/AccountMenu/AccountMenu';

const DashboardIndexPage: NextPage = () => {
  const { data, error, isLoading, isFetching, refetch } = trpc.guild.getAll.useQuery();
  const guilds = data?.apiGuilds ?? [];

  return (
    <div className="min-h-screen">
      <Head>
        <title>Servers | BBC Bot Dashboard</title>
        <meta name="description" content="Choose a Discord server to manage with BBC Bot." />
      </Head>
      <header className="site-header">
        <div className="site-width flex items-center justify-between gap-3 py-4">
          <Logo />
          <AccountMenu />
        </div>
      </header>
      <main className="site-width py-8 sm:py-12">
        <div className="hero-grid rounded-3xl border border-indigo-300/20 bg-indigo-950/40 p-6 sm:p-10">
          <p className="eyebrow">Server management</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Your servers</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Choose a server to manage BBC Bot. You’ll see servers where the bot is a member and you’re the owner or have Administrator permission.
          </p>
        </div>
        <section className="mt-9" aria-labelledby="server-list-heading" aria-busy={isLoading}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold" id="server-list-heading">Manageable servers</h2>
            {data && !error ? (
              <span className="rounded-full border border-white/15 px-3 py-1 text-sm text-slate-300">
                {guilds.length} {guilds.length === 1 ? 'server' : 'servers'}
              </span>
            ) : null}
          </div>
          {isLoading ? (
            <p className="surface p-6 text-slate-300" role="status">Loading servers…</p>
          ) : error ? (
            <div className="surface p-6">
              <div role="alert">
                <p className="font-semibold">Couldn’t load your servers</p>
                <p className="mt-1 text-sm text-slate-300">{error.message}</p>
              </div>
              <button className="button button-primary mt-4" disabled={isFetching} onClick={() => void refetch()} type="button">
                {isFetching ? 'Retrying…' : 'Try again'}
              </button>
            </div>
          ) : guilds.length === 0 ? (
            <div className="surface border-dashed p-6">
              <p className="font-semibold">No manageable servers found</p>
              <p className="mt-1 text-sm text-slate-300">BBC Bot must be in a server you own or administer for it to appear here.</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guilds.map(guild => (
                <li className="min-w-0" key={guild.id}>
                  <GuildSelectBox id={guild.id} icon={guild.icon} name={guild.name} owner={guild.owner} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export const getServerSideProps = requirePageSession;

export default DashboardIndexPage;
