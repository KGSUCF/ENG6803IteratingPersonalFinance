# Iteration 05 — Ten Paydays in Pocketford

Karen requested an optional, shared money-choice game for all five audience levels, reachable from the main entrance and from each course. Version 5 adds that game in its own `game/` folder. The five courses, their identities, lessons, illustrations, italic comments, Version 3 playback, and Version 4 summaries and quizzes are unchanged apart from a new “Play the money game” link in each course's top bar.

## What changed

| Area | Change |
| --- | --- |
| `game/` (new) | `index.html`, `game.js` (interface, animation, saved game), `engine.js` (rules, story, and arithmetic as pure functions), `game.css`, and `pocketford.svg`. No framework, build step, account, or external service. |
| Entrance (`index.html`, `assets/hub.css`) | A “Ten Paydays in Pocketford” feature section, a “Play the game” navigation link, a footer link, and a note that the game saves its place separately. |
| Each course (`*/index.html`, `*/style.css`) | A “Play the money game” top-bar link to `../game/?from=<course>`, so the game can offer a “Back to” link for that course. The link style lives in each course's own stylesheet; no course imports another course's or the game's code. Cache-busting query strings changed from `v=4-review` to `v=5`. |
| `sources.html` | A short section summarizing the game's assumptions and storage. |
| `scripts/freeze-iteration.mjs` | `game` added to the runtime folders each snapshot copies. The game's storage key is isolated by the same `money-moves:` → `money-moves:iteration-NN:` rewrite already used for `.js` files. |
| Tests | New `tests/game.test.mjs`; `tests/snapshots.test.mjs` extended (details below). Existing preservation checks are unchanged in strength. |

## The game

**Premise.** The player has moved to the fictional town of Pocketford and works at the corner bakery. Over ten monthly paydays they work toward a goal they pick: a bike ($600), a beach weekend ($750), or a keyboard and lessons ($850). The cast is Moxie (a raccoon roommate who enjoys a good time), Professor Shelby (a very patient tortoise), and Juno (a badger who runs the bike co-op). Humor is aimed at the characters and situations, never at anyone's income, debt, or mistakes.

**Dashboard.** Wallet, savings jar (with a goal line), seed pot (a pretend investment that can rise or fall), debt meter, good times (stars for fun and rest the player chooses), and a ten-payday progress track.

**Turn structure.** Each payday: the seed pot changes (from payday 5), pay arrives, interest is added to anything owed, required payments are made (needs, subscriptions, loan payments), and the automatic saving transfer happens from what is left. Then the player makes one decision and reads what changed, why it matters, and the tradeoff, with an optional “Look closer.”

| Payday | Decision | Main ideas |
| --- | --- | --- |
| 1 | Automatic saving: $0, $30, $60, or $90 each payday (carries forward) | Income/expenses, budgeting, saving for goals |
| 2 | Streaming: none, one service, or a bundle (recurring) | Needs and wants, opportunity cost |
| 3 | A friend's birthday: concert, picnic, or a card | Opportunity cost, enjoyment as a priority |
| 4 | Seed pot: invest $0, $100, or $200 | Compounding, risk, time horizon |
| 5 | **Unexpected event:** a $240 phone repair. Pay from savings, sell seed-pot value, borrow (two loans with inspectable terms), or use a borrowed old phone and lose some pay | Emergency reserves, borrowing costs, luck and circumstances |
| 6 | Buy an $80 repair kit to earn $30 per payday, or keep Sundays free | Income, time, opportunity cost |
| 7 | Seed-pot check-in (hold, sell, add) or, if not invested, a later chance to invest | Risk, time horizon |
| 8 | **Luck draw** (bonus, quiet month, or a $90 bill), then what to do with spare cash: repay debt, save, enjoy, or keep | Borrowing costs, saving, luck |
| 9 | Extra weekend shifts or rest | Income and time |
| 10 | Goal day: buy, choose a smaller version, sell seed-pot value, borrow the gap (terms shown), or wait | Goals, cushions, borrowing |

Choices that cannot be afforded remain visible, are marked unavailable, and state the exact amount the player is short. If required payments ever exceed the wallet, the payday pauses on a shortfall screen showing the gap and the ways to cover it (savings, selling seed-pot value, the store card, or paying late with a stated fee). Money is never added silently.

**Recap.** An illustrated “postcard” plus several measures rather than a score: goal outcome, breathing room (cushion in months of needs), what is owed and its future payoff and interest, seed-pot gain or loss with the market path drawn by luck, good times, next month's committed payments, the luck the player did not choose, the ten choices with concept tags, and a long-run chart. The page states that there is no high score. “Play again and try another path” starts a new game with a fresh luck draw.

## Assumptions

All amounts are fictional U.S. dollars; no real products are recommended and no real financial information is requested. Pay is $450 after taxes per monthly payday; needs are $320. The Lending Kiosk loan applies 24% APR as 2% a month with a $45 payment. The Sparrow Store Card applies 30% APR as 2.5% a month with a $20 minimum and a $1,000 limit. Interest is added at the start of each payday before the payment and is rounded to the nearest cent. A late payment adds a $25 fee. The savings jar neither earns nor loses money (a stated simplification). The seed pot follows one of three made-up monthly paths, drawn at random; the long-run chart uses a steady 5% a year and a rough path with early drops, on a fixed $0–5× scale and a fixed 0–30-year axis, labeled as hypothetical and not guaranteed. Taxes on gains, fees, inflation, and credit scores are not modeled. The full list is shown in the game.

