import { test } from 'node:test';
import assert from 'node:assert/strict';
import linkState from '../src/shared/link-state.ts';

test('linkState updates checkbox state from change events', () => {
  const updates: object[] = [];
  const component = {
    state: { showAdvanced: false },
    setState(update: object) {
      updates.push(update);
      Object.assign(this.state, update);
    },
  };

  const handler = linkState(component, 'showAdvanced');
  const sameHandler = linkState(component, 'showAdvanced');

  assert.equal(handler, sameHandler);

  handler({
    target: {
      nodeName: 'INPUT',
      type: 'checkbox',
      checked: true,
      value: 'on',
    },
  } as Event);

  assert.deepEqual(updates, [{ showAdvanced: true }]);
  assert.equal(component.state.showAdvanced, true);
});

test('linkState reads text input values', () => {
  const updates: object[] = [];
  const component = {
    state: { label: '' },
    setState(update: object) {
      updates.push(update);
    },
  };

  linkState(component, 'label')({
    target: {
      nodeName: 'INPUT',
      type: 'text',
      checked: false,
      value: 'hello',
    },
  } as Event);

  assert.deepEqual(updates, [{ label: 'hello' }]);
});

test('linkState reads radio button checked state', () => {
  const updates: object[] = [];
  const component = {
    state: { enabled: false },
    setState(update: object) {
      updates.push(update);
    },
  };

  linkState(component, 'enabled')({
    target: {
      nodeName: 'INPUT',
      type: 'radio',
      checked: true,
      value: 'on',
    },
  } as Event);

  assert.deepEqual(updates, [{ enabled: true }]);
});

test('linkState supports nested paths', () => {
  const updates: object[] = [];
  const component = {
    state: { options: { quality: 75 } },
    setState(update: object) {
      updates.push(update);
    },
  };

  linkState(component, 'options.quality')({
    target: {
      nodeName: 'INPUT',
      type: 'range',
      checked: false,
      value: '90',
    },
  } as Event);

  assert.deepEqual(updates, [{ options: { quality: '90' } }]);
});

test('linkState can read values from a custom target path', () => {
  const updates: object[] = [];
  const component = {
    state: { copied: '' },
    setState(update: object) {
      updates.push(update);
    },
  };

  linkState(component, 'copied', 'clipboardData.text')({
    clipboardData: { text: 'clipboard contents' },
  } as Event);

  assert.deepEqual(updates, [{ copied: 'clipboard contents' }]);
});