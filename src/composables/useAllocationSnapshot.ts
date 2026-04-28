import { buildAllocationSnapshot } from "@/services/passiveTree/allocation/buildAllocationSnapshot";
import { useBuildStore } from "@/stores/build.store";
import { useRuntimeStore } from "@/stores/runtime.store";
import { storeToRefs } from "pinia";
import { computed } from "vue";

export function useAllocationSnapshot() {
  const buildStore = useBuildStore();
  const runtimeStore = useRuntimeStore();

  const { graph } = storeToRefs(runtimeStore);
  const { build } = storeToRefs(buildStore);

  const snapshot = computed(() => {
    if (!graph.value || build.value.activeClassId === null) return null;

    return buildAllocationSnapshot({
      graph: graph.value,
      buildState: {
        allocatedNodeIds: new Set(build.value.allocatedNodeIds),
        activeClassId: build.value.activeClassId,
        activeAscendancy: build.value.activeAscendancy,
      },
    });
  });

  return { snapshot };
}