## Animation, accessibility, and phone use

- Labeled “chips” carry each amount from its source to its destination (pay → wallet, wallet → spent, wallet → savings jar, debt meter → wallet when borrowing, wallet → debt meter when repaying). The matching receipt line is highlighted, and the dashboard number changes as each chip lands. Interest and seed-pot changes pulse in place with a signed amount.
- The savings jar fills against a fixed goal line; the debt bar uses a fixed $0–$1,000 scale; the seed-pot chart uses a fixed $0–$400 scale; the long-run chart never rescales when the horizon changes.
- Every step waits for the player. Explanations do not disappear on a timer. Each animation has Replay and Skip controls, and an “Animations: on/off” toggle is saved with the game. With `prefers-reduced-motion: reduce`, no chips fly and amounts update immediately; the receipt and before/after table carry the same information.
- All controls are native buttons, `<details>`, or links. Unaffordable options use `aria-disabled` so they remain focusable and announce their reason. Headings receive focus on each new step; a polite live region announces balances. Charts have text equivalents.

## Saved game and storage

The game uses one key, `money-moves:game:pocketford:v1`, holding the current game state and the animation preference. It never reads or writes course keys (`money-moves:v1:<course>`) and never clears other data. The title screen explains what is saved; “Start over” asks for confirmation and clears only the game key. In a snapshot the key becomes `money-moves:iteration-05:game:pocketford:v1`, so the latest website and each saved version keep separate games.

## Verification performed

Baseline before any change: `npm test` passed 38 checks at commit `1f69849` (same as `origin/main`). Git tree hashes of the four preserved snapshots were recorded: `iteration-01` `16c35c0e…`, `iteration-02` `cca6650c…`, `iteration-03` `e97b6015…`, `iteration-04` `6214c46d…`.

Automated (`npm test`, 50 checks after the change, all passing):

- 3,000 seeded random playthroughs: after every step, wallet + savings + seed pot − debt equals the starting cash plus earnings minus spending, interest and fees, plus market change; no balance is negative or fractional; each debt's borrowed + interest − paid equals its balance; the final animation frame matches the real state; disabled options have a reason and are refused by the engine. All ten decisions, the shortfall screen, and all four goal outcomes are reached.
- Hand-checked paths: a $60 saving habit with the phone paid from savings ends with exactly $360 in the jar and $845 in the wallet; a bundle subscription is charged on nine paydays; unaffordable seed-pot amounts report the exact gap.
- Loans: the in-game balance and interest after five payments match an independent calculation; the payoff boundary (one payment) and a payment too small to cover interest are handled; card minimums take longer and cost more than the kiosk plan.
- Shortfalls found by random play: every available resolution pays all required bills exactly, and only the late fee changes net position beyond the bills.
- Each market path produces the stated seed-pot value; all nine market/luck combinations can be drawn; long-run paths fit the fixed scale and include a loss.
- The game's storage key is distinct from course keys, and the game never calls `localStorage.clear`.
- Snapshot fixture: a snapshot now contains all game files with an iteration-specific key; a later edit to the root game changes the next snapshot but not an earlier one; every relative link in the snapshot resolves inside it (except the entrance's archive link); each course in the snapshot links to the snapshot's own game; the game imports only its own engine. The existing hash, refusal-to-overwrite, and namespace checks for Versions 1–4 still pass unchanged.

Browser checks (headless Chromium via Playwright on a local static server):

- Complete playthroughs at 1280×900 (reduced motion) and 375×740 (animations on), including borrowing, the seed pot, the luck draw, and buying the goal. No page errors or console errors; no horizontal overflow at 375 px. Screenshots were reviewed for the title, a result screen, the investing chart at 30 years, the emergency with loan terms open, and the recap.
- A mid-animation screenshot at 390 px showed the $450 chip travelling from Pay to the Wallet with its receipt line highlighted.
- Keyboard only: Enter and Space on the start button, a goal card, and a choice; focus moved to the new heading.
- Saved game: after reload the title offered “Continue from payday 2” and restored the wallet; “Start over” removed the game key while a seeded course-progress key remained unchanged.
- Navigation: the entrance and all five courses showed the game link with no horizontal overflow at 360 px and 1280 px; a course's game link opened the game with a “Back to” that course link, which returned to the course. With reduced motion, no chips were created and amounts appeared immediately.

Not verified: physical phones, screen readers, or real learners. No learner testing or timing study was performed; the 5–10 minute length is an editorial estimate.

## Limitations

- One fixed story with ten decisions and two random draws; it is practice for reasoning, not a simulation of anyone's finances.
- Interest is simplified to a monthly rate on the balance at each payday; real lenders may compute interest daily and set different minimums.
- The savings jar pays no interest, and inflation, taxes, and fees are omitted, as stated in the game.
- The good-times stars are a deliberately rough reminder that enjoyment counts; they do not measure wellbeing.
