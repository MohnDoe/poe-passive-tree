import { onUnmounted, ref } from "vue";

export function useMousePosition() {
  const x = ref(0);
  const y = ref(0);

  function setup(hostElement: HTMLElement) {
    const handler = (e: PointerEvent) => {
      x.value = e.clientX;
      y.value = e.clientY;
    };

    hostElement.addEventListener("pointermove", handler);

    onUnmounted(() => {
      hostElement.removeEventListener("pointermove", handler);
    });

    return () => {
      hostElement.removeEventListener("pointermove", handler);
    };
  }

  return { x, y, setup };
}
