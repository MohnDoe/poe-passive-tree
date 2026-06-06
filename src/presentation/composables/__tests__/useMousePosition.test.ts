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

  it("throws when setup is called twice on the same element", () => {
    const host = vueRef(document.createElement("div"));
    document.body.appendChild(host.value);

    const { setup } = useMousePosition();
    setup(host.value);

    expect(() => setup(host.value)).toThrow();

    document.body.removeChild(host.value);
  });

  it("allows fresh setup after teardown", async () => {
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

    // Fresh setup should work on the same element
    const teardown2 = setup(host.value);
    host.value.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 300, clientY: 400 }),
    );
    await nextTick();
    expect(x.value).toBe(300);
    expect(y.value).toBe(400);

    teardown2();
    document.body.removeChild(host.value);
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
