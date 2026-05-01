import { storeToRefs } from "pinia";
import { useRuntimeStore } from "../stores/runtime.store";

export function usePassiveTreeRuntime() {
  const runtimeStore = useRuntimeStore();
  const { graph, status, error } = storeToRefs(runtimeStore);

  async function ensureLoaded() {
    if (
      graph.value ||
      status.value === "ready" ||
      status.value === "error" ||
      status.value === "loading"
    )
      return;
    await runtimeStore.load();
  }

  return { graph, status, error, ensureLoaded };
}
