import { computed } from "vue";
import { createTreeVisualState } from "@/pixi/scene/createTreeVisualStateModel";
import { useAllocationStore } from "@/stores/allocation.store";
import { storeToRefs } from "pinia";

export function usePassiveTreeVisualState() {
  const { allocationState } = storeToRefs(useAllocationStore());

  const treeVisualState = computed(() =>
    createTreeVisualState({ allocationState: allocationState.value }),
  );

  return { treeVisualState };
}
