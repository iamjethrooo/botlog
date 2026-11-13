import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Logo from '../components/Logo/Logo';
import { env } from '../env/server.mjs';
import { resolveSignInReturnPath } from '../shared/sign-in-url';

type SignInProps = {
  callbackUrl: string;
  errorMessage: string | null;
};

function signInErrorMessage(error: string | undefined) {
  switch (error) {
    case undefined:
      return null;
    case 'AccessDenied':
      return 'Discord sign-in was denied. Try again with the Discord account you normally use for BBC Bot.';
    case 'OAuthAccountNotLinked':
      return 'This dashboard account is linked to a different Discord account. Switch accounts in Discord and try again.';
    case 'SessionRequired':
      return 'Sign in to continue to the page you requested.';
    case 'Configuration':
    case 'configuration':
      return 'Discord sign-in is temporarily unavailable. Try again later.';
    default:
      return 'We couldn’t finish signing you in. Try connecting to Discord again.';
  }
}

export default function SignInPage({ callbackUrl, errorMessage }: SignInProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState(errorMessage);

  async function connectDiscord() {
    setMessage(null);
    setIsConnecting(true);
    try {
      await signIn('discord', { callbackUrl });
    } catch {
      setMessage('We couldn’t connect to Discord. Check your connection and try again.');
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>Sign in | BBC Bot</title>
        <meta name="description" content="Sign in with Discord to manage BBC Bot in your servers." />
      </Head>
      <header className="site-header">
        <div className="site-width flex items-center justify-between gap-3 py-4">
          <Logo linkToHome={false} />
          <span className="text-sm font-medium text-slate-300">Server dashboard</span>
        </div>
      </header>

      <main className="site-width flex flex-1 items-center py-8 sm:py-16">
        <div className="hero-grid relative isolate grid w-full overflow-hidden rounded-3xl border border-indigo-300/20 bg-indigo-950/35 lg:grid-cols-2">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.22),_transparent_65%)]" />
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
            <p className="eyebrow">Baguio Benguet Chat</p>
            <h1 className="mt-4 max-w-[13ch] text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Manage BBC Bot <span className="text-indigo-300">on Discord.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
              Set command permissions and manage temporary voice channels for your servers.
            </p>
          </div>

          <div className="p-4 pt-0 sm:p-8 sm:pt-0 lg:p-10">
            <section aria-labelledby="signin-heading" className="surface flex h-full flex-col justify-center bg-[#10121c] p-5 shadow-xl shadow-black/25 sm:p-8">
              <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-indigo-300/25 bg-indigo-300/10 text-indigo-200" aria-hidden="true">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" />
                </svg>
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-white" id="signin-heading">Sign in to your dashboard</h2>
              <p className="muted mt-2">
                You’ll see servers where BBC Bot is a member and you’re the owner or have Administrator permission.
              </p>
              {message ? (
                <p className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100" role="alert">
                  {message}
                </p>
              ) : null}
              <button className="button button-primary mt-6 min-h-[48px] w-full"
                disabled={isConnecting} onClick={() => void connectDiscord()} type="button">
                {isConnecting ? 'Connecting to Discord…' : 'Continue with Discord'}
                {!isConnecting ? <span aria-hidden="true">→</span> : null}
              </button>
              <p className="sr-only" role="status">{isConnecting ? 'Connecting to Discord…' : ''}</p>
              <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
                You’ll continue on Discord and return to BBC Bot after signing in.
              </p>
            </section>
          </div>
        </div>
      </main>
      <footer className="border-t border-white/10">
        <div className="site-width py-4 text-sm text-slate-400">BBC Bot · Baguio Benguet Chat</div>
      </footer>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<SignInProps> = async ({ query, req, res }) => {
  const error = typeof query.error === 'string' ? query.error : undefined;
  const callback = typeof query.callbackUrl === 'string' ? query.callbackUrl :
    error ? req.cookies['next-auth.callback-url'] : undefined;
  res.setHeader('Cache-Control', 'private, no-store');
  return {
    props: {
      callbackUrl: resolveSignInReturnPath(callback, env.NEXTAUTH_URL),
      errorMessage: signInErrorMessage(error)
    }
  };
};
