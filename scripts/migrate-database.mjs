import nextEnv from '@next/env';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';

nextEnv.loadEnvConfig(process.cwd());
if (existsSync('.env.database.local')) process.loadEnvFile('.env.database.local');
// Runtime credentials deliberately have no DDL privileges. Keep maintenance
// credentials server-side and never pass them to client-side configuration.
const url=process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if(!url) { console.error('Configure MIGRATION_DATABASE_URL before applying migrations.'); process.exitCode=1; }
else {
 const child=spawn(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{env:{...process.env,DATABASE_URL:url},stdio:'inherit'});
 child.once('error',()=>{console.error('Could not start database migrations.');process.exitCode=1;});
 child.once('exit',code=>{process.exitCode=code??1;});
}
