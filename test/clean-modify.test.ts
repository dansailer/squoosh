import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanMerge, cleanSet } from '../src/client/lazy-app/util/clean-modify.ts';

test('cleanSet immutably sets nested values', () => {
  const source = { foo: { bar: 1 } };
  const result = cleanSet(source, 'foo.bar', 2);

  assert.equal(source.foo.bar, 1);
  assert.equal(result.foo.bar, 2);
  assert.notEqual(result, source);
  assert.notEqual(result.foo, source.foo);
});

test('cleanMerge immutably merges nested objects', () => {
  const source = { foo: { bar: 1, keep: true } };
  const result = cleanMerge(source, 'foo', { bar: 2, added: 'yes' });

  assert.equal(source.foo.bar, 1);
  assert.deepEqual(result.foo, { bar: 2, keep: true, added: 'yes' });
});

test('cleanSet supports array paths', () => {
  const source = { items: [{ id: 1 }] };
  const result = cleanSet(source, ['items', 0, 'id'], 2);

  assert.equal(source.items[0].id, 1);
  assert.equal(result.items[0].id, 2);
});

test('cleanSet replaces values without mutating siblings', () => {
  const source = { foo: { bar: 1, sibling: true } };
  const result = cleanSet(source, 'foo.bar', 99);

  assert.equal(source.foo.bar, 1);
  assert.equal(result.foo.bar, 99);
  assert.equal(result.foo.sibling, true);
});

test('cleanMerge does not mutate the source object', () => {
  const source = { foo: { bar: 1 } };
  const result = cleanMerge(source, 'foo', { bar: 2 });

  assert.deepEqual(source, { foo: { bar: 1 } });
  assert.notEqual(result, source);
});