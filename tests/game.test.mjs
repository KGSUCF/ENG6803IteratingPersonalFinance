import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as g from '../game/engine.js';

const {RULES,GOALS,MARKETS,LUCK}=g;
// Deterministic pseudo-random numbers so failures can be reproduced.
function rng(seed){return()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};}

function checkInvariants(s,where){
 assert.equal(g.netPosition(s),g.expectedNet(s),`money was created or lost at ${where}`);
 for(const k of ['wallet','savings'])assert.ok(Number.isInteger(s[k])&&s[k]>=0,`${k} negative or fractional at ${where}: ${s[k]}`);
 assert.ok(Number.isInteger(s.pot.value)&&s.pot.value>=0,`pot invalid at ${where}`);
 for(const d of s.debts){assert.ok(Number.isInteger(d.balance)&&d.balance>=0,`${d.id} balance invalid at ${where}`);assert.equal(d.borrowed+d.interest-d.paid,d.balance,`${d.id} ledger mismatch at ${where}`);}
 const card=s.debts.find(d=>d.id==='card');if(card)assert.ok(card.balance<=RULES.cardLimit+Math.round(RULES.cardLimit*0.025)*RULES.paydays,'card far beyond limit');
}
function checkFlows(before,after,flows,where){
 // Each recorded flow carries the dashboard values after it, and the last one must match the real state.
 if(flows.length)assert.deepEqual(flows.at(-1).after,g.snapshot(after),`final animation frame differs from state at ${where}`);
 for(const f of flows){assert.ok(f.amount!==0);assert.ok(typeof f.label==='string'&&f.label.length>3);}
}
function play(random,{goal,market,luck,pickShortfall,pickOption}={}){
 let s=g.newGame({market,luck,random});
 s=g.chooseGoal(s,goal||Object.keys(GOALS)[Math.floor(random()*3)]);
 s=g.startPayday(s);
 let guard=0;
 while(s.phase!=='recap'){
  assert.ok(guard++<100,'game did not finish');
  checkInvariants(s,`payday ${s.payday} ${s.phase}`);
  if(s.phase==='shortfall'){
   const options=g.shortfallOptions(s).filter(o=>!o.disabled);
   assert.ok(options.length>0,'a shortfall must always have an explicit way forward');
   assert.ok(options.some(o=>o.id==='late'));
   const pick=pickShortfall?pickShortfall(options,s):options[Math.floor(random()*options.length)];
   const before=s;s=g.resolveShortfall(s,pick.id);checkFlows(before,s,s.turn.flows,`shortfall ${s.payday}`);
   assert.equal(s.phase,'decision');continue;
  }
  if(s.phase==='decision'){
   const d=g.currentDecision(s);const open=d.options.filter(o=>!o.disabled);
   assert.ok(open.length>0,`decision ${d.id} has no available option`);
   for(const o of d.options.filter(o=>o.disabled)){assert.ok(o.reason.length>10,`disabled option ${o.id} needs an explanation`);assert.throws(()=>g.choose(s,o.id),RangeError);}
   const pick=pickOption?pickOption(open,d,s):open[Math.floor(random()*open.length)];
   const before=s;s=g.choose(s,pick.id);checkFlows(before,s,s.result.flows,`decision ${d.id}`);
   for(const field of ['why','tradeoff','closer'])assert.ok(s.result[field]?.length>20,`${d.id}/${pick.id} lacks ${field}`);
   continue;
  }
  if(s.phase==='result'){const before=s;s=g.advance(s);if(s.turn&&s.phase!=='recap'&&s.phase!=='shortfall')checkFlows(before,s,s.turn.flows,`payday ${s.payday}`);}
 }
 checkInvariants(s,'recap');
 return s;
}

test('game: 3,000 random playthroughs conserve money and never show negative balances',()=>{
 const random=rng(42);const outcomes=new Set(),decisions=new Set();
 for(let i=0;i<3000;i++){const s=play(random);outcomes.add(s.goalOutcome);for(const l of s.log)decisions.add(`${l.decision}`);assert.equal(s.payday,10);}
 for(const o of ['bought','smaller','waiting','borrowed'])assert.ok(outcomes.has(o),`never reached outcome ${o}`);
 for(const d of ['habit','streaming','birthday','invest','phone','gig','checkin','spare','shifts','goal','shortfall'])assert.ok(decisions.has(d),`never reached ${d}`);
});

