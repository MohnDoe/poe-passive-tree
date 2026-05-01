<script setup lang="ts">
import { useHoverPreview } from "@/composables/useHoverPreview";
import { usePassiveTreeVisualState } from "@/composables/usePassiveTreeVisualState";
import { useTreeInteraction } from "@/composables/useTreeInteraction";
import { type HoverPreviewStateModel, type HoverVisualDelta } from "@/pixi/models/Render";
import { createTreeSceneModel } from "@/pixi/scene/createTreeSceneModel";
import { PassiveTreeStage } from "@/pixi/stage/PassiveTreeStage";
import { useRuntimeStore } from "@/stores/runtime.store";
import { useUiStore } from "@/stores/ui.store";
import { storeToRefs } from "pinia";
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

const uiStore = useUiStore();
const runtimeStore = useRuntimeStore();
const treeInteraction = useTreeInteraction();

const { graph } = storeToRefs(runtimeStore);
const { treeVisualState } = usePassiveTreeVisualState();
const { hoverPreview: hoverPreviewState } = useHoverPreview();

const hostRef = ref<HTMLDivElement | null>(null);
const stage = shallowRef<PassiveTreeStage | null>(null);

const previousHoveredState = ref<HoverPreviewStateModel>({
  hoveredNodeId: null,
  highlight: {
    edgeKeys: new Set(),
    nodeIds: new Set(),
  },
  refund: {
    edgeKeys: new Set(),
    nodeIds: new Set(),
  },
});

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
  (nextHoverPreviewState) => {
    if (!treeVisualState.value || !stage.value) return;

    const delta: HoverVisualDelta = {
      ...nextHoverPreviewState,
      previous: previousHoveredState.value,
    };

    stage.value.updateHoverState({
      delta,
      treeState: treeVisualState.value,
      hoverPreviewState: nextHoverPreviewState,
    });

    previousHoveredState.value = {
      ...nextHoverPreviewState,
      hoveredNodeId: nextHoverPreviewState.hoveredNodeId,
    };
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
