import "@testing-library/jest-dom/vitest";

// jsdom does not implement PointerEvent, which Radix UI primitives rely on.
if (window.PointerEvent === undefined) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;

    constructor(type: string, props: PointerEventInit = {}) {
      super(type, props);
      this.pointerId = props.pointerId ?? 0;
      this.pointerType = props.pointerType ?? "mouse";
    }
  }

  window.PointerEvent = PointerEventPolyfill as typeof PointerEvent;
}
