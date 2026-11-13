import { Menu } from '@headlessui/react';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

export default function AccountMenu() {
  const { data } = useSession();
  const accountName = data?.user?.name || 'Discord account';

  return (
    <Menu as="div" className="relative z-10 min-w-0">
      <Menu.Button className="button max-w-full">
        <span className="max-w-[9rem] truncate">{accountName}</span>
        <span aria-hidden="true">⌄</span>
      </Menu.Button>
      <Menu.Items className="surface absolute right-0 mt-2 w-48 p-2 shadow-xl shadow-black/30">
        <p className="px-3 py-2 text-xs text-slate-400">Signed in with Discord</p>
        <Menu.Item>
          {({ active }) => (
            <button
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${active ? 'bg-white/10' : ''}`}
              onClick={() => void signOut({ callbackUrl: '/dashboard' }).catch(() => toast.error('Couldn’t sign out. Try again.'))}
              type="button"
            >
              Sign out
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}
