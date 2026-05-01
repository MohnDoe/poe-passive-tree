import { computeAllocationState } from "@/services/passiveTree/allocation/computeAllocationState";
import { defineStore } from "pinia";
import { computed } from "vue";
import { useBuildStore } from "./build.store";
import { useRuntimeStore } from "./runtime.store";

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
