<script setup lang="ts">
import { getStartNodeIds } from "@/domain/logic/classes";
import type { NodeId } from "@/domain/models/passiveNode";
import { treeService } from "@/domain/TreeService";
import { PassiveTreeStage } from "@/pixi/PassiveTreeStage";
import { createTreeSceneRenderModel } from "@/pixi/sceneModel.mapper";
import type { TreeVisualStateModel } from "@/pixi/types/render.models";
import { useBuildStore } from "@/stores/build.store";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const hostRef = ref<HTMLDivElement | null>(null);
const stage = new PassiveTreeStage();
const buildStore = useBuildStore();

const { activeClassId, activeAscendancy, hoveredNodeId, allocatedNodeIds } =
  storeToRefs(buildStore);

const visualState = computed<TreeVisualStateModel>(() => {
  const tree = treeService.tree.value;
  let startNodesId = new Set<NodeId>();
  if (tree && activeClassId.value !== null) {
    startNodesId = getStartNodeIds(tree, activeClassId.value);
  }

  return {
    allocatedNodeIds: new Set(allocatedNodeIds.value),
    hoveredNodeId: hoveredNodeId.value,
    highlightedPathNodeIds: [],
    activeClassId: activeClassId.value,
    activeAscendancy: activeAscendancy.value,
    activeStartNodeIds: startNodesId,
  };
});

onMounted(async () => {
  if (!hostRef.value) return;

  await stage.mount(hostRef.value, {
    onNodeClick: (nodeId) => {
      console.log("Click node", nodeId);
      buildStore.toggleNodeAllocation(nodeId);
    },
    onNodeHover: (nodeId) => {
      buildStore.setHoveredNode(nodeId);
    },
  });

  // ONE-TIME BUILD: Static geometry
  const stopWatchingTree = watch(
    () => treeService.tree.value,
    (tree) => {
      if (tree) {
        const staticScene = createTreeSceneRenderModel({ tree: tree });

        stage.renderStaticScene(staticScene);
        stage.fitToBounds(tree.bounds);

        // stage.updateVisualStates(visualState.value);

        stopWatchingTree();
      }
    },
    { immediate: true },
  );

  // Only update colors/textures when user state changes
  watch(
    visualState,
    (newState) => {
      if (treeService.tree.value) {
        stage.updateVisualStates(newState);
      }
    },
    { immediate: true },
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
