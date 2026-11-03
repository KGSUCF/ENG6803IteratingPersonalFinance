# Iteration 04 — optional review and knowledge checks

Karen requested the next iteration in the agreed sequence: an optional summary and quiz at the end of each of the five audience levels. Version 4 retains the existing lessons, illustrations, friendlier explanations, italic comments, and Version 3 savings, borrowing, and investing playback.

## Delivered behavior

Each course’s **Bring it together** page has a collapsible five-idea summary and an optional five-question quiz. Questions cover money flow, planning, saving, borrowing, and investing, with vocabulary and humor written for that audience. This is 25 distinct questions in five separately editable course folders.

Learners choose an answer, check it, read explanatory feedback, and move on. The final recap shows the score, the learner’s answers, correct answers where needed, explanations, and links back to the relevant chapters. Learners can retry, leave the quiz, or mark the course complete without taking it. No timer or passing threshold is imposed. Quiz answers are kept only in page memory and reset when leaving the recap, closing the quiz, or reloading; existing notes and course-progress storage remain compatible. The quizzes are practice, not a mastery assessment or personalized financial guidance.

Optional quizzes are estimated to add 2–4 minutes per level. This is an editorial estimate, not a result from learner timing studies.

## Implementation and checks

- Each audience retains its own `content.json`, `quiz.js`, `lesson.js`, and styles. The summary and quiz content live under `review` in that course’s JSON.
- Native radio groups, labels, keyboard-operable buttons, feedback focus, and a status message support interaction without relying only on color. The existing reduced-motion stylesheet remains in effect.
- `npm test`: 38 checks pass, including the financial models, local links, archived-file integrity, five-chapter quiz coverage, and correct/incorrect/unanswered scoring for every audience.
- Browser preview: completed the college quiz with one wrong and four correct answers; observed the correct 4/5 result, explanations, retry reset, exit, and course completion without finishing a quiz. Opened the college summary and started quizzes in all five audience environments.
- At a 390-pixel iframe width, inspected college quiz labels and buttons and observed no horizontal body overflow (client width and scroll width both 375 pixels, accounting for the scrollbar). This is a browser layout check, not a physical-device or screen-reader study.

## Publication and preservation

Published through the existing GitHub Pages setup. The complete Version 4 runtime is preserved at `iterations/iteration-04/`, with an actual source commit and independent browser-storage namespace recorded by the snapshot tool. Versions 1, 2, and 3 are not edited by this iteration. See the snapshot manifest for source provenance and file hashes.

Live publication check: opened the preserved Version 4 hub and college course on GitHub Pages, started the quiz, selected an answer, and observed its explanatory feedback. Screenshot: `iteration-04-live-feedback.jpg`.
