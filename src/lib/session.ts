import { cache } from 'react';
import { auth } from '@/lib/auth';

// Share session verification within one render request; never across users/requests.
export const getSession = cache(async () => auth());
