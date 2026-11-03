// Ten Paydays in Pocketford — game rules and story.
// Pure functions only: every call returns a new state object, so the rules can be tested without a browser.
// All money is stored in whole cents to keep the arithmetic exact.

export const RULES = Object.freeze({
  paydays: 10,
  income: 45000,            // pay from the bakery job, after taxes, each payday
  needs: 32000,             // rent share + groceries + bus pass and phone
  needsBreakdown: [['Rent share', 20000], ['Groceries', 8000], ['Bus pass and phone plan', 4000]],
  startWallet: 15000,
  cardLimit: 100000,
  lateFee: 2500,
  missedShiftLoss: 3000,
  gigIncome: 3000,
  gigCost: 8000
});

export const GOALS = Object.freeze({
  bike: { id: 'bike', name: 'A trusty bike', short: 'bike', cost: 60000, why: 'Ride across Pocketford without waiting for the 7:42 bus.', smaller: { name: 'a second-hand bike and a new helmet', cost: 36000 } },
  trip: { id: 'trip', name: 'A beach weekend with friends', short: 'beach weekend', cost: 75000, why: 'Sand, snacks, and a group photo where everyone blinks.', smaller: { name: 'a day trip to the beach instead of a weekend', cost: 40000 } },
  keyboard: { id: 'keyboard', name: 'A keyboard and four music lessons', short: 'keyboard', cost: 85000, why: 'Learn the song that has been stuck in your head since spring.', smaller: { name: 'a used keyboard and free library videos', cost: 45000 } }
});

export const LOANS = Object.freeze({
  kiosk: { id: 'kiosk', name: 'Lending Kiosk loan', kind: 'installment', apr: 24, monthlyBp: 200, payment: 4500 },
  card: { id: 'card', name: 'Sparrow Store Card', kind: 'card', apr: 30, monthlyBp: 250, payment: 2000 },
  clinic: { id: 'clinic', name: 'Dental clinic payment plan', kind: 'installment', apr: 0, monthlyBp: 0, payment: 7000 },
  overdue: { id: 'overdue', name: 'Overdue bills', kind: 'overdue', apr: 0, monthlyBp: 0, payment: 0 }
});

// Each game draws its own month-by-month seed-pot changes from this list (each equally likely):
// mostly small moves, an occasional sharp drop, and a slightly positive average. Fictional, not market data.
export const MONTHLY_MOVES = Object.freeze([-12, -6, -3, -1, 0, 1, 2, 2, 3, 4, 5, 7]);
// Each game also draws a 30-year "random path" for the long-run chart from these yearly changes (illustration only).
export const YEARLY_MOVES = Object.freeze([-25, -12, -5, 0, 4, 6, 8, 10, 12, 15, 20, 24]);

// Two of these happen in every game, on paydays nobody can see in advance.
export const LUCK = Object.freeze({
  bonus: { id: 'bonus', name: 'Big bakery order', kind: 'income', amount: 10000, text: 'The bakery landed a wedding-cake order. Everyone gets a $100 bonus.' },
  gift: { id: 'gift', name: 'A card from Grandma Ottilie', kind: 'income', amount: 4000, text: 'Grandma Ottilie mailed a card with $40 inside. The occasion is unclear; the money is real.' },
  refund: { id: 'refund', name: 'Utility refund', kind: 'income', amount: 3500, text: 'The power company overcharged the building last winter. Your share of the refund is $35.' },
  fridge: { id: 'fridge', name: 'Fridge repair', kind: 'bill', amount: 9000, text: 'The apartment fridge stopped humming. Your share of the repair is $90, due now.' },
  vet: { id: 'vet', name: 'Biscuit visits the vet', kind: 'bill', amount: 6000, text: 'Moxie’s cat, Biscuit, ate a hair tie. Biscuit is fine. You agreed to split the $120 vet bill: $60 is yours, due now.' },
  bus: { id: 'bus', name: 'Bus pass price rises', kind: 'recurring', amount: 1000, text: 'Pocketford Transit raised the monthly pass by $10, starting this payday and every payday after.' }
});

// One of these emergencies happens in every game, on a payday drawn at random.
export const EMERGENCIES = Object.freeze({
  phone: { id: 'phone', name: 'Broken phone', cost: 24000, title: 'Crack! Your phone hits the bakery floor.', text: 'The screen looks like a spider web. The repair costs $240. You use the phone for work schedules, bus times, and messages.', aside: 'The phone landed screen-down, as is the ancient law of phones.' },
  tooth: { id: 'tooth', name: 'Toothache', cost: 20000, title: 'Ow. A tooth starts aching during the morning bake.', text: 'The dentist says it needs a filling soon: $200. Waiting usually makes dental problems worse and more expensive.', aside: 'The waiting room has a poster of a smiling molar. The molar looks smug.' },
  shoes: { id: 'shoes', name: 'Split work shoes', cost: 12000, title: 'Your work shoes split down the side.', text: 'The bakery requires non-slip shoes. A new pair costs $120.', aside: 'They split mid-slip. Only Moxie saw. Moxie now performs the reenactment nightly.' }
});

export const SUBSCRIPTIONS = Object.freeze({
  none: { id: 'none', name: 'No streaming', cost: 0, stars: 0 },
  one: { id: 'one', name: 'One streaming service', cost: 1200, stars: 1 },
  bundle: { id: 'bundle', name: 'The Mega Bundle', cost: 3500, stars: 2 }
});

export const CONCEPTS = Object.freeze({
  income: 'Income and expenses', needs: 'Needs and wants', budget: 'Budgeting', opportunity: 'Opportunity cost',
  goals: 'Saving for goals', emergency: 'Emergency reserves', borrowing: 'Borrowing costs', compounding: 'Compounding',
  time: 'Time and time horizons', risk: 'Risk', luck: 'Luck and circumstances'
});

const SAVE_OPTIONS = [0, 3000, 6000, 9000];
const FLEXIBLE = RULES.income - RULES.needs;

// ---------- helpers ----------
const clone = value => structuredClone(value);
export function money(cents, { sign = false } = {}) {
  const negative = cents < 0, abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100), part = abs % 100;
  const text = '$' + whole.toLocaleString('en-US') + (part ? '.' + String(part).padStart(2, '0') : '');
  return (negative ? '−' : sign ? '+' : '') + text;
}
export const debtTotal = s => s.debts.reduce((total, d) => total + d.balance, 0);
const debt = (s, id) => s.debts.find(d => d.id === id);
export const cardRoom = s => RULES.cardLimit - (debt(s, 'card')?.balance || 0);
export const goalOf = s => GOALS[s.goal];
export const snapshot = s => ({ wallet: s.wallet, savings: s.savings, pot: s.pot.value, debt: debtTotal(s), stars: s.stars });
// Net worth identity used by the tests: what you hold minus what you owe equals the start plus everything that flowed in or out.
export const netPosition = s => s.wallet + s.savings + s.pot.value - debtTotal(s);
export const expectedNet = s => RULES.startWallet + s.totals.earned - s.totals.spent - s.totals.interest + s.totals.market;

