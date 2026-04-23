<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from "vue";
import { useTreeStore } from "@/stores/treeStore";
import { PassiveTreeStage } from "@/pixi/PassiveTreeStage";
import { createTreeSceneRenderModel } from "@/pixi/sceneModel.mapper";
import { storeToRefs } from "pinia";

const hostRef = ref<HTMLDivElement | null>(null);
const hasBeenFittedOnce = ref(false);
const stage = new PassiveTreeStage();

const treeStore = useTreeStore();

const { tree, selectedClassId, allocatedNodeIds } = storeToRefs(treeStore);

const sceneModal = computed(() => {
  if (!tree.value) return null;

  return createTreeSceneRenderModel({
    tree: tree.value,
    allocatedNodeIds: allocatedNodeIds.value,
    selectedClassId: selectedClassId.value,
    highlightedPathNodeIds: [],
    hoveredNodeId: null,
  });
});

onMounted(async () => {
  if (!hostRef.value) return;

  await stage.mount(hostRef.value, {
    onNodeClick: (nodeId) => {
      console.log("Click node", nodeId);
      treeStore.toggleNodeAllocation(nodeId);
    },
    onNodeHover: (nodeId) => {
      if (!nodeId) return;
      console.log("Hover node", nodeId);
      console.log(tree.value?.nodesById.get(nodeId));
      // uiStore.setHoveredNode(nodeId) idk
    },
  });

  await treeStore.loadTree();

  watchEffect(() => {
    const scene = sceneModal.value;
    if (!scene) return;

    if (!hasBeenFittedOnce.value) {
      stage.render(scene);
      stage.fitToBounds(tree.value!.bounds);
      hasBeenFittedOnce.value = true;
    }
  });
});

watchEffect(() => {
  const scene = sceneModal.value;
  if (!scene) return;
  stage.updateNodeStates(scene);
});

onBeforeUnmount(() => {
  stage.destroy();
});
</script>
<template>
  <div ref="hostRef"></div>
</template>
