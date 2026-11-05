import { afterEach, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, symlink, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { planOrphanAssets } from '../../src/features/assets/server/orphans';
import { deleteRegisteredLocalAsset } from '../../src/features/assets/server/local-cleanup';
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.map(root => rm(root, { recursive: true, force: true }))); });
it('plans local registered orphans but protects references and quarantine', () => {
 const asset = { id:'local',url:'/uploads/resources/old.zip',provider:'local',fileId:null,createdAt:new Date('2026-01-01'),deletedAt:null,deletionStartedAt:null };
 expect(planOrphanAssets([asset],{urls:new Set(),incompleteSources:[]},new Date('2026-11-01'))).toEqual([asset]);
 expect(planOrphanAssets([asset],{urls:new Set([asset.url]),incompleteSources:[]},new Date('2026-11-01'))).toEqual([]);
 expect(planOrphanAssets([{...asset,deletionStartedAt:new Date()}],{urls:new Set(),incompleteSources:[]},new Date('2026-11-01'))).toEqual([]);
});
it('deletes only canonical registered local files and refuses symlinks',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nexus-cleanup-'));roots.push(root);
 await mkdir(path.join(root,'storage/resources'),{recursive:true});
 const target=path.join(root,'storage/resources/a.zip');await writeFile(target,'asset');
 await expect(deleteRegisteredLocalAsset(root,'/uploads/resources/../a.zip')).rejects.toThrow();
 await deleteRegisteredLocalAsset(root,'/uploads/resources/a.zip');
 await expect(readFile(target)).rejects.toMatchObject({code:'ENOENT'});
 await writeFile(path.join(root,'retained.zip'),'retained');
 await symlink(path.join(root,'retained.zip'),target);
 await expect(deleteRegisteredLocalAsset(root,'/uploads/resources/a.zip')).rejects.toThrow('symlink');
 expect(await readFile(path.join(root,'retained.zip'),'utf8')).toBe('retained');
 await rm(target);await rm(path.join(root,'storage/resources'),{recursive:true});await symlink(root,path.join(root,'storage/resources'));
 await expect(deleteRegisteredLocalAsset(root,'/uploads/resources/retained.zip')).rejects.toThrow('symlink');
});
