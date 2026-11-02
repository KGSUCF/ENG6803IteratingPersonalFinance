// Pure, transparent teaching models. Rates and prices are fictional inputs.
const finite = (...values) => { if (values.some(v => !Number.isFinite(v))) throw new TypeError('Use finite numbers.'); };
export function budget(income, essentials, flexible, goal) {
  finite(income, essentials, flexible, goal);
  if (Math.min(income, essentials, flexible, goal) < 0 || essentials + flexible > income) throw new RangeError('Allocation exceeds available income.');
  const saved = income - essentials - flexible;
  return { income, essentials, flexible, saved, periods: saved > 0 ? Math.ceil(goal / saved) : null };
}
export function savings(start, contribution, periods, shock = 0) {
  finite(start, contribution, periods, shock);
  if (Math.min(start, contribution, periods, shock) < 0) throw new RangeError('Use nonnegative amounts.');
  const before = start + contribution * periods;
  return { before, after: Math.max(0, before - shock), gap: Math.max(0, shock - before), contributed: contribution * periods };
}
export function payoff(principal, apr, payment) {
  finite(principal, apr, payment);
  if (principal < 0 || apr < 0 || payment <= 0) throw new RangeError('Check the repayment inputs.');
  if (!principal) return { months: 0, interest: 0, total: 0, paidOff: true };
  if (payment <= principal * apr / 1200) return { months: null, interest: null, total: null, paidOff: false };
  let balance = principal, interest = 0, total = 0, months = 0;
  while (balance > 0.0000001 && months < 1200) {
    const charge = balance * apr / 1200;
    const paid = Math.min(payment, balance + charge);
    interest += charge; total += paid; balance = Math.max(0, balance + charge - paid); months++;
  }
  return { months, interest, total, paidOff: balance <= 0.0000001 };
}
export function growth(principal, rate, fee, inflation, years, drop = 0) {
  finite(principal, rate, fee, inflation, years, drop);
  if (principal < 0 || years < 0 || rate - fee <= -100 || inflation <= -100 || drop < 0 || drop > 100) throw new RangeError('Invalid growth assumptions.');
  const nominal = principal * (1 + (rate - fee) / 100) ** years * (1 - drop / 100);
  return { nominal, purchasingPower: nominal / (1 + inflation / 100) ** years };
}
export function cashFlow(rentDay = 1) {
  if (![1, 4, 18].includes(rentDay)) throw new RangeError('Choose a modeled rent date.');
  const events = [{day:rentDay,label:'Rent',amount:-650},{day:3,label:'Income',amount:600},{day:5,label:'Utilities',amount:-70},{day:12,label:'Groceries',amount:-150},{day:17,label:'Income',amount:600},{day:20,label:'Transport',amount:-40},{day:22,label:'Books',amount:-90}].sort((a,b)=>a.day-b.day);
  let balance = 100;
  const points = [{day:0,label:'Starting cash',amount:0,balance}];
  for (const event of events) { balance += event.amount; points.push({...event,balance}); }
  return {points, ending:balance, lowest:Math.min(...points.map(p=>p.balance))};
}
