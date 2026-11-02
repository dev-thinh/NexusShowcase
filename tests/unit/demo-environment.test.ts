import {expect,it} from 'vitest';
import {validateDemoEnvironment} from '../../scripts/demo-environment';
const valid: NodeJS.ProcessEnv={DATABASE_URL:'postgresql://nexus_demo_runtime:private@127.0.0.1:5434/nexus_showcase_demo?schema=public',ALLOW_DEMO_SEED:'true',NODE_ENV:'development',ASSET_STORAGE:'local',NEXUS_DEMO_BUILD:'1',AUTH_URL:'http://127.0.0.1:3002',NEXTAUTH_URL:'http://127.0.0.1:3002',AUTH_SECRET:'test-config-not-an-actual-secret-0123456789'};
it('accepts a deliberately isolated local demo environment',()=>expect(()=>validateDemoEnvironment(valid)).not.toThrow());
it.each([
 {DATABASE_URL:'postgresql://nexus_demo_runtime:private@127.0.0.1:5434/nexus_showcase?schema=public'},
 {DATABASE_URL:'postgresql://nexus_demo_runtime:private@remote.test:5434/nexus_showcase_demo?schema=public'},
 {DATABASE_URL:'postgresql://nexus_demo_runtime:private@127.0.0.1:5434/nexus_showcase_demo?schema=public&host=remote.test'},
 {DATABASE_URL:'postgresql://nexus:private@127.0.0.1:5434/nexus_showcase_demo?schema=public'},
 {NODE_ENV:'production'}, {ALLOW_DEMO_SEED:'false'}, {ASSET_STORAGE:'imagekit'}, {AUTH_URL:'https://external.test'}, {NEXTAUTH_URL:'http://localhost:3000'}, {NEXUS_DEMO_BUILD:'0'},
] as Array<Partial<NodeJS.ProcessEnv>>)('rejects unsafe demo settings without including connection strings in errors',overrides=>{
 expect(()=>validateDemoEnvironment({...valid,...overrides})).toThrow();
 try{validateDemoEnvironment({...valid,...overrides});}catch(e){expect(String(e)).not.toContain('postgresql://');expect(String(e)).not.toContain('private@');}
});
