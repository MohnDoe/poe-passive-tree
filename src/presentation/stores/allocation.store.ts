import { computeAllocationState } from "@/application/build/allocation/computeAllocationState";
import { computeHoverPreviewState } from "@/application/build/allocation/computeHoverPreviewState";
import { defineStore } from "pinia";
import { computed } from "vue";
import { useBuildStore } from "./build.store";
import { useRuntimeStore } from "./runtime.store";
import { useUiStore } from "./ui.store";

export const useAllocationStore = defineStore("allocation", () => {
  const buildStore = useBuildStore();
  const runtimeStore = useRuntimeStore();
  const uiStore = useUiStore();

  const allocationState = computed(() => {
    const { graph } = runtimeStore;
    const { build } = buildStore;

    if (!graph || build.activeClassId === null) return null;
    return computeAllocationState({ graph: graph, buildState: build });
  });

  const hoverPreviewState = computed(() => {
    const { hoveredNodeId } = uiStore;
    const state = allocationState.value;
    if (!state) return null;

    return computeHoverPreviewState({
      allocationState: state,
      hoveredNodeId,
    });
  });

  return { allocationState, hoverPreviewState };
});
