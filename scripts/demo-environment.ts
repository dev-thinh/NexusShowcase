import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {assertDemoSeedAllowed} from '../prisma/seed-policy';

export function validateDemoEnvironment(env: NodeJS.ProcessEnv): void {
  assertDemoSeedAllowed(env);
  let valid=false;
  try {
    const url=new URL(env.DATABASE_URL!);
    valid=['127.0.0.1','localhost'].includes(url.hostname)&&url.pathname==='/nexus_showcase_demo'&&url.searchParams.get('schema')==='public'&&url.searchParams.getAll('schema').length===1&&!url.searchParams.has('host')&&!url.hash&&decodeURIComponent(url.username)==='nexus_demo_runtime';
  }catch{/* Keep credentials out of diagnostics. */}
  if(!valid||env.ASSET_STORAGE!=='local'||env.NEXUS_DEMO_BUILD!=='1'||
    env.AUTH_URL!=='http://127.0.0.1:3002'||env.NEXTAUTH_URL!==env.AUTH_URL||!env.AUTH_SECRET||env.AUTH_SECRET.length<32) {
    throw new Error('Demo requires its dedicated local database, local storage, isolated build and loopback origin on port 3002.');
  }
}
export function readDemoEnvironment(): NodeJS.ProcessEnv {
  if(process.env.NODE_ENV==='production')throw new Error('Demo preparation is disabled in a production process.');
  const config=parseEnv(readFileSync('.env.demo.local','utf8'));
  const env: NodeJS.ProcessEnv={...process.env,...config,NODE_ENV:'development'};
  validateDemoEnvironment(env);
  return env;
}
