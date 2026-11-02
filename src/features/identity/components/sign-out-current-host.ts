'use client';

import { signOut } from 'next-auth/react';

export async function signOutOnCurrentHost(destination: '/' | '/login') {
  await signOut({ redirect: false, redirectTo: destination });
  // Auth's configured origin may use another loopback hostname. Reload the
  // host whose cookie was cleared, also discarding its cached account UI.
  window.location.assign(destination);
}
