import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

type Contributor = {
  id: string;
  role: string;
  user: { id: string; fullName: string } | null;
  externalName: string | null;
};

export function ContributorName({ contributor }: { contributor: Contributor }) {
  const name = contributor.user?.fullName || contributor.externalName || 'Tác giả';
  return <span className="relative z-[2] font-normal">
    {contributor.user ? <Link href={`/members/${contributor.user.id}`} className="hover:font-semibold">{name}</Link> : <span className="cursor-default underline decoration-dotted underline-offset-4" title="Tác giả ngoài CLB">{name}<span className="sr-only"> (Tác giả ngoài CLB)</span></span>}
  </span>;
}

export function ContributorNames({ contributors }: { contributors: Contributor[] }) {
  return <>{contributors.map((contributor, index) => <span key={contributor.id}>
    <ContributorName contributor={contributor} />
    {index < contributors.length - 1 ? ', ' : ''}
  </span>)}</>;
}
