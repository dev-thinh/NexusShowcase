import { auth } from '@/features/identity/server/auth';
import { measureServerOperation } from '@/server/observability/timing';
import { cache } from 'react';

// Share session verification within one render request; never across users/requests.
export const getSession = cache(async () => measureServerOperation('auth', async () => auth()));
