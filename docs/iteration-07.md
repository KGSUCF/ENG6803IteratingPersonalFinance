# Iteration 07 — Corrections, livelier charts, and new art

Version 7 follows the accuracy review of Version 6 (`docs/review-after-iteration-06.md`). It includes the corrections from that review, a new emergency-fund comment chosen by Karen, livelier charts, a redesigned saving chart, and new illustrations in the courses and the game. Iteration 06 is preserved unchanged.

## Corrections

- **Game borrowing interest (arithmetic).** When the player already owed money on the store card or the kiosk loan, the interest quoted for new borrowing included interest on the old balance. In one reproduced game, a $5 gap was described as costing $23.94 in interest when it added $1.40. Option descriptions and explanations now give the interest the new borrowing adds. The terms table labels whole-balance figures and adds a row for the new borrowing. A regression test covers this.
- **Teen investing aside:** "The other switch" became "The switch", because the lesson has only one switch.
- **Sources page:** the home-page reset clears course progress and notes; the game's save is cleared with "Start over" inside the game.
- **Post-college italic comment (Karen's choice):** now reads "An emergency fund can change surprises from catastrophic to just annoying."
- **Investor.gov fees link:** left unchanged. Karen noted that the existing address is probably the intended one. It has not been opened from this environment.

## Courses: charts and art

The five courses still have independent copies of the lesson engine (`lesson.js`) and styles (`style.css`). The same change was applied to each copy, and colors come from each course's own theme.

- **Chapter illustrations:** each chapter has a small themed drawing: a coin heading for a wallet, three labeled jars, an umbrella over a savings jar in the rain, a "DUE" calendar with coins, and a sprouting money plant.
- **Entry animations:** when a chapter opens, budget bars grow in sequence, jars fill, a coin rolls along the money-flow arrow, result cards pop in, and chart lines draw themselves. Animations play once per chapter visit. Moving a slider updates the numbers immediately, without replaying them.
- **Saving chapter (redesigned bars):** the old "before cost" and "surprise cost" bars are replaced by a block chart. The starting cushion is one block. Each period's saving is its own block, and empty outlined slots show periods still to come, up to twelve. Revealing the surprise draws a marker at its amount, shades the blocks it uses, and outlines any uncovered gap. A labeled dollar axis uses round tick values at their exact positions. A sentence explains how much of the saving the surprise uses and how long it would take to save that amount from an empty jar. When "Play saving" runs, each new block pops in.
  - Scale: the axis runs from $0 to the start plus twelve periods at the chosen amount (or to the surprise, if larger). It stays fixed while the number of periods changes or during playback, and changes only when the saving amount changes. Its tick labels show the current scale.
- **Borrowing chapter:** a new "balance owed over time" chart compares the chosen payment (solid line with a shaded area and a "Paid off" marker) with the comparison payment (dashed). Its scale is fixed: $0 to the borrowed amount, and month 0 to the comparison payment's payoff month. The interest bars also grow in.
- **College cash-flow chart:** the area below $0 is shaded and labeled "a funding gap". Points below $0 are marked in the warning color, and the line draws itself.
- **Investing chart:** a shaded area under the growth line and an end marker. The scale is unchanged (fixed to the 40-year value).

## Game: art

- An illustrated icon for each emergency (phone, tooth, split shoe) wobbles on the event card.
- Each luck event has its own icon in its callout: cake, envelope, refund bolt, fridge, cat, bus, and the glue tube when Juno's patch fails.
- The recap ends with Moxie, Professor Shelby, and Juno waving goodbye. Confetti falls when the player bought the goal, the smaller version, or bought with borrowing.

## Accessibility and motion

The finished state of every element is its normal style, so the existing reduced-motion rules in the course and game stylesheets skip all of the new movement and show the final charts. Decorative art is hidden from screen readers. Each new chart has a text description, including the amounts it shows.

## Verification performed

- `npm test`: 54 checks pass, including the recorded file hashes of Iterations 01–06 before the snapshot, and the new game interest test.
- Browser (headless Chromium, local server):
  - Opened all five chapters of all five courses at 1280 px (college, expert, post-college) and 375 px (child, teen). The saving surprise was switched on in each course. There were no page or console errors and no horizontal overflow.
  - Screenshots reviewed: college saving and borrowing, expert saving (dark theme), and child saving at phone width.
  - The screenshots exposed and led to three fixes: identical start and saved colors in the expert theme, rounded axis labels at quarter positions, and the surprise label overlapping the text above it.
  - 12 complete random games at desktop and phone widths, with no errors. All three emergencies, all six luck events, and every emergency payday from 3 to 9 appeared. Screenshots of the toothache card, a luck callout, and the recap with the crew were reviewed.
  - A malformed tooth-icon path, found by the browser's console, was fixed and the run repeated cleanly.
- Arithmetic checked in the new displays:
  - College saving: $100 start + 4 × $40 = $260 covers the $250 surprise, matching "all or part of 4 of your 6 months"; saving $250 from empty at $40 a month takes 7 months.
  - Child: $2 + 2 × $2 covers $5; 3 weeks from empty.
  - Expert: $1,000 + 5 × $300 covers $2,500; 9 months from empty.
  - College borrowing: payoff in 19 months at $40 and 82 months at $15. This agrees with n = −ln(1 − rB/P) / ln(1 + r) at r = 2% a month.

Not verified: physical devices, screen readers, the cited external links (blocked here), or learner testing.

## Publication

- Source commit for the snapshot: `5fc36bc534a61fd6fcea7bba4d0de5148247e042`. The working tree was clean when the snapshot was made.
- `iterations/iteration-07/` was created with `scripts/freeze-iteration.mjs` (47 runtime files). `npm test` then passed 54 checks, including the recorded hashes of Iterations 01–07. Git tree hashes for `iteration-01` to `iteration-06` were identical to those before this work.
- Local browser check of the preserved copy: entrance → game → a course → back stayed under `iterations/iteration-07/`. No file loaded from outside it. Its course progress and game used the `money-moves:iteration-07:` prefix. The college saving chart loaded. The Iteration 06 game and the latest game each still showed a fresh start. The archive page lists Iterations 01–07.
- Pushed to `main` for GitHub Pages. This environment cannot reach `kgsucf.github.io`, so the live pages need to be checked in a browser.
