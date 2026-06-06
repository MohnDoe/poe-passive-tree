<script setup lang="ts">
import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import { storeToRefs } from "pinia";
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { usePassiveTreeVisualState } from "../composables/usePassiveTreeVisualState";
import { useTreeInteraction } from "../composables/useTreeInteraction";
import { createTreeSceneModel } from "../pixi/scene/createTreeSceneModel";
import { PassiveTreeStage } from "../pixi/stage/PassiveTreeStage";
import { useAllocationStore } from "../stores/allocation.store";
import { useRuntimeStore } from "../stores/runtime.store";
import { useUiStore } from "../stores/ui.store";

const uiStore = useUiStore();
const runtimeStore = useRuntimeStore();
const treeInteraction = useTreeInteraction();

const { graph } = storeToRefs(runtimeStore);
const { treeVisualState } = usePassiveTreeVisualState();
const { hoverPreviewState } = storeToRefs(useAllocationStore());

const hostRef = ref<HTMLDivElement | null>(null);
const stage = shallowRef<PassiveTreeStage | null>(null);

const defaultHoverPreviewState: HoverPreviewState = {
  hoveredNodeId: null,
  highlight: {
    edgeKeys: new Set(),
    nodeIds: new Set(),
  },
  refund: {
    edgeKeys: new Set(),
    nodeIds: new Set(),
  },
  tooltip: null,
};

onMounted(async () => {
  if (!hostRef.value || !graph.value) return;

  const nextStage = new PassiveTreeStage();

  stage.value = nextStage;

  await nextStage.mount(hostRef.value, {
    onNodeClick: (nodeId) => {
      console.log("Click node", nodeId);
      treeInteraction.toggleNode(nodeId);
    },
    onNodeHover: (nodeId) => {
      uiStore.setHoveredNodeId(nodeId);
    },
  });

  nextStage.renderStaticScene(createTreeSceneModel({ graph: graph.value }));

  nextStage.fitToBounds(graph.value.bounds);
});

watch(graph, (nextGraph) => {
  if (!nextGraph || !stage.value) return;

  stage.value.renderStaticScene(createTreeSceneModel({ graph: nextGraph }));
  stage.value.fitToBounds(nextGraph.bounds);
});

watch(
  treeVisualState,
  (nextTreeVisualState) => {
    if (!nextTreeVisualState || !stage.value) return;

    stage.value.updateVisualStates(nextTreeVisualState);
  },
  { immediate: true },
);

watch(
  hoverPreviewState,
  (current, previous) => {
    if (!stage.value) return;

    const prev = previous ?? defaultHoverPreviewState;

    stage.value.updateHoverState({
      current,
      previous: prev,
    });
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stage.value?.destroy();
  stage.value = null;
});
</script>
<template>
  <div ref="hostRef" class="the-tree"></div>
</template>
<style scoped>
.the-tree {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
