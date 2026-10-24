import { showcaseHref } from '@/features/publications/model/navigation';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';

/** Extend the detail link across the card without nesting its other controls. */
export function CardLink({ slug, returnTo }: { slug: string; returnTo?: string }) {
  return <Link href={showcaseHref(slug, returnTo)} className="card-hit-area" aria-hidden="true" tabIndex={-1} />;
}