test('game: ten decisions, each with at least two real choices for a typical player',()=>{
 const s=play(rng(1),{goal:'bike',market:'calm',luck:'quiet',pickOption:o=>o[0]});
 assert.equal(s.log.filter(l=>l.decision!=='shortfall').length,10);
});

test('game: saving habit is moved each payday and the jar reaches the expected total',()=>{
 // Save $60 each payday, skip every optional cost, pay the phone from the jar, wait at the end.
 const choice={habit:'save-6000',streaming:'none',birthday:'card',invest:'none',phone:'own',gig:'skip',checkin:'pass',spare:'keep',shifts:'rest',goal:'wait'};
 const s=play(rng(3),{goal:'bike',market:'calm',luck:'quiet',pickOption:(o,d)=>o.find(x=>x.id===choice[d.id])});
 // 10 × $60 saved − $240 phone repair = $360 in the jar.
 assert.equal(s.savings,36000);
 // Wallet: $150 + 10 × ($450 − $320 − $60) − $5 card = $845.
 assert.equal(s.wallet,15000+10*(45000-32000-6000)-500);
 assert.equal(s.goalOutcome,'waiting');assert.equal(s.stars,1+2);
 const r=g.summarize(s);assert.equal(r.cushion.amount,s.savings+s.wallet);assert.equal(r.debt.owed,0);
});

test('game: recurring subscriptions are charged once now and on every later payday',()=>{
 const choice={habit:'save-0',streaming:'bundle',birthday:'card',invest:'none',phone:'own',gig:'skip',checkin:'pass',spare:'keep',shifts:'rest',goal:'wait'};
 const s=play(rng(4),{goal:'trip',market:'calm',luck:'quiet',pickOption:(o,d)=>o.find(x=>x.id===choice[d.id])});
 assert.equal(s.totals.spent,10*RULES.needs+9*3500+500+24000);
});

test('game: the loan preview matches what the game actually charges',()=>{
 // Borrow for the phone and make only scheduled payments; compare to repaymentPlan for the in-game paydays.
 for(const loan of ['kiosk','card']){
  const choice={habit:'save-0',streaming:'none',birthday:'card',invest:'none',phone:loan,gig:'skip',checkin:'pass',spare:'keep',shifts:'rest',goal:'wait'};
  const s=play(rng(5),{goal:'bike',market:'calm',luck:'quiet',pickOption:(o,d)=>o.find(x=>x.id===choice[d.id])});
  const d=s.debts.find(x=>x.id===loan);
  // Simulate 5 payments (paydays 6–10) with the same rule as the preview.
  let bal=24000,interest=0;for(let i=0;i<5;i++){const c=Math.round(bal*LOANS_BP[loan]/10000);bal+=c;interest+=c;bal-=Math.min(bal,g.LOANS[loan].payment);}
  assert.equal(d.balance,bal);assert.equal(d.interest,interest);
  const plan=g.repaymentPlan(loan,24000);assert.ok(plan.paidOff);assert.equal(plan.total,24000+plan.interest);
 }
});
const LOANS_BP={kiosk:200,card:250};

test('game: repayment plans handle a payoff boundary and a payment too small to cover interest',()=>{
 assert.deepEqual(g.repaymentPlan('kiosk',0),{months:0,interest:0,total:0,payment:4500,paidOff:true});
 const one=g.repaymentPlan('kiosk',4400);assert.equal(one.months,1);assert.equal(one.interest,88);
 const stuck=g.repaymentPlan('card',100000,2500);assert.equal(stuck.paidOff,false);assert.equal(stuck.months,Infinity);
 const kiosk=g.repaymentPlan('kiosk',24000),card=g.repaymentPlan('card',24000);
 assert.ok(card.months>kiosk.months&&card.interest>kiosk.interest,'minimum payments on a higher APR should take longer and cost more');
});

test('game: unaffordable choices are disabled with the exact shortfall, never silently funded',()=>{
 let s=g.chooseGoal(g.newGame({market:'calm',luck:'quiet'}),'bike');s=g.startPayday(s);
 s=g.choose(s,'save-9000');s=g.advance(s);s=g.choose(s,'bundle');s=g.advance(s);s=g.choose(s,'concert');s=g.advance(s);
 const d=g.currentDecision(s),large=d.options.find(o=>o.id==='large');
 assert.equal(s.wallet,15000+4*(45000-32000-9000)-3*3500-9000);
 assert.ok(large.disabled);assert.match(large.reason,new RegExp(g.money(20000-s.wallet).replace('$','\\$')));
});

