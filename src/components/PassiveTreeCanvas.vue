<script setup lang="ts">
import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { HoverVisualDelta, TreeVisualStateModel } from "@/pixi/models/Render";
import { createHoverPreviewStateModel } from "@/pixi/scene/createHoverPreview";
import { createTreeSceneModel } from "@/pixi/scene/createTreeSceneModel";
import { createTreeVisualState } from "@/pixi/scene/createTreeVisualStateModel";
import { PassiveTreeStage } from "@/pixi/stage/PassiveTreeStage";
import { useAllocationStore } from "@/stores/allocation.store";
import { useRuntimeStore } from "@/stores/runtime.store";
import { useUiStore } from "@/stores/ui.store";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const uiStore = useUiStore();
const runtimeStore = useRuntimeStore();
const allocationStore = useAllocationStore();

const hostRef = ref<HTMLDivElement | null>(null);
const stage = new PassiveTreeStage();

const previousHoveredNodeId = ref<NodeId | null>(null);
let previousPreviewNodeIds = new Set<NodeId>();
let previousPreviewEdgeKeys = new Set<EdgeKey>();

const visualState = computed<TreeVisualStateModel | null>(() => {
  if (!runtimeStore.graph) return null;

  return createTreeVisualState({
    snapshot: allocationStore.snapshot,
    // hoveredNodeId: uiStore.hoveredNodeId,
  });
});

onMounted(async () => {
  await runtimeStore.load();
  allocationStore.initialize();
  if (!hostRef.value || !runtimeStore.graph) return;

  await stage.mount(hostRef.value, {
    onNodeClick: (nodeId) => {
      console.log("Click node", nodeId);
      allocationStore.toggleNode(nodeId);
    },
    onNodeHover: (nodeId) => {
      uiStore.setHoveredNodeId(nodeId);
    },
  });

  const staticScene = createTreeSceneModel({ graph: runtimeStore.graph });

  stage.renderStaticScene(staticScene);
  stage.fitToBounds(runtimeStore.graph.bounds);

  // Only update colors/textures when user state changes
  watch(
    visualState,
    (newState) => {
      if (newState) stage.updateVisualStates(newState);
    },
    { immediate: true },
  );

  watch(
    () => uiStore.hoveredNodeId,
    (hoveredNodeId) => {
      if (!visualState.value) return;

      const hoverPreviewState = createHoverPreviewStateModel({
        snapshot: allocationStore.snapshot,
        hoveredNodeId,
      });

      const delta: HoverVisualDelta = {
        hoveredNodeId,
        preview: {
          nodeIds: hoverPreviewState.nodeIds,
          edgeKeys: hoverPreviewState.edgeKeys,
        },
        previous: {
          hoveredNodeId: previousHoveredNodeId.value,
          preview: {
            edgeKeys: previousPreviewEdgeKeys,
            nodeIds: previousPreviewNodeIds,
          },
        },
      };

      stage.updateHoverState({
        delta,
        treeState: visualState.value,
        hoverPreviewState,
      });

      previousHoveredNodeId.value = hoveredNodeId;
      previousPreviewNodeIds = new Set(hoverPreviewState.nodeIds);
      previousPreviewEdgeKeys = new Set(hoverPreviewState.edgeKeys);
    },
  );
});

onBeforeUnmount(() => {
  stage.destroy();
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
