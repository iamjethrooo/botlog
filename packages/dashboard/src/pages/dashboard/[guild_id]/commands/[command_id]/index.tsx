import { ReactElement } from 'react';
import DashboardLayout from '../../../../../components/DashboardLayout';
import { requirePageSession } from '../../../../../shared/get-server-session';
import { NextPageWithLayout } from '../../../../_app';
import { trpc } from '../../../../../utils/trpc';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CommandPermissionsEditor from '../../../../../components/CommandPermissionsEditor/CommandPermissionsEditor';

const CommandPage: NextPageWithLayout = () => {
  const router = useRouter();
  const guildId = typeof router.query.guild_id === 'string' ? router.query.guild_id : '';
  const commandId = typeof router.query.command_id === 'string' ? router.query.command_id : '';
  const enabled = Boolean(guildId && commandId);

  const { data: ownership, isLoading: ownerLoading, error: ownerError } =
    trpc.guild.getGuildAndUser.useQuery({ id: guildId }, { enabled, refetchOnWindowFocus: false });
  const { data, isLoading, error } =
    trpc.command.getCommandAndGuildChannels.useQuery(
      {
        commandId,
        guildId
      },
      { enabled, refetchOnWindowFocus: false }
    );

  if (isLoading || ownerLoading) {
    return <p className="status-panel" role="status">Loading command…</p>;
  }

  if (ownerError || !ownership?.guild) {
    return <div className="status-panel" role="alert">{ownerError?.message ?? 'Guild unavailable'}</div>;
  }

  if (error || !data) {
    return <div className="status-panel" role="alert">{error?.message ?? 'Command unavailable'}</div>;
  }

  return (
    <div>
      <Link href={`/dashboard/${guildId}/commands`}><a className="text-sm font-medium text-indigo-200 hover:underline">← All commands</a></Link>
      <h1 className="page-title mt-4 break-words">/{data.command.name}</h1>
      <p className="muted mt-3 mb-6">Choose which roles can run this command.</p>
      <CommandPermissionsEditor key={`${guildId}/${commandId}`} guildId={guildId} commandId={commandId}
        roles={data.roles} permissions={data.permissions.permissions} />
    </div>
  );
};

CommandPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export const getServerSideProps = requirePageSession;

export default CommandPage;
