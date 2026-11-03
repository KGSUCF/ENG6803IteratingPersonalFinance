const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// A missing answer is never counted as correct, including answer index zero.
export function scoreQuiz(questions, answers) {
 return questions.reduce((total, question, index) => total + (Number.isInteger(answers[index]) && answers[index] === question.answer ? 1 : 0), 0);
}

export function mountQuiz(host, review, revisit) {
 let answers = [], position = 0, checked = false;
 const focusHeading = () => host.querySelector('[data-quiz-heading]')?.focus();
 const shell = body => `<section class="quiz-card" aria-label="Optional knowledge check">${body}</section>`;
 function welcome(focus = false) {
  host.innerHTML = shell(`<div class="quiz-badge" aria-hidden="true">? → !</div><p class="eyebrow">OPTIONAL / ABOUT 2–4 MINUTES</p><h3 data-quiz-heading tabindex="-1">${escape(review.title)}</h3><p>${escape(review.intro)}</p><p>Five questions with explanations. No timer or passing score. Answers stay in this page’s memory and reset when you leave or reload.</p><button class="primary" type="button" data-start>Try the optional quiz →</button><p class="quiz-small">Prefer to skip? You can mark the course complete or continue to the next level below.</p>`);
  host.querySelector('[data-start]').onclick = () => { answers = []; position = 0; checked = false; question(); };
  if (focus) focusHeading();
 }
 function question() {
  const q = review.questions[position];
  host.innerHTML = shell(`<p class="eyebrow">QUESTION ${position + 1} OF ${review.questions.length} / OPTIONAL</p><div class="quiz-dots" aria-hidden="true">${review.questions.map((_, i) => `<span class="${i < position ? 'done' : i === position ? 'current' : ''}">${i < position ? '✓' : i + 1}</span>`).join('')}</div><form data-quiz-form><fieldset><legend data-quiz-heading tabindex="-1">${escape(q.prompt)}</legend><div class="quiz-options">${q.choices.map((choice, i) => `<label class="quiz-choice"><input type="radio" name="quiz-answer" value="${i}" ${answers[position] === i ? 'checked' : ''}><span>${escape(choice)}</span></label>`).join('')}</div></fieldset><p class="quiz-message" role="status"></p><button class="primary" type="submit">Check my answer</button></form><div data-feedback></div><button type="button" class="text-button quiz-exit" data-exit>Leave the quiz</button>`);
  const form = host.querySelector('form');
  form.onsubmit = event => {
   event.preventDefault();
   if (checked) return;
   const selected = form.querySelector('input:checked');
   if (!selected) { host.querySelector('.quiz-message').textContent = 'Choose one answer first. A thoughtful guess is welcome.'; return; }
   answers[position] = Number(selected.value);
   checked = true;
   form.querySelectorAll('input').forEach(input => { input.disabled = true; });
   form.querySelector('button').hidden = true;
   host.querySelector('.quiz-message').textContent = '';
   const correct = answers[position] === q.answer;
   const feedback = host.querySelector('[data-feedback]');
   feedback.innerHTML = `<div class="quiz-feedback ${correct ? 'is-correct' : 'is-review'}"><h4 tabindex="-1">${correct ? '✓ That’s it.' : '↻ A useful idea to revisit.'}</h4>${correct ? '' : `<p><strong>Answer:</strong> ${escape(q.choices[q.answer])}</p>`}<p>${escape(q.explanation)}</p></div><button type="button" class="primary" data-advance>${position === review.questions.length - 1 ? 'See my recap' : 'Next question'} →</button>`;
   feedback.querySelector('h4').focus();
   feedback.querySelector('[data-advance]').onclick = () => { position++; checked = false; if (position === review.questions.length) results(); else question(); };
  };
  host.querySelector('[data-exit]').onclick = () => welcome(true);
  focusHeading();
 }
 function results() {
  const score = scoreQuiz(review.questions, answers);
  host.innerHTML = shell(`<div class="quiz-badge" aria-hidden="true">✓</div><p class="eyebrow">YOUR KNOWLEDGE CHECK</p><h3 data-quiz-heading tabindex="-1">${score} of ${review.questions.length} ideas spotted.</h3><p>${score === review.questions.length ? 'You connected all five ideas in this round. Keep asking good questions when the real-world details change.' : 'Every explanation is part of the lesson. Revisit any idea below or try another round.'} This short check is practice, not a measure of your financial situation or readiness.</p><ol class="quiz-review">${review.questions.map((q, i) => `<li><p class="quiz-verdict">${answers[i] === q.answer ? '✓ Correct' : '↻ Review'} · ${escape(q.prompt)}</p><p>Your answer: ${escape(q.choices[answers[i]])}</p>${answers[i] === q.answer ? '' : `<p><strong>Correct answer:</strong> ${escape(q.choices[q.answer])}</p>`}<p>${escape(q.explanation)}</p><button type="button" class="text-button" data-revisit="${q.chapter}">Revisit chapter ${q.chapter + 1} →</button></li>`).join('')}</ol><button type="button" class="primary" data-retry>Try the quiz again ↻</button><button type="button" class="text-button quiz-exit" data-exit>Close the quiz recap</button>`);
  host.querySelector('[data-retry]').onclick = () => { answers = []; position = 0; checked = false; question(); };
  host.querySelector('[data-exit]').onclick = () => welcome(true);
  host.querySelectorAll('[data-revisit]').forEach(button => { button.onclick = () => revisit(Number(button.dataset.revisit)); });
  focusHeading();
 }
 welcome();
}
