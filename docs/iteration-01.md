# Iteration 01 — baseline record

## Purpose

Create an educational tool that introduces personal finance to five audiences, with separate identities and independently editable folders. Show the courses individually or in series on GitHub Pages. Karen will propose her own improvements after reviewing this baseline.

## Requirements reflected in this version

| Requirement | Implementation |
| --- | --- |
| General education, not isolated word problems | Five connected teaching chapters in every course: explanation, everyday example, interactive illustration, glossary, and recap |
| Child, teen, college, post-college, expert | Five named environments, adapted copy and vocabulary, distinct visual themes, and audience-specific illustrations |
| Each audience independently editable | Complete content, CSS, JavaScript, model, and SVG files inside each audience folder |
| Clever, respectful humor | Contextual jokes about situations and financial concepts; no judgments about wealth or intelligence |
| Many graphics | Five original environment illustrations, illustrated concept map, money-flow views, allocation jars, saving diagrams, repayment comparisons, and growth/timing charts |
| Serial or individual viewing | Course-selecting hub, five-course tour links, chapter navigation, and next-course links |
| Quality takes priority over the original five-minute limit | Self-paced chapters; estimated 8–12 minutes for children and 10–15 minutes for other courses |
| Preserve an inspectable first iteration | Source files, formulas, assumptions, automated checks, and this baseline record in GitHub |

## Delivery scope

- Twenty-five teaching chapters across five independent courses, plus course recaps.
- Fictional USD amounts and rates; no financial products recommended.
- Sources and calculation exclusions provided to learners.
- Browser-local progress and optional takeaway notes; no sign-in or analytics.
- Static files served without a build step.

## Verification record

- All 25 Node tests passed: allocation conservation, saving and shock accounting, debt boundaries, repayment totals, fee/inflation/loss arithmetic, chapter structure, and static asset links.
- Browser-checked all five course environments and the tour links between them.
- Exercised a zero-saving allocation, uncovered surprise cost, doubled child borrowing, teen repayment changes, college rent-date changes, and expert fee/inflation/downside controls.
- Verified a saved takeaway and self-marked completion, and the hub’s separate course progress display.
- Inspected desktop rendering and a 390px embedded viewport for the hub and expert course. The latter had equal content/viewport width (375px after the scrollbar), with no horizontal page overflow. This is a responsive layout check, not testing on a physical phone.
- No application console errors were observed during these checks; browser-extension metadata errors were unrelated to the app.

Editorial duration estimates have not been validated with learners. No claim is made about learning outcomes, age-level readability scores, or financial behavior change.

## Author’s iteration decisions

Reserved for Karen’s own observations and chosen changes after reviewing the first version.

## Publication

- Published on GitHub Pages on November 2, 2026, using `main` and the repository root.
- Public address: https://kgsucf.github.io/ENG6803IteratingPersonalFinance/
- First application commit: `e7653125ef49520c50eb917f15f241d0f12f561e`.
- GitHub’s Pages settings confirmed the site was live; the public entrance and child course were opened successfully, including the loaded course JSON and model.
- `iteration-01-preview.jpg` captures the published course entrance.
