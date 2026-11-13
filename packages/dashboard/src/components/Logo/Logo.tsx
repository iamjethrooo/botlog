import Link from 'next/link';

const Logo = ({ linkToHome = true }: { linkToHome?: boolean }) => {
  const className = 'inline-flex shrink-0 items-center gap-3 rounded-lg font-bold tracking-tight text-white';
  const brand = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-300 text-[#10121c]" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 9h14v10H5zM12 5v4M2 13h3m14 0h3M9 14h.01m6 0h.01" />
        </svg>
      </span>
      BBC Bot
    </>
  );

  return linkToHome ? (
    <Link href="/"><a className={className}>{brand}</a></Link>
  ) : <span className={className}>{brand}</span>;
};

export default Logo;