function flow(s, list, from, to, amount, label) {
  if (!amount) return;
  list.push({ from, to, amount, label, after: snapshot(s) });
}
function getDebt(s, id) {
  let d = debt(s, id);
  if (!d) {
    const t = LOANS[id];
    d = { id, name: t.name, kind: t.kind, apr: t.apr, monthlyBp: t.monthlyBp, payment: t.payment, balance: 0, borrowed: 0, interest: 0, paid: 0 };
    s.debts.push(d);
  }
  return d;
}
function borrow(s, list, id, amount, label) {
  const d = getDebt(s, id);
  d.balance += amount; d.borrowed += amount; s.wallet += amount;
  flow(s, list, 'debt', 'wallet', amount, label);
}
function spend(s, list, from, amount, label) {
  s[from] -= amount; s.totals.spent += amount;
  flow(s, list, from, 'spent', amount, label);
}
function move(s, list, from, to, amount, label) {
  if (from === 'pot') { s.pot.value -= amount; s.pot.withdrawn += amount; } else s[from] -= amount;
  if (to === 'pot') { s.pot.value += amount; s.pot.contributed += amount; } else s[to] += amount;
  flow(s, list, from, to, amount, label);
}
function repay(s, list, d, amount, label) {
  s.wallet -= amount; d.balance -= amount; d.paid += amount;
  flow(s, list, 'wallet', 'debt', amount, label || `Payment: ${d.name}`);
}
const paymentDue = d => d.kind === 'overdue' ? d.balance : Math.min(d.balance, d.payment);

/** Simulates repayment with the game's own rules: monthly interest is added, then the payment is made. */
export function repaymentPlan(loanId, balance, payment = LOANS[loanId].payment) {
  const bp = LOANS[loanId].monthlyBp;
  if (!(balance >= 0)) throw new RangeError('Balance must be zero or more.');
  let months = 0, interest = 0, left = balance;
  while (left > 0 && months < 600) {
    const charge = Math.round(left * bp / 10000);
    if (payment <= charge) return { months: Infinity, interest: Infinity, total: Infinity, payment, paidOff: false };
    left += charge; interest += charge;
    left -= Math.min(payment, left); months++;
  }
  return { months, interest, total: balance + interest, payment, paidOff: left === 0 };
}

/** Terms shown before any borrowing. For the card, the new amount is added to any existing card balance. */
export function loanTerms(s, loanId, amount) {
  const t = LOANS[loanId], existing = debt(s, loanId)?.balance || 0;
  const plan = repaymentPlan(loanId, existing + amount);
  return {
    name: t.name, apr: t.apr, monthlyRate: t.monthlyBp / 100, amount, existing, balance: existing + amount,
    payment: t.payment, kind: t.kind, months: plan.months, interest: plan.interest, total: plan.total,
    paydaysLeft: RULES.paydays - s.payday, withinLimit: loanId !== 'card' || existing + amount <= RULES.cardLimit
  };
}

// ---------- game lifecycle ----------
const MIDDLE = ['birthday', 'invest', 'checkin', 'gig', 'spare', 'shifts', 'emergency'];
export function newGame({ random = Math.random, ...fixed } = {}) {
  const pick = list => list[Math.min(list.length - 1, Math.floor(random() * list.length))];
  const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(random() * (i + 1))); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // The goal plan opens the game and the goal decision closes it. Everything between is shuffled each game,
  // except that the seed-pot check-in always comes at least two paydays after the chance to invest.
  let middle;
  do middle = shuffle(MIDDLE); while (middle.indexOf('checkin') < middle.indexOf('invest') + 2);
  const schedule = fixed.schedule || ['habit', 'streaming', ...middle, 'goal'];
  const emergencyDay = schedule.indexOf('emergency') + 1;
  const open = shuffle([2, 3, 4, 5, 6, 7, 8, 9].filter(p => p !== emergencyDay)), kinds = shuffle(Object.keys(LUCK));
  const luck = fixed.luck || [{ id: kinds[0], payday: open[0] }, { id: kinds[1], payday: open[1] }].sort((a, b) => a.payday - b.payday);
  return {
    version: 2, phase: 'intro', payday: 0, goal: null, schedule,
    emergency: fixed.emergency || pick(Object.keys(EMERGENCIES)), glueHolds: fixed.glueHolds ?? random() < 0.5, glueFailDue: null,
    luck, events: [],
    returns: fixed.returns || Array.from({ length: RULES.paydays }, () => pick(MONTHLY_MOVES)),
    longRun: fixed.longRun || Array.from({ length: 30 }, () => pick(YEARLY_MOVES)),
    wallet: RULES.startWallet, savings: 0,
    pot: { value: 0, contributed: 0, withdrawn: 0, history: [], plantedAt: null, moves: [] },
    debts: [], autoSave: null, subscription: 'none', gig: false, missedShifts: 0, extraNeeds: 0, stars: 0,
    totals: { earned: 0, spent: 0, interest: 0, market: 0 },
    goalOutcome: null, log: [], turn: null, result: null, shortfall: 0, pending: null
  };
}

export function chooseGoal(state, goalId) {
  if (!GOALS[goalId]) throw new RangeError('Unknown goal.');
  if (state.phase !== 'intro') throw new Error('A goal is chosen before the first payday.');
  const s = clone(state); s.goal = goalId; s.phase = 'ready'; return s;
}

