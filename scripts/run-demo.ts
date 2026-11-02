import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {readDemoEnvironment} from './demo-environment';
import {syncDemoSchema} from './demo-schema';

async function main(){
 const demo=readDemoEnvironment();
 const env: NodeJS.ProcessEnv={...demo,NODE_ENV:'production',ALLOW_DEMO_SEED:'false'};
 const probe=createServer();
 await new Promise<void>((resolve,reject)=>{probe.once('error',reject);probe.listen(3002,'127.0.0.1',resolve);});
 await new Promise<void>((resolve,reject)=>probe.close(error=>error?reject(error):resolve()));
 let child:ReturnType<typeof spawn>|undefined;
 let stopping=false;
 for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{stopping=true;child?.kill(signal);});
 const run=(args:string[])=>new Promise<number>((resolve,reject)=>{
  child=spawn(process.execPath,['node_modules/next/dist/bin/next',...args],{env,stdio:'inherit'});
  child.once('error',reject);child.once('exit',code=>resolve(code??1));
 });
 console.log('Synchronizing the isolated demo database schema.');
 await syncDemoSchema(demo);
 if(stopping){process.exitCode=1;return;}
 console.log('Building the isolated full demo; current application remains running.');
 const built=await run(['build','--webpack']);
 if(built||stopping){process.exitCode=built||1;return;}
 console.log('Full demo: http://127.0.0.1:3002');
 process.exitCode=await run(['start','--hostname','127.0.0.1','--port','3002']);
}
main().catch(error=>{console.error((error as NodeJS.ErrnoException).code==='EADDRINUSE'?'Demo port 3002 is already in use.':'Demo could not start. Run npm run demo:prepare first and inspect the build output.');process.exitCode=1;});
