import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [id,...args]=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const sourceCommit=option('--source-commit');
const label=option('--label')||`Iteration ${id?.split('-').at(-1)}`;
const description=option('--description')||'A preserved version of the personal finance learning tool.';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!/^iteration-\d{2,3}$/.test(id||'')||!/^\b[0-9a-f]{40}\b$/.test(sourceCommit||'')){
 console.error('Usage: node scripts/freeze-iteration.mjs iteration-02 --source-commit <40-character SHA> [--label "Iteration 02"] [--description "..."]');process.exit(1);
}
const archives=path.join(root,'iterations'),destination=path.join(archives,id);
try{await stat(destination);console.error(`Refusing to overwrite existing snapshot: ${id}`);process.exit(1);}catch(e){if(e.code!=='ENOENT')throw e;}
let registry=[];
try{registry=JSON.parse(await readFile(path.join(archives,'registry.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(registry.some(record=>record.id===id))throw new Error('An iteration with this ID is already registered.');
const entries=[];
async function collect(relative){
 const full=path.join(root,relative),info=await stat(full);
 if(info.isDirectory()){for(const item of (await readdir(full)).sort())await collect(path.join(relative,item));}
 else{const original=await readFile(full);let saved=original;
  if(relative.endsWith('.js'))saved=Buffer.from(original.toString('utf8').replaceAll('money-moves:',`money-moves:${id}:`));
  if(relative==='index.html')saved=Buffer.from(saved.toString('utf8').replaceAll('href="iterations/"','href="../"'));
  entries.push({path:relative.split(path.sep).join('/'),bytes:saved,sourceSha256:digest(original),sha256:digest(saved)});
 }
}
// Capture the complete runtime; do not share course assets with the changing root.
// The shared money game (Version 5+) is copied with its own scripts, styles, and art so a snapshot never loads it from the root.
const runtime=['.nojekyll','index.html','sources.html','assets','child','teen','college','post-college','expert','game'];
for(const item of runtime)await collect(item);
const createdAt=new Date().toISOString();
const manifest={schemaVersion:1,id,label,description,createdAt,sourceCommit,storageNamespace:`money-moves:${id}:`,note:'Runtime copied from the source commit. Runtime transformations isolate browser progress and notes for this iteration and route the global archive link to its parent archive page.',files:entries.map(({path,sourceSha256,sha256})=>({path,sourceSha256,sha256}))};
await mkdir(archives,{recursive:true});
await mkdir(destination); // Exclusive creation: an existing snapshot is never rewritten.
for(const entry of entries){const target=path.join(destination,entry.path);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,entry.bytes,{flag:'wx'});}
await writeFile(path.join(destination,'snapshot.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
registry.push({id,label,description,createdAt,sourceCommit});
registry.sort((a,b)=>a.id.localeCompare(b.id));
await writeFile(path.join(archives,'registry.json'),JSON.stringify(registry,null,2)+'\n');
const cards=registry.map(record=>`<article class="version-card"><div class="version-number">${escape(record.id.split('-').at(-1))}</div><div class="version-copy"><p class="eyebrow">SAVED ${escape(new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'America/New_York'}).format(new Date(record.createdAt)))}</p><h2><a href="${escape(record.id)}/">${escape(record.label)}</a></h2><p>${escape(record.description)}</p><div class="version-links"><a class="button primary" href="${escape(record.id)}/">Open this version <span aria-hidden="true">↗</span></a><a class="source-link" href="https://github.com/KGSUCF/ENG6803IteratingPersonalFinance/tree/${record.sourceCommit}">Source record ↗</a></div></div><span class="preserved">PRESERVED COPY</span></article>`).join('\n');
await writeFile(path.join(archives,'index.html'),`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Preserved versions of the Money Moves personal finance learning tool."><title>Iteration archive · Money Moves</title><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="archive.css"></head><body><a class="skip" href="#main">Skip to versions</a><header><a class="brand" href="../"><span aria-hidden="true">m↗</span> MONEY MOVES</a><a href="../">Open the latest version ↗</a></header><main id="main"><p class="eyebrow">THE ASSIGNMENT RECORD</p><h1>Every iteration.<br>Its own place in time.</h1><p class="intro">Explore how the personal finance learning tool develops. Each saved version has its own complete set of lessons, illustrations, and code. Later updates to the latest version leave these copies in place.</p><div class="archive-note"><span aria-hidden="true">↗</span><p>Use a saved version’s link when citing it in the assignment. Use the latest-version link when you want the current tool.</p></div><section aria-label="Saved iterations">${cards}</section><p class="privacy-note">Learning progress and optional notes are separate for each saved iteration and the latest version.</p></main><footer><span>MONEY MOVES / ITERATION ARCHIVE</span><a href="../">Return to the learning tool →</a></footer></body></html>`);
console.log(`Preserved ${id}: ${entries.length} runtime files, isolated progress, and SHA-256 integrity records. Existing snapshots were not changed.`);