export function startPayday(state) {
  if (!['ready', 'result'].includes(state.phase) || state.payday >= RULES.paydays) throw new Error('No payday is due.');
  const s = clone(state); s.payday += 1; s.result = null;
  const n = s.payday, flows = [], notes = [];
  // 1. Anything already in the seed pot moves with this game's drawn monthly change.
  if (s.pot.value > 0) s.pot.moves.push(s.returns[n - 1]);
  if (s.pot.value > 0 && s.returns[n - 1] !== 0) {
    const r = s.returns[n - 1], before = s.pot.value;
    s.pot.value = Math.round(before * (100 + r) / 100); s.totals.market += s.pot.value - before;
    flow(s, flows, 'pot', 'pot', s.pot.value - before, `Seed pot ${r >= 0 ? 'rose' : 'fell'} ${Math.abs(r)}% this month`);
  }
  if (s.pot.contributed > 0) s.pot.history.push({ payday: n, value: s.pot.value });
  // 2. Money in.
  let pay = RULES.income, payLabel = 'Bakery pay arrives';
  if (s.missedShifts > 0) { pay -= RULES.missedShiftLoss; s.missedShifts -= 1; payLabel = `Bakery pay (${money(RULES.missedShiftLoss)} less: missed shift-swap messages)`; }
  s.wallet += pay; s.totals.earned += pay; flow(s, flows, 'paycheck', 'wallet', pay, payLabel);
  if (s.gig) { s.wallet += RULES.gigIncome; s.totals.earned += RULES.gigIncome; flow(s, flows, 'paycheck', 'wallet', RULES.gigIncome, 'Bike-repair jobs'); }
  const drawn = s.luck.find(l => l.payday === n), luck = drawn ? LUCK[drawn.id] : null;
  if (luck) {
    notes.push({ type: 'luck', good: luck.kind === 'income', id: luck.id, title: luck.name, text: luck.text });
    s.events.push({ payday: n, name: luck.name, good: luck.kind === 'income' });
    if (luck.kind === 'income') { s.wallet += luck.amount; s.totals.earned += luck.amount; flow(s, flows, 'paycheck', 'wallet', luck.amount, luck.name); }
    if (luck.kind === 'recurring') s.extraNeeds += luck.amount;
  }
  const glueFails = s.glueFailDue === n;
  if (glueFails) {
    notes.push({ type: 'luck', good: false, id: 'glue', title: 'The glue gave up', text: 'Juno’s patch held for a while, then the shoe split again. A new pair costs $120 after all.' });
    s.events.push({ payday: n, name: 'Shoe glue gave up', good: false }); s.glueFailDue = null;
  }
  // 3. Interest is added to anything still owed.
  for (const d of s.debts) {
    if (d.balance > 0 && d.monthlyBp > 0) {
      const charge = Math.round(d.balance * d.monthlyBp / 10000);
      d.balance += charge; d.interest += charge; s.totals.interest += charge;
      flow(s, flows, 'debt', 'debt', charge, `Interest added: ${d.name} (${d.monthlyBp / 100}% a month)`);
    }
  }
  // 4. Required payments.
  const due = RULES.needsBreakdown.map(([label, amount]) => ({ kind: 'spend', label, amount }));
  const sub = SUBSCRIPTIONS[s.subscription];
  if (sub.cost) due.push({ kind: 'spend', label: sub.name, amount: sub.cost });
  if (s.extraNeeds) due.push({ kind: 'spend', label: 'Bus pass price increase', amount: s.extraNeeds });
  if (luck?.kind === 'bill') due.push({ kind: 'spend', label: luck.name, amount: luck.amount });
  if (glueFails) due.push({ kind: 'spend', label: 'New work shoes', amount: EMERGENCIES.shoes.cost });
  for (const d of s.debts) if (d.balance > 0) due.push({ kind: 'debt', id: d.id, label: d.kind === 'overdue' ? 'Overdue bills plus late fee' : `Payment: ${d.name}`, amount: paymentDue(d) });
  s.pending = { due };
  s.turn = { payday: n, flows, notes };
  const required = due.reduce((t, item) => t + item.amount, 0);
  if (s.wallet >= required) finishPayday(s);
  else { s.shortfall = required - s.wallet; s.phase = 'shortfall'; s.turn.required = required; }
  return s;
}

function finishPayday(s) {
  const { flows, notes } = s.turn;
  for (const item of s.pending.due) {
    if (item.kind === 'debt') repay(s, flows, debt(s, item.id), item.amount, item.label);
    else spend(s, flows, 'wallet', item.amount, item.label);
  }
  if (s.autoSave) {
    const amount = Math.min(s.autoSave, s.wallet);
    if (amount) move(s, flows, 'wallet', 'savings', amount, 'Automatic transfer to the savings jar');
    if (amount < s.autoSave) notes.push({ type: 'warning', title: 'Saving habit squeezed', text: `Only ${money(amount)} of your ${money(s.autoSave)} automatic saving fit this payday, because the wallet ran out after required payments.` });
  }
  s.pending = null; s.shortfall = 0; s.phase = 'decision';
}

export function shortfallOptions(s) {
  const gap = s.shortfall, room = cardRoom(s), options = [];
  const withCard = (used, source) => {
    const rest = gap - used;
    return rest > 0 ? { text: `Use ${money(used)} from ${source} and put the remaining ${money(rest)} on the Sparrow Card.`, card: rest, disabled: rest > room } : { text: `Use ${money(gap)} from ${source}.`, card: 0, disabled: false };
  };
  if (s.savings > 0) { const o = withCard(Math.min(gap, s.savings), 'your savings jar'); options.push({ id: 'savings', label: 'Dip into the savings jar', detail: o.text, disabled: o.disabled, reason: o.disabled ? `The card has only ${money(room)} of room left.` : '' }); }
  if (s.pot.value > 0) { const o = withCard(Math.min(gap, s.pot.value), 'the seed pot (selling at today’s value)'); options.push({ id: 'pot', label: 'Sell part of the seed pot', detail: o.text, disabled: o.disabled, reason: o.disabled ? `The card has only ${money(room)} of room left.` : '' }); }
  options.push({ id: 'card', label: 'Put it on the Sparrow Card', detail: `Borrow ${money(gap)} at 30% APR. Interest is added each payday until it is repaid.`, disabled: gap > room, reason: gap > room ? `The card limit is ${money(RULES.cardLimit)}; only ${money(room)} of room is left.` : '' });
  options.push({ id: 'late', label: 'Pay late', detail: `${money(gap)} becomes overdue. It must be paid in full next payday with a ${money(RULES.lateFee)} late fee.` });
  return options;
}

export function resolveShortfall(state, method) {
  if (state.phase !== 'shortfall') throw new Error('There is no shortfall to resolve.');
  const option = shortfallOptions(state).find(o => o.id === method);
  if (!option || option.disabled) throw new RangeError('That way of covering the shortfall is not available.');
  const s = clone(state), flows = s.turn.flows, gap = s.shortfall;
  if (method === 'savings' || method === 'pot') {
    const used = Math.min(gap, method === 'savings' ? s.savings : s.pot.value);
    move(s, flows, method, 'wallet', used, method === 'savings' ? 'Savings jar covers the shortfall' : 'Seed pot sold to cover the shortfall');
    if (gap > used) borrow(s, flows, 'card', gap - used, 'Rest of shortfall on the Sparrow Card');
  } else if (method === 'card') borrow(s, flows, 'card', gap, 'Shortfall on the Sparrow Card');
  else {
    const d = getDebt(s, 'overdue');
    borrow(s, flows, 'overdue', gap, 'Unpaid bills become overdue');
    d.balance += RULES.lateFee; d.interest += RULES.lateFee; s.totals.interest += RULES.lateFee;
    flow(s, flows, 'debt', 'debt', RULES.lateFee, 'Late fee added');
  }
  s.turn.shortfall = { gap, method };
  s.log.push({ payday: s.payday, decision: 'shortfall', title: 'Covering a shortfall', choice: option.label, concepts: ['emergency', 'borrowing'] });
  finishPayday(s);
  return s;
}

