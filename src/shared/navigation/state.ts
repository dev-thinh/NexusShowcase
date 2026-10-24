export type NavigationDestination = { id: number; pathname: string };

export function navigationTarget(href: string, currentHref: string): string | null {
  const current = new URL(currentHref), target = new URL(href, current);
  if (target.origin !== current.origin || target.pathname === current.pathname && target.search === current.search) return null;
  return target.pathname;
}
export function finishNavigation(current: NavigationDestination | null, id: number): NavigationDestination | null {
  return current?.id === id ? null : current;
}