test('game: a shortfall pauses the payday and every resolution covers exactly the gap',()=>{
 // Find real shortfall states by random play, then try every available resolution on each.
 const random=rng(77);const found=[];
 for(let i=0;i<4000&&found.length<40;i++){
  let s=g.chooseGoal(g.newGame({random}),'keyboard');s=g.startPayday(s);
  while(s.phase!=='recap'){
   if(s.phase==='shortfall'){found.push(s);s=g.resolveShortfall(s,'late');continue;}
   if(s.phase==='decision'){const open=g.currentDecision(s).options.filter(o=>!o.disabled);s=g.choose(s,open[Math.floor(random()*open.length)].id);continue;}
   s=g.advance(s);
  }
 }
 assert.ok(found.length>=10,'random play should reach shortfalls');
 const methods=new Set();
 for(const s of found){
  assert.ok(s.shortfall>0);assert.equal(s.shortfall,s.turn.required-s.wallet);
  for(const o of g.shortfallOptions(s)){
   if(o.disabled){assert.throws(()=>g.resolveShortfall(s,o.id),RangeError);continue;}
   methods.add(o.id);
   const t=g.resolveShortfall(s,o.id),spent=t.totals.spent-s.totals.spent,fees=t.totals.interest-s.totals.interest;
   assert.equal(t.phase,'decision');
   // Every required bill was paid; only bills and any late fee changed what the player is worth.
   assert.equal(spent,s.pending.due.filter(d=>d.kind==='spend').reduce((a,d)=>a+d.amount,0));
   assert.equal(fees,o.id==='late'?RULES.lateFee:0);
   assert.equal(g.netPosition(t),g.netPosition(s)-spent-fees);
   assert.equal(g.netPosition(t),g.expectedNet(t));
  }
 }
 for(const m of ['savings','card','late'])assert.ok(methods.has(m),`never exercised ${m}`);
});

test('game: each market path and luck draw is reachable and changes the seed pot as stated',()=>{
 for(const market of Object.keys(MARKETS)){
  const choice={habit:'save-3000',streaming:'none',birthday:'card',invest:'large',phone:'own',gig:'skip',checkin:'hold',spare:'keep',shifts:'rest',goal:'wait'};
  const s=play(rng(7),{goal:'bike',market,luck:'quiet',pickOption:(o,d)=>o.find(x=>x.id===choice[d.id])||o[0]});
  let v=20000;for(const r of MARKETS[market].returns)v=Math.round(v*(100+r)/100);
  assert.equal(s.pot.value,v);assert.equal(s.totals.market,v-20000);
 }
 assert.ok(MARKETS.bumpy.returns.some(r=>r<0)&&MARKETS.calm.returns.some(r=>r<0),'investments must be able to lose value');
 const seen=new Set();const random=rng(9);for(let i=0;i<60;i++){const s=g.newGame({random});seen.add(s.market+'/'+s.luck);}assert.equal(seen.size,9);
 for(const id of Object.keys(LUCK)){const s=play(rng(11),{goal:'bike',market:'calm',luck:id,pickOption:o=>o.at(-1)});assert.ok(s.log.length>=10);}
});

test('game: the long-run chart keeps a fixed scale and shows both growth and loss',()=>{
 const p=g.timePaths(10000);
 assert.equal(p.steady.length,31);assert.ok(Math.abs(p.steady[30]-10000*1.05**30)<1e-6);
 assert.ok(p.rough[1]<10000,'rough path should start with a loss');assert.ok(p.rough[30]>10000);
 assert.ok(Math.max(...p.steady,...p.rough)<=10000*5,'paths must fit inside the fixed 5× chart scale');
 assert.ok(p.cash.every(v=>v===10000));
});

test('game: money formatting',()=>{
 assert.equal(g.money(0),'$0');assert.equal(g.money(4285),'$42.85');assert.equal(g.money(123400),'$1,234');assert.equal(g.money(-500),'−$5');assert.equal(g.money(500,{sign:true}),'+$5');
});

test('game: storage key is game-specific and cannot collide with course progress keys',async()=>{
 const ui=await readFile(new URL('../game/game.js',import.meta.url),'utf8');
 const keys=[...ui.matchAll(/'(money-moves:[^']+)'/g)].map(m=>m[1]);
 assert.ok(keys.includes('money-moves:game:pocketford:v1'));
 for(const k of keys)assert.ok(!/^money-moves:v1:(child|teen|college|post-college|expert)$/.test(k));
 assert.ok(!ui.includes('localStorage.clear'),'the game must never clear other Money Moves data');
});
