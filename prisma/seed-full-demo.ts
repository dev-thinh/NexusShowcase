import {PrismaClient} from '@prisma/client';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readDemoEnvironment} from '../scripts/demo-environment';
import {createDemoAssets} from './demo-assets';
import {seedFullDemo} from './demo-dataset';

async function main(){
 const env=readDemoEnvironment();
 const db=new PrismaClient({datasources:{db:{url:env.DATABASE_URL}},log:[]});
 try{
  const assets=await createDemoAssets();
  const result=await seedFullDemo(db,assets);
  console.log(JSON.stringify(result,null,2));
 }finally{await db.$disconnect();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(()=>{console.error('Full demo seed failed; verify private demo configuration and migrations. Current runtime data was not targeted.');process.exitCode=1;});
}
