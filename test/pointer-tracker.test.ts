import { test } from 'node:test';
import assert from 'node:assert/strict';

class PointerEventStub {
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
  pointerId: number;
  getCoalescedEvents?: () => PointerEventStub[];

  constructor(init: {
    pageX: number;
    pageY: number;
    clientX: number;
    clientY: number;
    pointerId?: number;
    getCoalescedEvents?: () => PointerEventStub[];
  }) {
    this.pageX = init.pageX;
    this.pageY = init.pageY;
    this.clientX = init.clientX;
    this.clientY = init.clientY;
    this.pointerId = init.pointerId ?? -1;
    this.getCoalescedEvents = init.getCoalescedEvents;
  }
}

// Pointer uses browser globals for feature detection.
const g = globalThis as typeof globalThis & {
  self: typeof globalThis;
  PointerEvent: typeof PointerEventStub;
};
g.self = globalThis;
g.PointerEvent = PointerEventStub;

const { Pointer } = await import('../src/shared/pointer-tracker.ts');

test('Pointer copies coordinates from mouse events', () => {
  const native = {
    pageX: 10,
    pageY: 20,
    clientX: 5,
    clientY: 15,
  };

  const pointer = new Pointer(native as MouseEvent);

  assert.equal(pointer.pageX, 10);
  assert.equal(pointer.pageY, 20);
  assert.equal(pointer.clientX, 5);
  assert.equal(pointer.clientY, 15);
  assert.equal(pointer.id, -1);
  assert.equal(pointer.nativePointer, native);
});

test('Pointer reads pointerId from PointerEvent', () => {
  const native = new PointerEventStub({
    pageX: 0,
    pageY: 0,
    clientX: 0,
    clientY: 0,
    pointerId: 42,
  });

  const pointer = new Pointer(native);

  assert.equal(pointer.id, 42);
});

test('Pointer getCoalesced returns self when coalesced events are unavailable', () => {
  const native = {
    pageX: 1,
    pageY: 2,
    clientX: 3,
    clientY: 4,
  };

  const pointer = new Pointer(native as MouseEvent);
  const coalesced = pointer.getCoalesced();

  assert.equal(coalesced.length, 1);
  assert.equal(coalesced[0], pointer);
});

test('Pointer getCoalesced maps coalesced pointer events', () => {
  const coalescedEvents = [
    new PointerEventStub({
      pageX: 1,
      pageY: 2,
      clientX: 3,
      clientY: 4,
      pointerId: 7,
    }),
    new PointerEventStub({
      pageX: 5,
      pageY: 6,
      clientX: 7,
      clientY: 8,
      pointerId: 7,
    }),
  ];
  const native = new PointerEventStub({
    pageX: 5,
    pageY: 6,
    clientX: 7,
    clientY: 8,
    pointerId: 7,
    getCoalescedEvents: () => coalescedEvents,
  });

  const pointer = new Pointer(native);
  const coalesced = pointer.getCoalesced();

  assert.equal(coalesced.length, 2);
  assert.equal(coalesced[0].pageX, 1);
  assert.equal(coalesced[1].pageX, 5);
});