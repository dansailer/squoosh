import { test } from 'node:test';
import assert from 'node:assert/strict';
import dedent from '../lib/dedent.js';

test('dedent strips common indentation', () => {
  const result = dedent`
    line one
    line two
  `;
  assert.equal(result, 'line one\nline two');
});

test('dedent interpolates values', () => {
  const name = 'Squoosh';
  const result = dedent`
    hello ${name}
    goodbye
  `;
  assert.equal(result, 'hello Squoosh\ngoodbye');
});

test('dedent handles single-line strings', () => {
  const result = dedent`  one line`;
  assert.equal(result, 'one line');
});

test('dedent ignores blank lines when computing indentation', () => {
  const result = dedent`
    first

    second
  `;
  assert.equal(result, 'first\n\nsecond');
});