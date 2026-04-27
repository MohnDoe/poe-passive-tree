<script setup lang="ts">
import type { TreeVisualStateModel } from "@/pixi/models/Render";
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

const visualState = computed<TreeVisualStateModel | null>(() => {
  if (!runtimeStore.graph) return null;

  return createTreeVisualState({
    snapshot: allocationStore.snapshot,
    hoveredNodeId: uiStore.hoveredNodeId,
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
