# Iteration 06 — Surprises that stay surprising

After playing Version 5 twice, Karen noticed that the broken phone and the bike-repair kit came up both times. In Version 5 that was by design: every game had the same ten decisions in the same order, and only a payday-8 luck draw and the choice of one of three fixed investment paths were random. Karen asked for Version 6 to make surprise events real surprises, give the investment upside and downside variability, and make the game more fun to replay. Everything else in Money Moves is unchanged.

## What changed

| Area | Version 5 | Version 6 |
| --- | --- | --- |
| Decision order | Fixed: the same ten decisions on the same paydays | Payday 1 (saving plan), payday 2 (streaming), and payday 10 (goal day) stay fixed. The seven decisions between them are shuffled every game, with one rule: the investment check-in comes at least two paydays after the chance to invest. |
| Emergency | Always a $240 broken phone on payday 5 | One of three, drawn at random, on a random payday from 3 to 9: a broken phone ($240), a toothache ($200), or split work shoes ($120). Each has its own work-around (see below). |
| Luck events | One draw on payday 8: bonus, quiet month, or fridge bill | Two different events per game on two random paydays from 2 to 9 (never the emergency's payday), drawn from six: a $100 bonus, a $40 gift, a $35 refund, a $90 fridge bill, a $60 vet bill, or a $10 rise in the monthly bus pass that repeats every later payday. Any mix of good and bad is possible. |
| Investment ("seed pot") | One of three fixed paths, applied from payday 5 | Each game draws its own month-by-month changes. Money planted moves from the next payday on, whenever it was planted. |
| Long-run chart | Steady 5% a year, a fixed rough path, and cash | Adds a random 30-year path drawn for each game, alongside the others, on the same fixed scale. |
| Recap | Named the market path and payday-8 event | Lists each surprise with its payday, in order, and reports the best and worst investment months while the money was planted. |

Smaller changes made so the game reads correctly in any order:

- Text that named a payday or a time span (for example "from payday 7 to 10" for the repair kit) is now calculated from the payday on which the decision appears.
- The repair kit's gain or loss within the game depends on how many paydays remain. Late in the game it can lose money within the game, and the explanation says so.
- The birthday decision gained a free option ("Call Juno and sing, badly"). Testing the shuffled order showed that if the birthday came after the wallet had been drained, no choice was affordable. Every decision now has at least one option that is free or paid for by a loan with its terms shown, and a test enforces this.
- The entrance page, game title screen, how-to-play steps, in-game assumptions, and `sources.html` describe the new randomness.

## Emergency work-arounds

| Emergency | Work-around | Consequence |
| --- | --- | --- |
| Broken phone ($240) | Grandpa Ozzie's old flip phone | $30 less pay on each of the next two paydays (or one, if only one remains) |
| Toothache ($200) | Ask the clinic for a payment plan | No interest; $70, $70, then $60 on later paydays. It still shows on the debt meter. |
| Split shoes ($120) | Let Juno glue them for $20 | Luck decides, at the start of the game, whether the glue holds. If it fails, the $120 shoes are charged on the next payday. |

Every emergency also offers paying from savings, selling investment value (if any is planted), the Lending Kiosk loan, and the store card, each with terms shown before borrowing.

## Investment assumptions

Each month's change is equally likely to be −12%, −6%, −3%, −1%, 0%, +1%, +2%, +2%, +3%, +4%, +5%, or +7%. This list averages about +0.2% a month and includes an occasional sharp drop. Over a game the same choices can end with a gain or a loss. Each year of the long-run random path is equally likely to be −25%, −12%, −5%, 0%, +4%, +6%, +8%, +10%, +12%, +15%, +20%, or +24% (averaging about 4.75%). If that path rises above the chart's fixed top ($0 to five times the amount), the line stops at the top edge and the value is labeled "above the chart." All of these are made-up illustrations, not market data, forecasts, or guarantees.

## Saved games

The game's storage key changed from `money-moves:game:pocketford:v1` to `money-moves:game:pocketford:v2`, because a Version 5 game cannot be continued under Version 6's rules. A Version 5 save in the same browser is ignored and left untouched rather than deleted. Course progress and learning notes are not affected. The snapshot tool gives `iteration-06` its own key (`money-moves:iteration-06:game:pocketford:v2`), separate from the latest site and from `iteration-05`.

## Verification performed

Baseline before any change: commit `9a82d95` (the same as `origin/main`), `npm test` 50/50 passing, no `iteration-06` folder. Recorded tree hashes: `iteration-01` `16c35c0e…`, `-02` `cca6650c…`, `-03` `e97b6015…`, `-04` `6214c46d…`, `-05` `8f256919…`.

Automated (`npm test`, 53 checks, all passing):

- 3,000 seeded random playthroughs with random schedules, emergencies, luck, and investment changes. After every step, money is conserved (holdings minus debts equal the start plus earnings, minus spending and interest, plus investment change). No balance is ever negative. Every decision has an available option, including one that is free or loan-funded.
- 600 new games: the first two and last decisions are fixed, the check-in always comes at least two paydays after investing, and there were more than 100 different orders. All three emergencies occurred, on every payday from 3 to 9. All six luck events occurred, on every payday from 2 to 9, never on the emergency's payday, and never twice in one game.
- Each emergency work-around: the clinic plan charges no interest and repays $200 in three payments. Glue that holds costs $20 in total; glue that fails costs $20 plus $120 on the next payday. A flip phone on the last possible payday reduces pay by only one payday.
- Each luck event changes the player's net position by exactly its stated amount. The bus-pass rise repeats on every remaining payday and appears in the recap's monthly needs and commitments.
- The investment follows the drawn changes exactly. Across 300 games with identical choices, it ended with a gain in some games and a loss in others.
- The existing checks still pass: loan schedules, shortfalls, formatting, storage-key separation, local links, snapshot fixtures, and the recorded file hashes of Iterations 01–05.

Browser checks (headless Chromium on a local static server):

- 24 complete games with random choices (two batches of 12), at 1280 px and 375 px, with animations on and with reduced motion. There were no page or console errors and no horizontal overflow. In the first batch, all 12 decision orders differed; all three emergencies appeared on six different paydays; and all six luck events appeared, plus one glue failure.
- Screenshots reviewed: the split-shoes emergency with loan terms open (phone width), a "Surprise cost" callout for the bus-pass rise, and a recap showing the surprise list and the long-run chart with the random path.
- Keyboard-only play, resuming after a reload, and "Start over" (which left a course-progress key untouched) were re-run.
- A planted Version 5 save was ignored without errors, and a new game started normally.

Not verified: physical phones, screen readers, or learner testing. The 5–10 minute length remains an editorial estimate.

## Limitations

- The randomness uses the browser's built-in random number generator; games cannot be replayed with the same luck on purpose.
- The investment and long-run changes come from short made-up lists, chosen to be easy to inspect rather than to model a real market.
- With more combinations, some games will be noticeably easier or harder than others. That is intended to show luck, but it also means two players' recaps are not directly comparable.

## Publication

- Source commit for the snapshot: `71237e130a39760b69bb850ea1fa3e7fcccc5241`. The working tree was clean when the snapshot was made, so every copied runtime file matched that commit.
- `iterations/iteration-06/` was created with `scripts/freeze-iteration.mjs` (47 runtime files). `npm test` then passed 53 checks, including the recorded hashes of Iterations 01–06. Git tree hashes for `iteration-01` to `iteration-05` were identical to the baseline.
- Local browser check of the preserved copy: entrance → game → a course → back stayed under `iterations/iteration-06/`. No file loaded from outside it. Its saved game used `money-moves:iteration-06:game:pocketford:v2`. The latest `game/` and `iterations/iteration-05/game/` each still showed a fresh start. The archive page lists Iterations 01–06.
- Pushed to `main` as commit `7a4e255`, which triggered GitHub's "pages build and deployment" run.
- Live site: this work environment cannot reach `kgsucf.github.io`, so the published pages have not been opened here. They should be checked in a browser.