// ---------- decisions ----------
const option = (id, label, detail, extra = {}) => ({ id, label, detail, disabled: false, reason: '', ...extra });
function needWallet(s, o, cost) {
  o.cost = cost;
  if (s.wallet < cost) { o.disabled = true; o.reason = `Your wallet has ${money(s.wallet)}. You would be ${money(cost - s.wallet)} short.`; }
  return o;
}
const spareAmount = s => Math.min(10000, Math.floor(s.wallet / 100) * 100);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const DECISIONS = {
  habit: {
    id: 'habit', speaker: 'shelby', concepts: ['income', 'budget', 'goals'],
    build: s => ({
      kicker: `Payday ${s.payday} · Make a plan`,
      title: 'How much should slide into your savings jar each payday?',
      text: `Your pay is ${money(RULES.income)} and your needs cost ${money(RULES.needs)}. That leaves ${money(FLEXIBLE)} of flexible money each payday. An automatic transfer happens right after the bills, before you get a chance to spend it.`,
      aside: 'Professor Shelby is a tortoise. Shelby has opinions about slow and steady, and none of them are short.',
      options: SAVE_OPTIONS.map(amount => option(`save-${amount}`, amount ? `Save ${money(amount)} each payday` : 'Save nothing automatically',
        amount ? `About ${money(amount * RULES.paydays)} in the jar after ten paydays, if nothing else changes. ${money(FLEXIBLE - amount)} stays in your wallet each payday.` : `All ${money(FLEXIBLE)} stays in your wallet each payday. You can still move money to savings later.`, { amount }))
    }),
    apply(s, o, flows) {
      s.autoSave = o.amount;
      if (o.amount) move(s, flows, 'wallet', 'savings', o.amount, 'First automatic transfer');
      const goal = goalOf(s);
      return {
        why: o.amount ? `Saving first turns a goal into a schedule. At ${money(o.amount)} a payday, the jar alone would reach your ${money(goal.cost)} ${goal.short} in about ${Math.ceil(goal.cost / o.amount)} paydays.` : 'No automatic saving keeps every payday flexible. Any saving now depends on what is left over later, and leftovers have a way of finding new jobs.',
        tradeoff: o.amount >= 9000 ? `More saved means only ${money(FLEXIBLE - o.amount)} left for everything else each payday. A surprise or a fun plan could squeeze the habit.` : o.amount ? `A middle path: steady progress and some room for wants.` : 'Maximum flexibility now, slower progress toward the goal.',
        closer: 'Budgeting is giving every dollar a job before the month starts. “Pay yourself first” means the saving job goes near the front of the line, right after needs.'
      };
    }
  },
  streaming: {
    id: 'streaming', speaker: 'moxie', concepts: ['needs', 'opportunity', 'budget'],
    build: s => ({
      kicker: `Payday ${s.payday} · A recurring cost`,
      title: 'Moxie wants to set up movie nights.',
      text: 'Your roommate Moxie has found three choices for the apartment TV. Any subscription is charged now and again every payday until the game ends.',
      aside: 'Moxie has already filed the Mega Bundle under “self-care.” Moxie files many things under “self-care.”',
      options: Object.values(SUBSCRIPTIONS).map(sub => needWallet(s, option(sub.id, sub.cost ? `${sub.name}: ${money(sub.cost)} each payday` : 'Skip streaming; borrow library movies',
        sub.cost ? `${money(sub.cost * (RULES.paydays - s.payday + 1))} across the ${RULES.paydays - s.payday + 1} paydays left, including this one. ${'★'.repeat(sub.stars)} cozy nights in.` : 'Costs nothing. Library DVDs, popcorn, and Moxie’s commentary.', { stars: sub.stars, sub: sub.id }), sub.cost))
    }),
    apply(s, o, flows) {
      const sub = SUBSCRIPTIONS[o.sub], times = RULES.paydays - s.payday + 1; s.subscription = sub.id;
      if (sub.cost) spend(s, flows, 'wallet', sub.cost, sub.name);
      s.stars += sub.stars;
      return {
        why: sub.cost ? `A small recurring cost adds up: ${money(sub.cost)} × ${times} paydays = ${money(sub.cost * times)}. It is a want, and wants can be worth paying for.` : 'Skipping saves money every payday, not just once. Recurring costs are some of the easiest to forget.',
        tradeoff: sub.cost ? `The opportunity cost is what else ${money(sub.cost * times)} could have done, such as reaching your goal sooner.` : 'You keep more money; movie nights depend on the library’s mood and Moxie’s DVD collection.',
        closer: 'A need keeps life running (rent, food, getting to work). A want makes life nicer. Both belong in a budget; the trick is knowing which is which and choosing on purpose.'
      };
    }
  },
  birthday: {
    id: 'birthday', speaker: 'juno', concepts: ['opportunity', 'needs', 'goals'],
    build: s => {
      const goal = goalOf(s), pct = c => Math.round(c / goal.cost * 100);
      return {
        kicker: `Payday ${s.payday} · Something fun`,
        title: 'Juno’s birthday is this weekend.',
        text: `Your friend Juno runs the bike co-op and is turning twenty-something. Friends are planning a concert. Remember: every dollar spent here is a dollar not in the jar for your ${goal.short}.`,
        aside: 'Juno asked for “no fuss.” Juno also made a seven-song playlist titled “fuss.”',
        options: [
          needWallet(s, option('concert', 'Go to the concert: $90', `★★★ A big night out. That is ${pct(9000)}% of your goal’s price.`, { stars: 3 }), 9000),
          needWallet(s, option('picnic', 'Host a park picnic: $25', `★★ Snacks, games, a cake that leans slightly. ${pct(2500)}% of your goal’s price.`, { stars: 2 }), 2500),
          needWallet(s, option('card', 'Send a funny card: $5', 'You miss the party, but the card is very funny.', { stars: 0 }), 500),
          option('call', 'Call Juno and sing, badly: free', '★ No cost. Juno laughs so hard the call drops twice.', { stars: 1, cost: 0 })
        ]
      };
    },
    apply(s, o, flows) {
      if (o.cost) spend(s, flows, 'wallet', o.cost, o.id === 'concert' ? 'Concert ticket' : o.id === 'picnic' ? 'Picnic supplies' : 'Birthday card');
      s.stars += o.stars;
      return {
        why: 'Opportunity cost is the next-best thing you give up. Money spent on the party cannot also go into the jar, and money in the jar cannot also go to the party.',
        tradeoff: o.id === 'concert' ? 'You chose a memorable night over faster progress. That is a real priority, not a mistake.' : o.id === 'picnic' ? 'You found a cheaper way to celebrate. You gave up some concert sparkle and kept more money.' : o.id === 'call' ? 'You kept all your money and still showed up, just by phone. You gave up the party itself.' : 'You kept almost all your money and gave up time with friends. That might be right this month, and not every month.',
        closer: 'There is no single correct price for fun. Comparing a choice to your goal (“that is 12% of my bike”) makes the tradeoff visible without making it for you.'
      };
    }
  },
  invest: {
    id: 'invest', speaker: 'shelby', concepts: ['compounding', 'risk', 'time'],
    build: s => ({
      kicker: `Payday ${s.payday} · Planting seeds`,
      title: 'Professor Shelby offers you a spot in the Seed Pot.',
      text: 'The Seed Pot is a pretend investment. Its value changes every month, and it can lose money. Over many years, investments like this have often grown, but nothing is guaranteed. The savings jar never loses value in this game, but it does not grow either.',
      aside: 'Shelby has been tending the same pot for 41 years. Shelby describes this as “a quick start.”',
      options: [
        option('none', 'Keep everything in cash for now', 'No risk of a drop, no chance of growth. Your goal is less than a year away.', { amount: 0 }),
        needWallet(s, option('small', 'Plant $100 from your wallet', 'Its value will move up or down each month, starting next payday.', { amount: 10000 }), 10000),
        needWallet(s, option('large', 'Plant $200 from your wallet', 'More chance to grow, more to lose if the pot drops.', { amount: 20000 }), 20000)
      ],
      chart: true
    }),
    apply(s, o, flows) {
      if (o.amount) { move(s, flows, 'wallet', 'pot', o.amount, 'Planted in the seed pot'); s.pot.plantedAt ??= s.payday; s.pot.history.push({ payday: s.payday, value: s.pot.value }); }
      return {
        why: o.amount ? 'Investing trades certainty for a chance of growth. Growth compounds: gains can earn gains of their own, which matters most over long periods.' : 'Money you need within months is usually kept somewhere steady. Your goal is close, so a drop could arrive at a bad time.',
        tradeoff: o.amount ? 'Money in the pot is still yours, but selling after a drop locks in the loss. It is less flexible than the jar.' : 'You gave up possible growth in exchange for knowing exactly what you have.',
        closer: 'Time horizon is how long until you need the money. A long horizon gives an investment time to recover from drops; a short horizon does not. Use “Look closer” on the time chart to see growth and a rough patch on the same fixed scale.'
      };
    }
  },
  emergency: {
    id: 'emergency', speaker: 'narrator', event: true, concepts: ['emergency', 'borrowing', 'luck'],
    build: s => {
      const e = EMERGENCIES[s.emergency], cost = e.cost, own = s.savings + s.wallet, left = RULES.paydays - s.payday;
      const useOwn = option('own', 'Pay from the savings jar, then the wallet', own >= cost ? `Uses ${money(Math.min(cost, s.savings))} from the jar${cost > s.savings ? ` and ${money(cost - s.savings)} from the wallet` : ''}. No interest.` : '', { cost });
      if (own < cost) { useOwn.disabled = true; useOwn.reason = `The jar and wallet hold ${money(own)} together. You would be ${money(cost - own)} short.`; }
      const options = [useOwn];
      if (s.pot.value > 0) {
        const p = option('pot', `Sell seed-pot value: worth ${money(s.pot.value)} today`, `You planted ${money(s.pot.contributed)}. Selling now locks in today’s value.`, { cost });
        if (s.pot.value + s.wallet < cost) { p.disabled = true; p.reason = `The pot and wallet hold ${money(s.pot.value + s.wallet)}; you would be ${money(cost - s.pot.value - s.wallet)} short.`; }
        options.push(p);
      }
      const kiosk = loanTerms(s, 'kiosk', cost), card = loanTerms(s, 'card', cost);
      options.push(option('kiosk', 'Borrow from the Lending Kiosk', `${money(cost)} at 24% APR. ${money(kiosk.payment)} every payday for ${plural(kiosk.months, 'payday')}.`, { cost, terms: kiosk }));
      const c = option('card', 'Put it on the Sparrow Store Card', `${money(cost)} at 30% APR. Minimum ${money(card.payment)} each payday: about ${plural(card.months, 'payday')} to repay.`, { cost, terms: card });
      if (!card.withinLimit) { c.disabled = true; c.reason = `The card limit is ${money(RULES.cardLimit)}.`; }
      options.push(c);
      if (e.id === 'phone') { const missed = Math.min(2, left); options.push(option('flip', 'Use Grandpa Ozzie’s old flip phone', `Free, but you miss shift-swap messages: ${money(RULES.missedShiftLoss)} less pay on each of the next ${plural(missed, 'payday')}.`, { cost: 0, missed })); }
      if (e.id === 'tooth') { const clinic = loanTerms(s, 'clinic', cost); options.push(option('clinic', 'Ask the clinic for a payment plan', `${money(clinic.payment)} each payday for ${plural(clinic.months, 'payday')}, with no interest. It still counts as money you owe.`, { cost, terms: clinic })); }
      if (e.id === 'shoes') options.push(needWallet(s, option('glue', 'Let Juno glue them: $20', 'Much cheaper. Juno says the patch “usually holds.” Whether it does is down to luck.', {}), 2000));
      return { kicker: `Payday ${s.payday} · Unexpected event`, title: e.title, text: `${e.text} Nobody planned this; that is what makes it an emergency.`, aside: e.aside, options };
    },
    apply(s, o, flows) {
      const e = EMERGENCIES[s.emergency], cost = e.cost, what = { phone: 'Phone repair', tooth: 'Dental filling', shoes: 'New work shoes' }[e.id];
      if (o.id === 'own') {
        const fromJar = Math.min(cost, s.savings);
        spend(s, flows, 'savings', fromJar, `${what} (from savings jar)`);
        if (cost > fromJar) spend(s, flows, 'wallet', cost - fromJar, `${what} (from wallet)`);
      } else if (o.id === 'pot') {
        move(s, flows, 'pot', 'wallet', Math.min(cost, s.pot.value), 'Seed pot sold to pay for it');
        spend(s, flows, 'wallet', cost, what);
      } else if (['kiosk', 'card', 'clinic'].includes(o.id)) {
        borrow(s, flows, o.id, cost, { kiosk: 'Borrowed from the Lending Kiosk', card: 'Charged to the Sparrow Card', clinic: 'Clinic payment plan' }[o.id]);
        spend(s, flows, 'wallet', cost, what);
      } else if (o.id === 'flip') s.missedShifts = o.missed;
      else if (o.id === 'glue') { spend(s, flows, 'wallet', 2000, 'Juno’s shoe glue'); if (!s.glueHolds) s.glueFailDue = s.payday + 1; }
      const plan = o.terms;
      const texts = {
        own: ['This is what an emergency reserve is for: a surprise cost became an inconvenience instead of a debt.', 'Your cushion and goal progress shrank, but nothing is owed and future paydays are untouched.'],
        pot: ['Investments can cover emergencies, but you sell at whatever the price is that day, high or low.', 'You kept your jar but gave up any future growth (or recovery) on the part you sold.'],
        kiosk: [`Borrowing solved it today. Repaying costs about ${money(plan?.interest || 0)} in interest, and the payments come out of each future payday.`, 'You kept your savings but committed future money. Less flexibility if another surprise arrives.'],
        card: [`Borrowing solved it today. At minimum payments, repaying costs about ${money(plan?.interest || 0)} in interest and takes many paydays.`, 'You kept your savings but committed future money. Less flexibility if another surprise arrives.'],
        clinic: ['A no-interest payment plan spreads the cost without making it bigger. Some providers offer one; it is worth asking.', 'Nothing extra is charged, but the payments still come first every payday until it is repaid.'],
        flip: ['You avoided paying anything now, but the cost showed up another way: lower pay. Not everyone has a spare phone to borrow; circumstances shape options.', `About ${money(RULES.missedShiftLoss * (o.missed || 0))} less income, and a phone from 2009.`],
        glue: ['A cheap fix can work, or it can fail and cost more in the end. You took a risk to keep money now.', 'You saved $100 today if the glue holds. If it does not, you pay for the glue and the shoes.']
      }[o.id];
      return { why: texts[0], tradeoff: texts[1], closer: 'Emergencies are not a sign of doing anything wrong. Luck decides what breaks and when; a reserve, insurance, or support from others decides how much it hurts. Many people keep a cushion of several months of needs, built a little at a time.' };
    }
  },
  gig: {
    id: 'gig', speaker: 'juno', concepts: ['income', 'time', 'opportunity'],
    build: s => { const left = RULES.paydays - s.payday, net = RULES.gigIncome * left - RULES.gigCost; return {
      kicker: `Payday ${s.payday} · More income?`,
      title: 'Juno offers you a bike-repair kit.',
      text: `Neighbors keep asking Juno for help with flat tires. With an ${money(RULES.gigCost)} kit, you could fix a few on Sunday afternoons. Juno estimates ${money(RULES.gigIncome)} each payday for the ${plural(left, 'payday')} left in the game.`,
      aside: 'The kit includes one wrench that nobody can identify. Juno calls it “the mystery wrench” with deep respect.',
      options: [
        needWallet(s, option('buy', `Buy the kit: ${money(RULES.gigCost)}`, `${money(RULES.gigIncome * left)} extra over ${plural(left, 'payday')}: ${net >= 0 ? `a gain of ${money(net)}` : `a loss of ${money(-net)}`} after the kit, within this game. Sunday afternoons become work.`, {}), RULES.gigCost),
        option('skip', 'Keep Sundays free', '★ Sleep in, read, wander the farmers’ market.', { stars: 1 })
      ]
    }; },
    apply(s, o, flows) {
      if (o.id === 'buy') { spend(s, flows, 'wallet', RULES.gigCost, 'Bike-repair kit'); s.gig = true; } else s.stars += 1;
      const left = RULES.paydays - s.payday, net = RULES.gigIncome * left - RULES.gigCost;
      return {
        why: o.id === 'buy' ? 'Spending money to earn money is an investment in your own skills. It only pays off if enough time is left to earn it back.' : 'Free time has value too. Income is not the only thing a week is for.',
        tradeoff: o.id === 'buy' ? `It takes about ${Math.ceil(RULES.gigCost / RULES.gigIncome)} paydays just to earn back the ${money(RULES.gigCost)}. With ${plural(left, 'payday')} left, that is ${net >= 0 ? `a ${money(net)} gain` : `a ${money(-net)} loss`} within the game, though the kit keeps working afterward.` : net > 0 ? `You gave up a possible ${money(net)} gain in exchange for rest.` : `With only ${plural(left, 'payday')} left, the kit would not have paid for itself within the game anyway.`,
        closer: 'The same choice gives different results depending on time left. Juno’s kit pays back slowly: it is a better deal early in the year than late.'
      };
    }
  },
  checkin: {
    id: 'checkin', speaker: 'shelby', concepts: ['risk', 'time', 'compounding'],
    build: s => {
      if (s.pot.value > 0) {
        const change = s.pot.value + s.pot.withdrawn - s.pot.contributed;
        return {
          kicker: `Payday ${s.payday} · Seed pot check-in`,
          title: `Your seed pot is worth ${money(s.pot.value)}.`,
          text: `You planted ${money(s.pot.contributed)}${s.pot.withdrawn ? ` and sold ${money(s.pot.withdrawn)}` : ''}. So far that is ${change >= 0 ? 'a gain' : 'a loss'} of ${money(Math.abs(change))}. Moxie is pacing. Shelby is eating a strawberry very slowly.`,
          aside: '“Do something!” says Moxie. “I am,” says Shelby, chewing.',
          options: [
            option('hold', 'Leave it alone', 'Ride out the ups and downs. It could rise or fall from here.'),
            option('sell', 'Sell it all and move it to the savings jar', `Locks in ${money(s.pot.value)}. No more changes, up or down.`),
            needWallet(s, option('add', 'Add $50 more from the wallet', 'Bigger pot, bigger swings.'), 5000)
          ],
          chart: true
        };
      }
      return {
        kicker: `Payday ${s.payday} · A second chance to plant`,
        title: 'Shelby asks: “Seed pot? Still room.”',
        text: `You did not invest earlier. You could plant $100 now. Only ${plural(RULES.paydays - s.payday, 'more monthly change')} remain in this game, so there is little time for ups and downs to even out.`,
        aside: 'Shelby says “still room” about the pot, the bench, and the strawberry bowl.',
        options: [
          needWallet(s, option('plant', 'Plant $100 now', `${plural(RULES.paydays - s.payday, 'payday')} of ups and downs ahead.`), 10000),
          option('pass', 'Stay in cash', 'Keep it steady and simple.')
        ],
        chart: true
      };
    },
    apply(s, o, flows) {
      if (o.id === 'sell') move(s, flows, 'pot', 'savings', s.pot.value, 'Seed pot sold into the savings jar');
      if (o.id === 'add') { move(s, flows, 'wallet', 'pot', 5000, 'Added to the seed pot'); s.pot.history.push({ payday: s.payday, value: s.pot.value }); }
      if (o.id === 'plant') { move(s, flows, 'wallet', 'pot', 10000, 'Planted in the seed pot'); s.pot.plantedAt ??= s.payday; s.pot.history.push({ payday: s.payday, value: s.pot.value }); }
      const texts = {
        hold: ['Holding means accepting that the value will keep moving. Short-term drops do not decide the long-term result, but recovery is not guaranteed.', 'You kept the chance of a rebound and the risk of further drops.'],
        sell: ['Selling turns a moving value into a fixed one. If the pot was down, the loss is now real; if it was up, the gain is now safe.', 'You gave up future ups and downs for certainty before your goal date.'],
        add: ['Adding during any month buys more of the pot at that month’s price. Whether it was a good moment is only known later.', 'More money is exposed to risk, and less is in your wallet.'],
        plant: ['Starting later gives compounding less time to work. With a short horizon, luck matters more than growth.', 'You chose a chance of growth with very little time for recovery.'],
        pass: ['Your money stays steady. For a goal a few months away, steady is a sensible fit.', 'You give up any chance of growth for this money.']
      }[o.id];
      return { why: texts[0], tradeoff: texts[1], closer: 'Risk is not only “could I lose money?” It is also “could I lose it right before I need it?” The time chart shows why long horizons and short horizons call for different choices.' };
    }
  },
  spare: {
    id: 'spare', speaker: 'moxie', concepts: ['borrowing', 'goals', 'luck'],
    build: s => {
      const amount = spareAmount(s), owed = debtTotal(s), today = s.luck.find(l => l.payday === s.payday), luck = today ? LUCK[today.id] : null;
      const highest = s.debts.filter(d => d.balance > 0).sort((a, b) => b.monthlyBp - a.monthlyBp)[0];
      const none = amount === 0 ? { disabled: true, reason: 'Your wallet is empty after this payday’s bills.' } : {};
      const options = [];
      if (owed > 0) options.push(option('repay', `Pay ${money(Math.min(amount, owed))} extra toward debt`, `Goes to the ${highest.name} first${highest.apr ? `, the highest rate (${highest.apr}% APR)` : ''}. Less interest from now on.`, { ...none, amount: Math.min(amount, owed) }));
      options.push(option('save', `Move ${money(amount)} into the savings jar`, 'Closer to your goal and a bigger cushion.', { ...none, amount }));
      options.push(option('treat', `Take a cooking class with Moxie: ${money(amount)}`, '★★ Dumplings, flour everywhere, a new friend from the class.', { ...none, amount, stars: 2 }));
      options.push(option('keep', 'Leave it in the wallet', 'Keep it handy. No decision is also a decision.', { amount: 0 }));
      return {
        kicker: `Payday ${s.payday} · ${luck ? luck.name : 'Spare cash'}`,
        title: amount ? `Moxie asks what the spare ${money(amount)} is for.` : 'The wallet is empty this payday.',
        text: `${luck ? luck.text + ' ' : ''}${amount ? `After bills, your wallet has ${money(s.wallet)}.` : 'There is nothing spare to decide about right now.'}`,
        aside: luck?.kind === 'income' ? 'Moxie has suggested celebrating the extra money by spending the extra money. Moxie is consistent.' : luck ? 'Moxie offered to help. Moxie’s help mostly involved snacks.' : 'Shelby says a month with spare cash and no plan is “a pot without seeds.” Shelby says this about many things.',
        options
      };
    },
    apply(s, o, flows) {
      if (o.id === 'repay') {
        let left = o.amount;
        for (const d of s.debts.filter(x => x.balance > 0).sort((a, b) => b.monthlyBp - a.monthlyBp)) { const pay = Math.min(left, d.balance); if (pay) repay(s, flows, d, pay, `Extra payment: ${d.name}`); left -= pay; }
      }
      if (o.id === 'save') move(s, flows, 'wallet', 'savings', o.amount, 'Moved to the savings jar');
      if (o.id === 'treat') { spend(s, flows, 'wallet', o.amount, 'Cooking class'); s.stars += 2; }
      const texts = {
        repay: ['Paying extra on debt earns a guaranteed “return” equal to the interest you no longer pay. Paying the highest rate first saves the most.', 'Your debt shrank, but the money is no longer available for a surprise.'],
        save: ['Spare money in the jar moves you toward the goal and stays available for emergencies.', 'If you owe money at a high rate, saving instead of repaying can cost more in interest.'],
        treat: ['Enjoyment is a legitimate use of money, especially when it is planned and affordable.', 'Your goal and cushion move a bit more slowly.'],
        keep: ['Cash in the wallet is flexible, but without a job it can drift toward small purchases.', 'You kept every option open and did not move closer to anything in particular.']
      }[o.id];
      return { why: texts[0], tradeoff: texts[1], closer: 'Spare money has no job until you give it one. Luck brings windfalls and bills on its own schedule; your choices are only part of your outcome. Planning helps you respond to luck; it does not control luck.' };
    }
  },
  shifts: {
    id: 'shifts', speaker: 'narrator', concepts: ['income', 'time', 'opportunity'],
    build: s => ({
      kicker: `Payday ${s.payday} · Time is a resource`,
      title: 'The bakery asks who can cover weekend shifts.',
      text: 'Extra shifts mean extra pay this payday. They also mean early alarms and less time with friends.',
      aside: 'The weekend shift starts at 5 a.m. The bread does not care that it is Saturday.',
      options: [
        option('two', 'Work both weekend days: +$80', 'Most money. You will be tired, and that is fine for one weekend.', { amount: 8000, stars: 0 }),
        option('one', 'Work one day: +$40', '★ Some money, some rest.', { amount: 4000, stars: 1 }),
        option('rest', 'Rest and see friends', '★★ No extra pay. A slow weekend and a long walk.', { amount: 0, stars: 2 })
      ]
    }),
    apply(s, o, flows) {
      if (o.amount) { s.wallet += o.amount; s.totals.earned += o.amount; flow(s, flows, 'paycheck', 'wallet', o.amount, 'Weekend shift pay'); }
      s.stars += o.stars;
      return {
        why: 'Income usually comes from trading time and energy. Earning more is one way to reach a goal; spending less is another.',
        tradeoff: o.amount ? `You traded rest for ${money(o.amount)}.` : 'You traded possible pay for rest. Rest makes the other weeks work.',
        closer: 'When a goal is close, one extra push can finish it. When it is far away, a sustainable plan matters more than one heroic weekend.'
      };
    }
  },
  goal: {
    id: 'goal', speaker: 'moxie', concepts: ['goals', 'emergency', 'borrowing', 'time'],
    build: s => {
      const goal = goalOf(s), have = s.savings + s.wallet, options = [];
      if (have >= goal.cost) options.push(option('buy', `Buy the ${goal.short} now: ${money(goal.cost)}`, `★★★ Uses the jar first, then the wallet. ${money(have - goal.cost)} would be left as a cushion.`, { stars: 3 }));
      const smaller = option('smaller', `Choose ${goal.smaller.name}: ${money(goal.smaller.cost)}`, have >= goal.smaller.cost ? `★★ Leaves ${money(have - goal.smaller.cost)} as a cushion.` : '', { stars: 2 });
      if (have < goal.smaller.cost) { smaller.disabled = true; smaller.reason = `The jar and wallet hold ${money(have)}. You would be ${money(goal.smaller.cost - have)} short.`; }
      options.push(smaller);
      if (have < goal.cost) {
        const gap = goal.cost - have;
        if (s.pot.value > 0 && s.pot.value >= gap) options.push(option('pot', `Sell ${money(gap)} of the seed pot and buy it now`, `★★★ The pot is worth ${money(s.pot.value)}. Uses all of the jar and wallet too.`, { stars: 3, gap }));
        const card = loanTerms(s, 'card', gap), kiosk = loanTerms(s, 'kiosk', gap);
        const c = option('card', `Buy now, put the ${money(gap)} gap on the Sparrow Card`, `★★★ Uses all of your jar and wallet. 30% APR; ${money(card.payment)} minimum: about ${plural(card.months, 'month')} and ${money(card.interest)} interest to repay.`, { stars: 3, gap, terms: card });
        if (!card.withinLimit) { c.disabled = true; c.reason = `This would go over the ${money(RULES.cardLimit)} card limit.`; }
        options.push(c);
        options.push(option('kiosk', `Buy now, borrow the ${money(gap)} gap from the Lending Kiosk`, `★★★ Uses all of your jar and wallet. 24% APR; ${money(kiosk.payment)} a month for ${plural(kiosk.months, 'month')}, ${money(kiosk.interest)} interest.`, { stars: 3, gap, terms: kiosk }));
      }
      const left = Math.max(0, goal.cost - have);
      options.push(option('wait', 'Wait and keep saving', left ? (s.autoSave ? `About ${plural(Math.ceil(left / s.autoSave), 'more payday')} at your ${money(s.autoSave)} saving habit, if nothing else changes.` : 'With no automatic saving, there is no date yet; leftovers could still get you there.') : 'You could buy it now, but you choose to keep the full cushion for a while.', { stars: 0 }));
      return {
        kicker: `Payday ${s.payday} · Goal day`,
        title: `Time to decide about the ${goal.short}.`,
        text: `Your goal costs ${money(goal.cost)}. Your savings jar holds ${money(s.savings)} and your wallet holds ${money(s.wallet)}: ${money(have)} together.${debtTotal(s) ? ` You still owe ${money(debtTotal(s))}.` : ''}`,
        aside: 'Moxie has prepared a speech for whichever choice you make. It is the same speech.',
        options
      };
    },
    apply(s, o, flows) {
      const goal = goalOf(s);
      const pay = cost => { const jar = Math.min(cost, s.savings); spend(s, flows, 'savings', jar, `${goal.name} (from the jar)`); if (cost > jar) spend(s, flows, 'wallet', cost - jar, `${goal.name} (from the wallet)`); };
      if (o.id === 'buy') { pay(goal.cost); s.goalOutcome = 'bought'; }
      if (o.id === 'smaller') { const jar = Math.min(goal.smaller.cost, s.savings); spend(s, flows, 'savings', jar, 'Smaller version (from the jar)'); if (goal.smaller.cost > jar) spend(s, flows, 'wallet', goal.smaller.cost - jar, 'Smaller version (from the wallet)'); s.goalOutcome = 'smaller'; }
      if (o.id === 'pot') { move(s, flows, 'pot', 'wallet', o.gap, 'Seed pot sold for the goal'); pay(goal.cost); s.goalOutcome = 'bought'; }
      if (o.id === 'card' || o.id === 'kiosk') { borrow(s, flows, o.id, o.gap, o.id === 'card' ? 'Gap charged to the Sparrow Card' : 'Gap borrowed from the Lending Kiosk'); pay(goal.cost); s.goalOutcome = 'borrowed'; }
      if (o.id === 'wait') s.goalOutcome = 'waiting';
      s.stars += o.stars;
      const cushion = s.savings + s.wallet;
      const texts = {
        buy: [`You reached your goal with money you had saved. ${money(cushion)} remains as a cushion.`, cushion < RULES.needs ? 'Your cushion is now smaller than one payday of needs, so the next surprise could be harder.' : 'You enjoyed the goal and kept some room for surprises.'],
        smaller: ['You adjusted the goal to fit your resources. Changing a goal is planning, not failing.', 'You gave up some of what you wanted for a larger cushion.'],
        pot: ['You used an investment for a short-term goal. That works when the value is up; it hurts if the value is down.', 'Your pot is smaller, so less money can grow later.'],
        card: [`You have your goal today. The ${money(o.gap)} gap will cost about ${money(o.terms?.interest || 0)} in interest at minimum payments.`, 'Borrowing pulls a future purchase into the present. Your future paydays will carry the payments.'],
        kiosk: [`You have your goal today. The ${money(o.gap)} gap will cost about ${money(o.terms?.interest || 0)} in interest.`, 'A fixed payment plan ends sooner than card minimums, but the payments come first every payday.'],
        wait: ['Waiting keeps your cushion and avoids interest.', 'You delay the enjoyment. Sometimes that is the right price; sometimes the moment matters more.']
      }[o.id];
      return { why: texts[0], tradeoff: texts[1], closer: 'There is no single right answer. It depends on how much the goal matters now, how secure your cushion is, and what borrowing would cost.' };
    }
  }
};

