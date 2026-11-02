import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ids=['child','teen','college','post-college','expert'];
for(const id of ids){
 const model=await import(`../${id}/model.js`);
 const c=JSON.parse(await readFile(path.join(root,id,'content.json'),'utf8'));
 test(`${id}: allocations conserve money and a zero saving rate has no goal date`,()=>{
  for(let flexible=0;flexible<=c.income-c.essentials;flexible+=c.budgetStep){const b=model.budget(c.income,c.essentials,flexible,c.goal);assert.equal(b.essentials+b.flexible+b.saved,c.income);if(b.saved){assert.ok(b.periods*b.saved>=c.goal);assert.ok((b.periods-1)*b.saved<c.goal);}}
  assert.equal(model.budget(c.income,c.essentials,c.income-c.essentials,c.goal).periods,null);
 });
 test(`${id}: a surprise cost is split between cash used and an explicit gap`,()=>{
  for(const contribution of [0,c.contribution,c.saveMax]){const r=model.savings(c.buffer,contribution,6,c.shock);assert.equal(r.before,c.buffer+contribution*6);assert.ok(r.after>=0);assert.equal(r.before-r.after+r.gap,c.shock);}
 });
 test(`${id}: investment purchasing power is consistent with inflation`,()=>{
  const r=model.growth(c.invest,c.rate,c.fee,c.inflation,c.years);
  assert.ok(Math.abs(r.purchasingPower*(1+c.inflation/100)**c.years-r.nominal)<1e-6);
  assert.ok(Math.abs(model.growth(c.invest,c.rate,c.fee,c.inflation,c.years,20).nominal-r.nominal*.8)<1e-6);
  assert.equal(model.growth(c.invest,0,0,0,20).nominal,c.invest);
 });
 test(`${id}: content has all five teaching chapters and valid control defaults`,()=>{
  assert.equal(c.topics.length,5);for(const t of c.topics){for(const field of ['title','text','everyday','aside','connection','assumptions'])assert.ok(typeof t[field]==='string'&&t[field].trim().length>0,field);assert.ok(t.words.length>=2);}
  assert.equal(c.fun%c.budgetStep,0);assert.equal(c.contribution%c.saveStep,0);assert.ok(c.fun<=c.income-c.essentials);
  if(id!=='child'){const slow=model.payoff(c.principal,c.apr,c.minPayment),fast=model.payoff(c.principal,c.apr,c.maxPayment);assert.ok(slow.paidOff&&fast.paidOff);assert.ok(fast.months<=slow.months);assert.ok(fast.interest<slow.interest);assert.ok(Math.abs(fast.total-c.principal-fast.interest)<1e-7);}
 });
}
const {payoff,growth,cashFlow,budget}=await import('../college/model.js');
test('repayment handles zero interest, a smaller last payment, and an unpayable balance',()=>{
 assert.deepEqual(payoff(100,0,30),{months:4,interest:0,total:100,paidOff:true});
 assert.deepEqual(payoff(100,12,101),{months:1,interest:1,total:101,paidOff:true});
 assert.equal(payoff(100,24,2).paidOff,false);
 assert.equal(payoff(0,24,5).total,0);
});
test('agreed bill timing changes a funding gap while conserving month-end cash',()=>{
 const a=cashFlow(1),b=cashFlow(4),c=cashFlow(18);assert.equal(a.ending,300);assert.equal(b.ending,300);assert.equal(c.ending,300);assert.equal(a.lowest,-550);assert.equal(b.lowest,-170);assert.equal(c.lowest,100);
});
test('fee comparisons and adverse real growth do not imply a guaranteed gain',()=>{
 assert.ok(growth(10000,6,1,2.5,20).nominal<growth(10000,6,.1,2.5,20).nominal);
 assert.ok(growth(10000,-5,2,6,40).purchasingPower<10000);
 assert.equal(growth(10000,6,1,2.5,0).nominal,10000);
});
test('invalid arithmetic inputs are rejected rather than rendered as plausible results',()=>{
 assert.throws(()=>budget(10,8,5,20),RangeError);assert.throws(()=>growth(100,NaN,1,2,5),TypeError);assert.throws(()=>payoff(100,12,0),RangeError);
});
test('every static HTML link and local script/style/image exists at a project subpath',async()=>{
 const files=[];async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name.startsWith('.'))continue;const full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full);else if(entry.name.endsWith('.html'))files.push(full);}}await walk(root);
 for(const file of files){const source=await readFile(file,'utf8');for(const match of source.matchAll(/(?:href|src)="([^"]+)"/g)){const link=match[1];if(/^(https?:|data:|#)/.test(link))continue;assert.ok(!link.startsWith('/'),`Absolute link breaks project Pages: ${link}`);const target=path.resolve(path.dirname(file),link.split(/[?#]/)[0]);const info=await stat(target);if(info.isDirectory())assert.ok((await stat(path.join(target,'index.html'))).isFile(),target);}}
});
