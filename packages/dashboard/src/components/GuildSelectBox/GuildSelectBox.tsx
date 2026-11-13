import Link from 'next/link';

interface GuildSelectBoxProps {
  icon: string | null;
  name: string;
  owner: boolean;
  id: string;
}

const GuildSelectBox = ({ icon, name, owner, id }: GuildSelectBoxProps) => (
  <Link href={`/dashboard/${id}`}>
    <a className="surface flex h-full flex-col p-5 transition-colors hover:border-indigo-300/60 hover:bg-[#1b1e30]">
      <div className="flex items-start justify-between gap-3">
        <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-indigo-300/15 text-xl font-bold text-indigo-200" aria-hidden="true">
          {Array.from(name.trim())[0]?.toUpperCase() || '?'}
          {icon ? (
            // Discord serves these icons at the requested size.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              height={56}
              loading="lazy"
              onError={event => { event.currentTarget.hidden = true; }}
              src={`https://cdn.discordapp.com/icons/${id}/${icon}.webp?size=128`}
              width={56}
            />
          ) : null}
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-300">
          {owner ? 'Owner' : 'Administrator'}
        </span>
      </div>
      <h3 className="mt-5 mb-4 break-words text-lg font-semibold text-slate-100">{name}</h3>
      <span className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm font-semibold text-indigo-200">
        Manage server
        <span aria-hidden="true">&rarr;</span>
      </span>
    </a>
  </Link>
);

export default GuildSelectBox;