export function currentDecision(s) {
  if (s.phase !== 'decision') return null;
  const d = DECISIONS[s.schedule[s.payday - 1]], built = d.build(s);
  return { id: d.id, speaker: d.speaker, event: !!d.event, concepts: d.concepts, ...built };
}

export function choose(state, optionId) {
  const decision = currentDecision(state);
  if (!decision) throw new Error('No decision is waiting.');
  const o = decision.options.find(x => x.id === optionId || String(x.id) === String(optionId));
  if (!o) throw new RangeError('Unknown choice.');
  if (o.disabled) throw new RangeError(`That choice is not available: ${o.reason}`);
  const s = clone(state), flows = [], starsBefore = s.stars;
  const explanation = DECISIONS[s.schedule[s.payday - 1]].apply(s, o, flows);
  if (s.stars !== starsBefore) flow(s, flows, 'stars', 'stars', s.stars - starsBefore, `${s.stars - starsBefore > 0 ? '+' : ''}${s.stars - starsBefore} good times`);
  s.log.push({ payday: s.payday, decision: decision.id, title: decision.title, choice: o.label, concepts: decision.concepts, stars: o.stars || 0 });
  s.result = { decision: decision.id, option: o.id, label: o.label, flows, ...explanation, after: snapshot(s) };
  s.phase = 'result';
  return s;
}

