import '../styles/globals.css';
import { trpc } from '../utils/trpc';
import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';
import type { AppProps } from 'next/app';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { signInUrl } from '../shared/sign-in-url';

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function PageSessionGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { asPath } = useRouter();
  const hasSession = Boolean(session?.user?.id && !session.error);

  useEffect(() => {
    if (status !== 'loading' && !hasSession) {
      window.location.replace(signInUrl(asPath));
    }
  }, [asPath, hasSession, status]);

  return hasSession ? <>{children}</> : null;
}

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? (page => page);
  const page = getLayout(<Component {...pageProps} />);

  return (
    <SessionProvider session={pageProps.session} refetchInterval={pageProps.session ? 60 : 0}>
      <div className="min-h-screen">
        <ToastContainer theme={'dark'} toastClassName="p-4" />
        {pageProps.session ? <PageSessionGuard>{page}</PageSessionGuard> : page}
      </div>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
