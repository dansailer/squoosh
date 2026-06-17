import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linkRef } from '../src/shared/prerendered-app/util.ts';

test('linkRef assigns rendered elements to the target property', () => {
  const component = { element: undefined as HTMLElement | undefined };
  const ref = linkRef<HTMLElement>(component, 'element');
  const node = {} as HTMLElement;

  ref(node);

  assert.equal(component.element, node);
});

test('linkRef returns the same function for repeated calls', () => {
  const component = { element: undefined as HTMLElement | undefined };
  const first = linkRef<HTMLElement>(component, 'element');
  const second = linkRef<HTMLElement>(component, 'element');

  assert.equal(first, second);
});