export function advance(state) {
  if (state.phase !== 'result') throw new Error('Finish the current step first.');
  if (state.payday >= RULES.paydays) { const s = clone(state); s.phase = 'recap'; return s; }
  return startPayday(state);
}

// ---------- recap ----------
export function summarize(s) {
  const goal = goalOf(s), cushion = s.savings + s.wallet, owed = debtTotal(s);
  const after = s.debts.filter(d => d.balance > 0).map(d => {
    const plan = d.kind === 'overdue' ? { months: 1, interest: 0 } : repaymentPlan(d.id, d.balance, d.payment);
    return { name: d.name, balance: d.balance, apr: d.apr, payment: d.kind === 'overdue' ? d.balance : d.payment, months: plan.months, futureInterest: plan.interest };
  });
  const commitments = SUBSCRIPTIONS[s.subscription].cost + s.extraNeeds + after.reduce((t, d) => t + (d.payment || 0), 0);
  const needs = RULES.needs + s.extraNeeds, moves = s.pot.moves;
  const interestPaid = s.debts.reduce((t, d) => t + d.interest, 0);
  const concepts = [...new Set(s.log.flatMap(l => l.concepts))];
  const potChange = s.pot.value + s.pot.withdrawn - s.pot.contributed;
  return {
    goal: { name: goal.name, cost: goal.cost, outcome: s.goalOutcome, progress: s.goalOutcome === 'waiting' ? Math.min(1, cushion / goal.cost) : 1 },
    cushion: { amount: cushion, months: cushion / needs, needs },
    debt: { owed, interestPaid, accounts: after },
    pot: { value: s.pot.value, contributed: s.pot.contributed, withdrawn: s.pot.withdrawn, change: potChange, moves, best: moves.length ? Math.max(...moves) : null, worst: moves.length ? Math.min(...moves) : null },
    stars: s.stars, commitments, extraNeeds: s.extraNeeds, emergency: EMERGENCIES[s.emergency], events: s.events, concepts, decisions: s.log
  };
}

/** Hypothetical long-run paths for the time chart. Annual percentages are illustrations, not forecasts. */
export const ROUGH_PATH = [-25, -10, 8, 12, 9, 7, 6, 8, -5, 9, 7, 6, 7, 8, -12, 10, 9, 6, 7, 5, 8, 6, -6, 9, 7, 6, 7, 5, 6, 7];
export function timePaths(amount, years = 30, longRun = null) {
  const steady = [amount], rough = [amount], cash = [amount], random = longRun ? [amount] : null;
  for (let y = 1; y <= years; y++) {
    steady.push(steady[y - 1] * 1.05); rough.push(rough[y - 1] * (1 + ROUGH_PATH[y - 1] / 100)); cash.push(amount);
    if (random) random.push(random[y - 1] * (1 + longRun[y - 1] / 100));
  }
  return { steady, rough, cash, random };
}
