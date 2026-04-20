<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createPixiStage, type PixiStageController } from "@/pixi/stage";
import { useTreeStore } from "@/stores/treeStore";
import { renderTree } from "@/pixi/treeRenderer";

const hostRef = ref<HTMLDivElement | null>(null);
let pixiStage: PixiStageController | null = null;

const treeStore = useTreeStore();

onMounted(async () => {
  if (!hostRef.value) return;
  pixiStage = await createPixiStage(hostRef.value);

  await treeStore.loadTree();
  // renderTree


  renderTree(pixiStage, treeStore.tree!);
})


onBeforeUnmount(() => {
  pixiStage?.destroy();
  pixiStage = null;
})
</script>
<template>
  <div ref="hostRef">

  </div>
</template>
