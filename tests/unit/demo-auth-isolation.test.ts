import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {NextAuthConfig} from 'next-auth';
const state=vi.hoisted(()=>({config:null as NextAuthConfig|null}));
vi.mock('next-auth',()=>({CredentialsSignin:class extends Error {},default:(config:NextAuthConfig)=>{state.config=config;return {};}}));
vi.mock('server-only',()=>({}));
vi.mock('@/server/db/prisma',()=>({prisma:{}}));
vi.mock('@/features/identity/server/rate-limit',()=>({consumeRateLimit:vi.fn()}));
beforeEach(()=>{vi.resetModules();state.config=null;vi.stubEnv('AUTH_SECRET','unit-test-only-explicit-secret');});
afterEach(()=>vi.unstubAllEnvs());
it('uses separate session/callback/CSRF cookies for a simultaneous local demo',async()=>{
 vi.stubEnv('NEXUS_DEMO_BUILD','1');vi.stubEnv('AUTH_URL','http://127.0.0.1:3002');
 await import('@/features/identity/server/auth');
 expect(state.config?.cookies?.sessionToken?.name).toBe('nexus-demo.session-token');
 expect(state.config?.cookies?.csrfToken?.name).toBe('nexus-demo.csrf-token');
 expect(state.config?.cookies?.callbackUrl?.name).toBe('nexus-demo.callback-url');
 expect(state.config?.cookies?.sessionToken?.options).toMatchObject({httpOnly:true,sameSite:'lax',path:'/'});
});
it('keeps normal application cookies unchanged',async()=>{
 vi.stubEnv('NEXUS_DEMO_BUILD','0');await import('@/features/identity/server/auth');
 expect(state.config?.cookies).toBeUndefined();
});
