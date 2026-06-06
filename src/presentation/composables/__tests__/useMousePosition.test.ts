import { describe, expect, it } from "vitest";
import { nextTick, ref as vueRef } from "vue";
import { useMousePosition } from "../useMousePosition";

describe("useMousePosition", () => {
  it("returns initial position { x: 0, y: 0 }", () => {
    const { x, y } = useMousePosition();

    expect(x.value).toBe(0);
    expect(y.value).toBe(0);
  });

  it("updates position on pointermove event on host element", async () => {
    const host = vueRef(document.createElement("div"));
    document.body.appendChild(host.value);

    const { x, y, setup } = useMousePosition();
    const teardown = setup(host.value);

    host.value.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 200 }),
    );
    await nextTick();

    expect(x.value).toBe(100);
    expect(y.value).toBe(200);

    teardown();
    document.body.removeChild(host.value);
  });

  it("does not update when pointermove fires outside the host element", async () => {
    const host = vueRef(document.createElement("div"));
    const outside = vueRef(document.createElement("div"));
    document.body.appendChild(host.value);
    document.body.appendChild(outside.value);

    const { x, y, setup } = useMousePosition();
    const teardown = setup(host.value);

    host.value.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 200 }),
    );
    await nextTick();

    expect(x.value).toBe(100);
    expect(y.value).toBe(200);

    outside.value.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 999, clientY: 888 }),
    );
    await nextTick();

    expect(x.value).toBe(100);
    expect(y.value).toBe(200);

    teardown();
    document.body.removeChild(host.value);
    document.body.removeChild(outside.value);
  });

  it("cleans up listener on teardown", async () => {
    const host = vueRef(document.createElement("div"));
    document.body.appendChild(host.value);

    const { x, y, setup } = useMousePosition();
    const teardown = setup(host.value);

    host.value.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 200 }),
    );
    await nextTick();
    expect(x.value).toBe(100);

    teardown();

    host.value.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 999, clientY: 888 }),
    );
    await nextTick();

    // Position should remain unchanged after teardown
    expect(x.value).toBe(100);
    expect(y.value).toBe(200);

    document.body.removeChild(host.value);
  });
});
