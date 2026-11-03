import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdtemp,mkdir,cp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const registry=JSON.parse(await readFile(path.join(root,'iterations/registry.json'),'utf8'));
test('each archived iteration retains its recorded files and independent browser-storage namespace',async()=>{
 assert.ok(registry.length>0);assert.equal(new Set(registry.map(r=>r.id)).size,registry.length);
 for(const record of registry){
  const folder=path.join(root,'iterations',record.id),manifest=JSON.parse(await readFile(path.join(folder,'snapshot.json'),'utf8'));
  assert.equal(manifest.id,record.id);assert.equal(manifest.sourceCommit,record.sourceCommit);assert.match(manifest.sourceCommit,/^[a-f0-9]{40}$/);
  const listed=[];async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())await walk(p);else listed.push(path.relative(folder,p).split(path.sep).join('/'));}}await walk(folder);
  assert.deepEqual(listed.filter(p=>p!=='snapshot.json').sort(),manifest.files.map(f=>f.path).sort());
  for(const entry of manifest.files){const bytes=await readFile(path.join(folder,entry.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,`${record.id}/${entry.path} was changed after preservation`);}
  const gameFiles=manifest.files.some(f=>f.path==='game/game.js')?['game/game.js']:[];
  for(const file of ['assets/hub.js',...['child','teen','college','post-college','expert'].map(id=>`${id}/lesson.js`),...gameFiles]){
   const source=await readFile(path.join(folder,file),'utf8');assert.ok(source.includes(manifest.storageNamespace));assert.ok(!source.includes('money-moves:v1:'));
  }
 }
});
test('the snapshot command refuses an existing iteration without modifying it',async()=>{
 const record=registry[0],file=path.join(root,'iterations',record.id,'snapshot.json'),before=await readFile(file);
 const result=spawnSync(process.execPath,[path.join(root,'scripts/freeze-iteration.mjs'),record.id,'--source-commit',record.sourceCommit],{encoding:'utf8'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Refusing to overwrite existing snapshot/);assert.deepEqual(await readFile(file),before);
});
test('a later snapshot captures changed content while the earlier copy stays intact',async t=>{
 const fixture=await mkdtemp(path.join(os.tmpdir(),'money-moves-versions-'));
 t.after(()=>rm(fixture,{recursive:true,force:true}));
 await mkdir(path.join(fixture,'scripts'));
 await cp(path.join(root,'scripts/freeze-iteration.mjs'),path.join(fixture,'scripts/freeze-iteration.mjs'));
 for(const item of ['.nojekyll','index.html','sources.html','assets','child','teen','college','post-college','expert','game'])await cp(path.join(root,item),path.join(fixture,item),{recursive:true});
 const run=(id,sha)=>spawnSync(process.execPath,[path.join(fixture,'scripts/freeze-iteration.mjs'),id,'--source-commit',sha],{encoding:'utf8'});
 const first=run('iteration-01','a'.repeat(40));assert.equal(first.status,0,first.stderr);
 const firstFile=path.join(fixture,'iterations/iteration-01/teen/content.json'),before=await readFile(firstFile);
 const current=path.join(fixture,'teen/content.json'),content=JSON.parse(await readFile(current,'utf8'));content.name='Test-only revised title';await writeFile(current,JSON.stringify(content));
 const second=run('iteration-02','b'.repeat(40));assert.equal(second.status,0,second.stderr);
 assert.deepEqual(await readFile(firstFile),before);
 assert.equal(JSON.parse(await readFile(path.join(fixture,'iterations/iteration-02/teen/content.json'),'utf8')).name,'Test-only revised title');
 const entrance=await readFile(path.join(fixture,'iterations/iteration-02/index.html'),'utf8');assert.ok(!entrance.includes('href="iterations/"'));assert.ok(entrance.includes('href="../"'));
 const js=await readFile(path.join(fixture,'iterations/iteration-02/teen/lesson.js'),'utf8');assert.ok(js.includes('money-moves:iteration-02:v1:'));assert.ok(!js.includes('money-moves:iteration-01:'));
 // The money game is captured in full, isolated by storage key, and changes to the root game do not reach an earlier snapshot.
 const manifest=JSON.parse(await readFile(path.join(fixture,'iterations/iteration-02/snapshot.json'),'utf8'));
 for(const file of ['game/index.html','game/game.js','game/engine.js','game/game.css','game/pocketford.svg'])assert.ok(manifest.files.some(f=>f.path===file),`${file} missing from snapshot`);
 const gameJs=await readFile(path.join(fixture,'iterations/iteration-02/game/game.js'),'utf8');
 assert.ok(gameJs.includes("'money-moves:iteration-02:game:pocketford:v1'"));assert.ok(!gameJs.includes("'money-moves:game:"));
 const firstGame=path.join(fixture,'iterations/iteration-01/game/engine.js'),firstGameBefore=await readFile(firstGame);
 await writeFile(path.join(fixture,'game/engine.js'),(await readFile(path.join(fixture,'game/engine.js'),'utf8')).replace('Ten Paydays','Test-only revised game'));
 const third=run('iteration-03','c'.repeat(40));assert.equal(third.status,0,third.stderr);
 assert.deepEqual(await readFile(firstGame),firstGameBefore);
 assert.ok((await readFile(path.join(fixture,'iterations/iteration-03/game/engine.js'),'utf8')).includes('Test-only revised game'));
 // Every relative link and asset in the snapshot stays inside it; only the entrance's archive link leaves, to the archive page.
 const folder=path.join(fixture,'iterations/iteration-02');
 for(const entry of manifest.files.filter(f=>f.path.endsWith('.html'))){
  const file=path.join(folder,entry.path),source=await readFile(file,'utf8');
  for(const m of source.matchAll(/(?:href|src)="([^"]+)"/g)){const link=m[1];if(/^(https?:|data:|#|mailto:)/.test(link))continue;
   const target=path.resolve(path.dirname(file),link.split(/[?#]/)[0]);
   if(entry.path==='index.html'&&link==='../')continue;
   assert.ok(target===folder||target.startsWith(folder+path.sep),`${entry.path} escapes the snapshot via ${link}`);}
 }
 for(const id of ['child','teen','college','post-college','expert']){const html=await readFile(path.join(folder,id,'index.html'),'utf8');assert.ok(html.includes(`href="../game/?from=${id}"`),`${id} lacks a game link`);}
 const imports=[...gameJs.matchAll(/from '([^']+)'/g)].map(m=>m[1]);assert.deepEqual(imports,['./engine.js']);
});
