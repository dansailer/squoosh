/**
 * Based on pointer-tracker by Jake Archibald (MIT).
 * https://github.com/GoogleChromeLabs/pointer-tracker
 */

export type InputEvent = TouchEvent | PointerEvent | MouseEvent;

const isPointerEvent = (event: Event): event is PointerEvent =>
  'pointerId' in event;
const isTouchEvent = (event: Event): event is TouchEvent =>
  'changedTouches' in event;
const hasButtons = (event: Event): event is PointerEvent | MouseEvent =>
  'buttons' in event;

export class Pointer {
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
  id: number;
  nativePointer: Touch | PointerEvent | MouseEvent;

  constructor(nativePointer: Touch | PointerEvent | MouseEvent) {
    this.nativePointer = nativePointer;
    this.pageX = nativePointer.pageX;
    this.pageY = nativePointer.pageY;
    this.clientX = nativePointer.clientX;
    this.clientY = nativePointer.clientY;
    this.id = -1;

    if (self.Touch && nativePointer instanceof Touch) {
      this.id = nativePointer.identifier;
    } else if (nativePointer instanceof PointerEvent) {
      this.id = nativePointer.pointerId;
    }
  }

  getCoalesced(): Pointer[] {
    if ('getCoalescedEvents' in this.nativePointer) {
      const events = this.nativePointer
        .getCoalescedEvents()
        .map((p) => new Pointer(p));
      if (events.length > 0) return events;
    }
    return [this];
  }
}

type StartCallback = (pointer: Pointer, event: InputEvent) => boolean;
type MoveCallback = (
  previousPointers: Pointer[],
  changedPointers: Pointer[],
  event: InputEvent,
) => void;
type EndCallback = (
  pointer: Pointer,
  event: InputEvent,
  cancelled: boolean,
) => void;

interface PointerTrackerOptions {
  start?: StartCallback;
  move?: MoveCallback;
  end?: EndCallback;
  rawUpdates?: boolean;
  avoidPointerEvents?: boolean;
}

export default class PointerTracker {
  readonly startPointers: Pointer[] = [];
  readonly currentPointers: Pointer[] = [];

  private readonly _element: HTMLElement;
  private readonly _startCallback: StartCallback;
  private readonly _moveCallback: MoveCallback;
  private readonly _endCallback: EndCallback;
  private readonly _rawUpdates: boolean;
  private readonly _excludeFromButtonsCheck = new Set<number>();

  private readonly _pointerStart: (event: Event) => void;
  private readonly _touchStart: (event: Event) => void;
  private readonly _move: (event: Event) => void;
  private readonly _pointerEnd: (event: Event) => void;
  private readonly _touchEnd: (event: Event) => void;

