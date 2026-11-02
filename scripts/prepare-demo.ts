import {PrismaClient} from '@prisma/client';
import {randomBytes} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,chmodSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {spawnSync} from 'node:child_process';
import {readDemoEnvironment,validateDemoEnvironment} from './demo-environment';

async function main(){
 if(process.env.NODE_ENV==='production')throw new Error('Demo preparation is disabled in production.');
 const maintenance=parseEnv(readFileSync('.env.database.local','utf8'));
 const adminUrl=new URL(process.env.MIGRATION_DATABASE_URL||maintenance.MIGRATION_DATABASE_URL||'');
 if(!['localhost','127.0.0.1'].includes(adminUrl.hostname)||adminUrl.searchParams.has('host')||adminUrl.hash)throw new Error('Demo preparation only supports the configured local database service.');
 const catalog=new PrismaClient({datasources:{db:{url:adminUrl.href}},log:[]});
 try{
  const existing=existsSync('.env.demo.local');
  let env:NodeJS.ProcessEnv;
  if(existing)env=readDemoEnvironment();
  else{
   const [database]=await catalog.$queryRaw<Array<{exists:boolean}>>`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname='nexus_showcase_demo') AS exists`;
   const [role]=await catalog.$queryRaw<Array<{exists:boolean}>>`SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='nexus_demo_runtime') AS exists`;
   if(database.exists||role.exists)throw new Error('An unmanaged demo database or role already exists; refusing to overwrite it.');
   const url=new URL(adminUrl);url.pathname='/nexus_showcase_demo';url.searchParams.set('schema','public');url.username='nexus_demo_runtime';url.password=randomBytes(32).toString('base64url');
   env={...process.env,DATABASE_URL:url.href,ALLOW_DEMO_SEED:'true',NODE_ENV:'development',ASSET_STORAGE:'local',NEXUS_DEMO_BUILD:'1',NEXUS_TEST_BUILD:'',NEXUS_PREVIEW_BUILD:'',AUTH_URL:'http://127.0.0.1:3002',NEXTAUTH_URL:'http://127.0.0.1:3002',AUTH_SECRET:randomBytes(48).toString('base64url')};
   validateDemoEnvironment(env);
   // Save recovery config before creating anything; no secret values go to stdout.
   const keys=['DATABASE_URL','ALLOW_DEMO_SEED','ASSET_STORAGE','NEXUS_DEMO_BUILD','NEXUS_TEST_BUILD','NEXUS_PREVIEW_BUILD','AUTH_URL','NEXTAUTH_URL','AUTH_SECRET'];
   writeFileSync('.env.demo.local',keys.map(key=>key+'='+JSON.stringify(env[key])).join('\n')+'\n',{mode:0o600});chmodSync('.env.demo.local',0o600);
   const password=decodeURIComponent(url.password);
   if(!/^[A-Za-z0-9_-]+$/.test(password))throw new Error('Unexpected generated password encoding.');

  }
  const runtimeUrl=new URL(env.DATABASE_URL!);
  const expectedAdmin=new URL(adminUrl);expectedAdmin.pathname='/nexus_showcase_demo';expectedAdmin.searchParams.set('schema','public');
  if(runtimeUrl.hostname!==expectedAdmin.hostname||runtimeUrl.port!==expectedAdmin.port)throw new Error('Demo configuration does not match the local administrative target.');
  const [demoRole]=await catalog.$queryRaw<Array<{exists:boolean}>>`SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='nexus_demo_runtime') AS exists`;
  if(!demoRole.exists){
   const password=decodeURIComponent(runtimeUrl.password);
   if(!/^[A-Za-z0-9_-]{32,}$/.test(password))throw new Error('Demo role needs its generated private password.');
   await catalog.$executeRawUnsafe(`CREATE ROLE nexus_demo_runtime LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`);
  }
  const [demoDb]=await catalog.$queryRaw<Array<{exists:boolean}>>`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname='nexus_showcase_demo') AS exists`;
  if(!demoDb.exists)await catalog.$executeRawUnsafe('CREATE DATABASE nexus_showcase_demo');
  const migrated=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{env:{...process.env,DATABASE_URL:expectedAdmin.href},encoding:'utf8'});
  if(migrated.status!==0)throw new Error('Demo migration failed; inspect private configuration.');
  const admin=new PrismaClient({datasources:{db:{url:expectedAdmin.href}},log:[]});
  const role=decodeURIComponent(runtimeUrl.username);
  if(role!=='nexus_demo_runtime')throw new Error('Unexpected demo runtime role.');
  try{
   await admin.$executeRawUnsafe('GRANT CONNECT ON DATABASE nexus_showcase_demo TO nexus_demo_runtime');
   await admin.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO nexus_demo_runtime');
   const tables=await admin.$queryRaw<Array<{tablename:string}>>`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
   for(const {tablename}of tables)await admin.$executeRawUnsafe(`GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public."${tablename.replaceAll('"','""')}" TO nexus_demo_runtime`);
   await admin.$executeRawUnsafe('GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_demo_runtime');
  }finally{await admin.$disconnect();}
  const seeded=spawnSync(process.execPath,['--import','tsx','prisma/seed-full-demo.ts'],{env,encoding:'utf8'});
  if(seeded.status!==0)throw new Error('Demo content seed failed; no runtime database was targeted.');
  console.log(seeded.stdout.trim());
  console.log('Demo ready: http://127.0.0.1:3002 — start with npm run demo');
 }finally{await catalog.$disconnect();}
}
main().catch(error=>{console.error(error instanceof Error&&error.name==='Error'&&!error.message.includes('postgresql://')?error.message:'Demo preparation failed; connection values hidden.');process.exitCode=1;});
