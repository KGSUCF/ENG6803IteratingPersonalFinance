import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
for (const id of ['child','teen','college','post-college','expert']) {
 const content = JSON.parse(await readFile(new URL(`../${id}/content.json`, import.meta.url),'utf8'));
 const {scoreQuiz} = await import(`../${id}/quiz.js`);
 const questions = content.review.questions;
 test(`${id}: review covers every chapter with an unambiguous valid answer`, () => {
  assert.equal(content.review.summary.length,5);
  assert.equal(questions.length,5);
  assert.deepEqual(questions.map(q=>q.chapter),[0,1,2,3,4]);
  for (const q of questions) {
   assert.ok(q.prompt.length>10);assert.equal(q.choices.length,3);
   assert.equal(new Set(q.choices).size,3);
   assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length);
   assert.ok(q.explanation.length>30);
  }
 });
 test(`${id}: scoring separates correct, incorrect, and unanswered choices`, () => {
  assert.equal(scoreQuiz(questions,questions.map(q=>q.answer)),5);
  assert.equal(scoreQuiz(questions,questions.map(q=>(q.answer+1)%3)),0);
  assert.equal(scoreQuiz(questions,[]),0);
  assert.equal(scoreQuiz(questions,questions.map(()=>null)),0);
  const mixed=questions.map((q,i)=>i<2?q.answer:(q.answer+1)%3);
  assert.equal(scoreQuiz(questions,mixed),2);
 });
}
