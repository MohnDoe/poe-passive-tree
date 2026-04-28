import { useRuntimeStore } from "@/stores/runtime.store";
import { storeToRefs } from "pinia";

export function usePassiveTreeRuntime() {
  const runtimeStore = useRuntimeStore();
  const { graph, status, error } = storeToRefs(runtimeStore);

  async function ensureLoaded() {
    if (graph.value || status.value === "ready") return;
    await runtimeStore.load();
  }

  return { graph, status, error, ensureLoaded };
}
