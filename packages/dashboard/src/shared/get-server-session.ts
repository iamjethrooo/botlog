import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { unstable_getServerSession } from 'next-auth';
import { authOptions as nextAuthOptions } from '../pages/api/auth/[...nextauth]';
import { signInUrl } from './sign-in-url';

export const getServerSession = async (ctx: {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
}) => {
  const session = await unstable_getServerSession(ctx.req, ctx.res, nextAuthOptions);
  return session?.error ? null : session;
};

export const requirePageSession: GetServerSideProps = async ctx => {
  const session = await getServerSession(ctx);
  if (!session?.user?.id) {
    return {
      redirect: { destination: signInUrl(ctx.resolvedUrl), permanent: false }
    };
  }

  return { props: { session } };
};
