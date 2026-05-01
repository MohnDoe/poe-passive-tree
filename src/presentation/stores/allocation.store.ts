import { defineStore } from "pinia";
import { computed } from "vue";
import { useBuildStore } from "./build.store";
import { useRuntimeStore } from "./runtime.store";
import { computeAllocationState } from "@/application/build/allocation/computeAllocationState";

export const useAllocationStore = defineStore("allocation", () => {
  const buildStore = useBuildStore();
  const runtimeStore = useRuntimeStore();

  const allocationState = computed(() => {
    const { graph } = runtimeStore;
    const { build } = buildStore;

    if (!graph || build.activeClassId === null) return null;
    return computeAllocationState({ graph: graph, buildState: build });
  });

  return { allocationState };
});
