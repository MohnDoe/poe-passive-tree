import { computed } from "vue";
import { useAllocationSnapshot } from "./useAllocationSnapshot";
import { createTreeVisualState } from "@/pixi/scene/createTreeVisualStateModel";

export function usePassiveTreeVisualState() {
  const { snapshot } = useAllocationSnapshot();

  const treeVisualState = computed(() => createTreeVisualState({ snapshot: snapshot.value }));

  return { treeVisualState };
}
