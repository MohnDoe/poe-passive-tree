import { createHoverPreviewStateModel } from "@/pixi/scene/createHoverPreview";
import { useUiStore } from "@/stores/ui.store";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAllocationStore } from "@/stores/allocation.store";

export function useHoverPreview() {
  const uiStore = useUiStore();
  const { allocationState } = storeToRefs(useAllocationStore());
  const { hoveredNodeId } = storeToRefs(uiStore);

  const hoverPreview = computed(() => {
    return createHoverPreviewStateModel({
      hoveredNodeId: hoveredNodeId.value,
      allocationState: allocationState.value,
    });
  });

  return {
    hoverPreview,
  };
}
