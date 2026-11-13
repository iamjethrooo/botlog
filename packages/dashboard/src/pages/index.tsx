import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Logo from '../components/Logo/Logo';
import AccountMenu from '../components/AccountMenu/AccountMenu';
import { requirePageSession } from '../shared/get-server-session';

const features = [
  { number: '01', title: 'Server dashboard', description: 'Find the servers where you can manage BBC Bot.' },
  { number: '02', title: 'Command permissions', description: 'Control which Discord roles can use each command.' },
  { number: '03', title: 'Temporary voice', description: 'Give members a voice channel that opens when they join.' }
];

const IndexPage: NextPage = () => (
  <>
    <Head>
      <title>BBC Bot for Discord</title>
      <meta name="description" content="Manage BBC Bot commands, permissions, and temporary voice channels." />
    </Head>
    <header className="site-header">
      <div className="site-width flex flex-wrap items-center justify-between gap-3 py-4">
        <Logo />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link href="/dashboard"><a className="button">Dashboard <span aria-hidden="true">↗</span></a></Link>
          <AccountMenu />
        </div>
      </div>
    </header>
    <main className="site-width pb-12">
      <section className="grid items-center gap-9 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="eyebrow">Baguio Benguet Chat · Discord bot</p>
          <h1 className="mt-5 max-w-[13ch] text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Manage BBC Bot <span className="text-indigo-300">in one place.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-300">
            Set up temporary voice channels, turn commands on or off, and decide who can use them.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard"><a className="button button-primary">Open dashboard <span aria-hidden="true">→</span></a></Link>
            <a className="button" href="https://github.com/iamjethrooo/bbc-bot" target="_blank" rel="noreferrer">Source code <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="hero-grid overflow-hidden rounded-3xl border border-indigo-300/20 bg-indigo-950/40 p-4 sm:p-8">
          <div className="surface overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
              <p className="text-sm font-semibold">Server settings</p>
              <span className="eyebrow">Preview</span>
            </div>
            <div className="grid gap-3 p-4 sm:p-5">
              {features.slice(1).map(feature => (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:gap-4 sm:p-4" key={feature.number}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-300/15 font-mono text-xs text-indigo-200" aria-hidden="true">{feature.number}</span>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section aria-label="Dashboard features" className="grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
        {features.map(feature => (
          <article className="surface p-5" key={feature.number}>
            <p className="font-mono text-xs text-indigo-300" aria-hidden="true">{feature.number}</p>
            <h2 className="mt-3 font-semibold text-white">{feature.title}</h2>
            <p className="muted mt-1">{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
    <footer className="border-t border-white/10">
      <div className="site-width py-5 text-sm text-slate-400">BBC Bot · Baguio Benguet Chat</div>
    </footer>
  </>
);

export const getServerSideProps = requirePageSession;

export default IndexPage;
