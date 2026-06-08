import { ref } from "vue";

const setupElements = new WeakSet<HTMLElement>();

export function useMousePosition() {
  const x = ref(0);
  const y = ref(0);

  function setup(hostElement: HTMLElement) {
    if (setupElements.has(hostElement)) {
      throw new Error(
        `useMousePosition.setup() called twice on the same element`,
      );
    }

    const handler = (e: PointerEvent) => {
      x.value = e.clientX;
      y.value = e.clientY;
    };

    hostElement.addEventListener("pointermove", handler);
    setupElements.add(hostElement);

    return () => {
      hostElement.removeEventListener("pointermove", handler);
      setupElements.delete(hostElement);
    };
  }

  return { x, y, setup };
}
