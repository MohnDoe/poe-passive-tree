import { createHoverPreviewStateModel } from "@/pixi/scene/createHoverPreview";
import { useUiStore } from "@/stores/ui.store";
import { computed } from "vue";
import { useAllocationSnapshot } from "./useAllocationSnapshot";
import { storeToRefs } from "pinia";

export function useHoverPreview() {
  const uiStore = useUiStore();
  const { snapshot } = useAllocationSnapshot();
  const { hoveredNodeId } = storeToRefs(uiStore);

  const hoverPreview = computed(() => {
    return createHoverPreviewStateModel({
      hoveredNodeId: hoveredNodeId.value,
      snapshot: snapshot.value,
    });
  });

  return {
    hoverPreview,
  };
}