  constructor(
    element: HTMLElement,
    {
      start = () => true,
      move = () => {},
      end = () => {},
      rawUpdates = false,
      avoidPointerEvents = false,
    }: PointerTrackerOptions = {},
  ) {
    this._element = element;
    this._startCallback = start;
    this._moveCallback = move;
    this._endCallback = end;
    this._rawUpdates = rawUpdates && 'onpointerrawupdate' in window;

    this._pointerStart = (event) => {
      if (!hasButtons(event)) return;

      if (isPointerEvent(event) && event.buttons === 0) {
        this._excludeFromButtonsCheck.add(event.pointerId);
      } else if (!(event.buttons & 1)) {
        return;
      }

      const pointer = new Pointer(event);
      if (this.currentPointers.some((p) => p.id === pointer.id)) return;
      if (!this._triggerPointerStart(pointer, event)) return;

      if (isPointerEvent(event)) {
        const capturingElement =
          event.target && 'setPointerCapture' in event.target
            ? (event.target as Element)
            : this._element;
        (capturingElement as HTMLElement).setPointerCapture(event.pointerId);
        this._element.addEventListener(
          this._rawUpdates ? 'pointerrawupdate' : 'pointermove',
          this._move,
        );
        this._element.addEventListener('pointerup', this._pointerEnd);
        this._element.addEventListener('pointercancel', this._pointerEnd);
      } else {
        window.addEventListener('mousemove', this._move);
        window.addEventListener('mouseup', this._pointerEnd);
      }
    };

    this._touchStart = (event) => {
      if (!isTouchEvent(event)) return;
      for (const touch of Array.from(event.changedTouches)) {
        this._triggerPointerStart(new Pointer(touch), event);
      }
    };

    this._move = (event) => {
      if (
        !isTouchEvent(event) &&
        (!isPointerEvent(event) ||
          !this._excludeFromButtonsCheck.has(event.pointerId)) &&
        hasButtons(event) &&
        event.buttons === 0
      ) {
        this._pointerEnd(event);
        return;
      }

      const previousPointers = this.currentPointers.slice();
      const changedPointers = isTouchEvent(event)
        ? Array.from(event.changedTouches).map((t) => new Pointer(t))
        : hasButtons(event)
          ? [new Pointer(event)]
          : [];
      const trackedChangedPointers: Pointer[] = [];

      for (const pointer of changedPointers) {
        const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
        if (index === -1) continue;
        trackedChangedPointers.push(pointer);
        this.currentPointers[index] = pointer;
      }

      if (trackedChangedPointers.length === 0) return;
      this._moveCallback(
        previousPointers,
        trackedChangedPointers,
        event as InputEvent,
      );
    };

    this._pointerEnd = (event) => {
      if (!hasButtons(event)) return;
      if (!this._triggerPointerEnd(new Pointer(event), event)) return;

      if (isPointerEvent(event)) {
        if (this.currentPointers.length) return;
        this._element.removeEventListener(
          this._rawUpdates ? 'pointerrawupdate' : 'pointermove',
          this._move,
        );
        this._element.removeEventListener('pointerup', this._pointerEnd);
        this._element.removeEventListener('pointercancel', this._pointerEnd);
      } else {
        window.removeEventListener('mousemove', this._move);
        window.removeEventListener('mouseup', this._pointerEnd);
      }
    };

    this._touchEnd = (event) => {
      if (!isTouchEvent(event)) return;
      for (const touch of Array.from(event.changedTouches)) {
        this._triggerPointerEnd(new Pointer(touch), event);
      }
    };

    if (self.PointerEvent && !avoidPointerEvents) {
      this._element.addEventListener('pointerdown', this._pointerStart);
    } else {
      this._element.addEventListener('mousedown', this._pointerStart);
      this._element.addEventListener('touchstart', this._touchStart);
      this._element.addEventListener('touchmove', this._move);
      this._element.addEventListener('touchend', this._touchEnd);
      this._element.addEventListener('touchcancel', this._touchEnd);
    }
  }

  stop() {
    this._element.removeEventListener('pointerdown', this._pointerStart);
    this._element.removeEventListener('mousedown', this._pointerStart);
    this._element.removeEventListener('touchstart', this._touchStart);
    this._element.removeEventListener('touchmove', this._move);
    this._element.removeEventListener('touchend', this._touchEnd);
    this._element.removeEventListener('touchcancel', this._touchEnd);
    this._element.removeEventListener(
      this._rawUpdates ? 'pointerrawupdate' : 'pointermove',
      this._move,
    );
    this._element.removeEventListener('pointerup', this._pointerEnd);
    this._element.removeEventListener('pointercancel', this._pointerEnd);
    window.removeEventListener('mousemove', this._move);
    window.removeEventListener('mouseup', this._pointerEnd);
  }

  private _triggerPointerStart(
    pointer: Pointer,
    event: InputEvent,
  ): boolean {
    if (!this._startCallback(pointer, event)) return false;
    this.currentPointers.push(pointer);
    this.startPointers.push(pointer);
    return true;
  }

  private _triggerPointerEnd(pointer: Pointer, event: InputEvent): boolean {
    if (!isTouchEvent(event) && hasButtons(event) && event.buttons & 1) {
      return false;
    }

    const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
    if (index === -1) return false;

    this.currentPointers.splice(index, 1);
    this.startPointers.splice(index, 1);
    this._excludeFromButtonsCheck.delete(pointer.id);

    const cancelled = !(
      event.type === 'mouseup' ||
      event.type === 'touchend' ||
      event.type === 'pointerup'
    );
    this._endCallback(pointer, event, cancelled);
    return true;
  }
}