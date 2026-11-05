# Accuracy review of Iteration 06

Karen asked for a check that the Version 6 teaching materials are correct and correctly spelled, and that the arithmetic and math are correct. The preserved copy at `iterations/iteration-06/` is read-only under the project rules and was not changed. Its runtime was identical to the root version at the time of review (source commit `71237e1`). The corrections below were made in the root (latest) version only.

## What was reviewed

- All five courses: every string in each `content.json` (lessons, everyday examples, italic comments, prompts, glossaries, assumptions, recaps, summaries, and quizzes with answer keys and explanations).
- The shared lesson engine, model, and quiz code that produce on-screen sentences, numbers, and charts.
- The entrance page, `sources.html`, and every learner-facing string in the game (`game/engine.js`, `game/game.js`, `game/index.html`).

## Method

- **Spelling:** every learner-facing string was extracted and checked against an English dictionary (the `pyspellchecker` package). Every flagged word was reviewed by hand. Apart from code names, all were legitimate terms (for example "servicer", "wishlist", "CFPB", "MLA") or invented names ("Pocketford", "Ottilie"). A dictionary cannot catch wrong-but-real words, so all of the text was also read in full.
- **Arithmetic:** each worked number in the text was recalculated against the course settings, and the model formulas were checked. The game's arithmetic is covered by the automated test suite, which runs 3,000 random playthroughs among its other checks.

## Arithmetic checked and found correct

- **Child:** $12 − $6 = $6 to divide; spending $2 on stickers leaves $4 for the kite; the $6 loan repaid as $7 costs $1, and doubling it gives $12 and $14; $100 grows at 5% a year.
- **Teen:** $90 − $35 = $55 flexible; four $15 payments = $60, against a $50 cash price, so $10 extra; a $20 start, six months of saving, and a $60 surprise; $120 at 24% APR.
- **College:** bills of $650 + $70 + $150 + $40 + $90 = $1,000; a $100 start + 2 × $600 − $1,000 = $300 at month end for every rent date; $1,200 − $1,000 = $200 to divide.
- **Post-college:** $2,800 − $2,200 = $600; saving $400 a month reaches the $1,200 goal in 3 months; $1,500 at 24%; $1,000 at 5% with 2% inflation.
- **Expert:** $6,000 − $4,200 = $1,800; saving $1,200 a month reaches $12,000 in 10 months; first-month interest on $10,000 at 9% APR is $75; expected return 0.8 × 15% + 0.2 × (−40%) = 4%.
- **Models:** budget conservation, the savings-shortfall split, the payoff loop and its guard for payments that do not cover interest, net-of-fee growth with inflation adjustment, and the college cash-flow timeline. The payment sliders never land on a value equal to the first month's interest, so the "does not cover the interest" message is never shown for a payment that only matches it.
- **Game:** pay and needs ($450 / $320), 24% and 30% APR as 2% and 2.5% a month, the no-interest clinic plan ($70, $70, $60), luck amounts, the repair kit's payback (⌈$80 ÷ $30⌉ = 3 paydays), and the long-run chart (for example, $100 at 5% for 30 years = $432.19).

## Corrections made

1. **Game — overstated interest on additional borrowing (arithmetic).** When the player already owed money on the store card or the kiosk loan and borrowed more, the game described the interest on the whole combined balance as the cost of the new amount. Example from a reproduced game: $166.41 already on the card and a $5 goal-day gap. The game said "The $5 gap will cost about $23.94 in interest", but $22.54 of that was interest on the existing balance; the $5 added $1.40. The option descriptions and explanations now give the interest added by the new borrowing. The "Check the terms" table still shows the whole-balance time, interest, and total, labeled as such, plus a row for the interest added by this borrowing. A regression test was added.
2. **Teen course, investing aside (wording).** "The other switch applies a 20% drop" referred to a second switch that the teen lesson does not have. It now reads "The switch applies a 20% drop".
3. **Sources page, privacy section (accuracy).** "Clear Money Moves data from the home page" overstated what the home-page button does: it clears course progress and notes, not the game's saved place. The sentence now says so and points to the game's own "Start over".

## Noted for Karen's decision (not changed)

- **Post-college italic comment:** "An emergency fund is a subscription to fewer unpleasant surprises." Strictly, an emergency fund does not make surprises rarer; it softens their effect. It reads as a joke, and the original italic comments have been kept since Version 2, so it was left unchanged.
- **Investor.gov link on `sources.html`:** the "How Fees and Expenses Affect Your Investment Portfolio" link ends in `/investor-bulletins/updated`, which looks truncated. This environment cannot reach investor.gov (or the other cited government sites), so none of the source links could be tested and no replacement address was guessed.
- **Course saving illustration:** the comparison bars in the saving chapter rescale as the monthly amount changes. The printed amounts are correct; only the bar lengths shift between settings.

## Verification

- `npm test`: 54 checks pass, including the new interest regression test and the unchanged integrity checks for Iterations 01–06.
- Browser: 12 complete random games at desktop and phone widths, with no page or console errors and no horizontal overflow. All three emergencies, all six luck events, and emergency paydays 3–9 appeared.
- Not checked: the cited external links (blocked here), physical devices, screen readers, or learners.
