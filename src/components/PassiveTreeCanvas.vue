<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useTreeStore } from "@/stores/treeStore";
import { PassiveTreeStage } from "@/pixi/PassiveTreeStage";
import { createTreeSceneRenderModel } from "@/pixi/sceneModel.mapper";

const hostRef = ref<HTMLDivElement | null>(null);
const stage = new PassiveTreeStage();

const treeStore = useTreeStore();

onMounted(async () => {
  if (!hostRef.value) return;

  await stage.mount(hostRef.value, {
    onNodeClick: (nodeId) => {
      console.log("Click node", nodeId);
      treeStore.toggleNodeAllocation(nodeId);
    },
    onNodeHover: (nodeId) => {
      console.log("Hover node", nodeId);
      // uiStore.setHoveredNode(nodeId) idk
    },
  });

  await treeStore.loadTree();

  stage.render(
    createTreeSceneRenderModel({
      allocatedNodeIds: treeStore.allocatedNodeIds,
      selectedClassId: treeStore.selectedClassId,
      tree: treeStore.tree!,
      highlightedPathNodeIds: [],
      hoveredNodeId: null,
    }),
  );
  stage.fitToBounds(treeStore.tree!.bounds);
});

onBeforeUnmount(() => {
  stage.destroy();
});
</script>
<template>
  <div ref="hostRef"></div>
</template>
