export function publishedWhere(authenticated: boolean) {
  return authenticated
    ? { status: 'PUBLISHED' as const }
    : { status: 'PUBLISHED' as const, visibility: 'PUBLIC' as const };
}
