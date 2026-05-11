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
import type { StageReadyState } from "../pixi/models/Render";

const uiStore = useUiStore();
const runtimeStore = useRuntimeStore();
const treeInteraction = useTreeInteraction();

const { graph, assets } = storeToRefs(runtimeStore);
const { treeVisualState } = usePassiveTreeVisualState();
const { hoverPreviewState } = storeToRefs(useAllocationStore());

const hostRef = ref<HTMLDivElement | null>(null);
const stage = shallowRef<PassiveTreeStage | null>(null);
const readyState = ref<StageReadyState>("mounting");

const debugActive = ref<boolean>(false);

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
};

onMounted(async () => {
  if (!hostRef.value || !graph.value || !assets.value) return;

  const nextStage = new PassiveTreeStage();

  stage.value = nextStage;

  await nextStage.mount(hostRef.value, assets.value, {
    onNodeClick: (nodeId) => {
      console.log("Click node", nodeId);
      treeInteraction.toggleNode(nodeId);
    },
    onNodeHover: (nodeId) => {
      uiStore.setHoveredNodeId(nodeId);
    },
    onReadyStateChange(state) {
      readyState.value = state;
    },
  });

  nextStage.renderStaticScene(createTreeSceneModel({ graph: graph.value }));

  nextStage.fitToBounds(graph.value.bounds);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "F2") {
      if (debugActive.value) {
        nextStage.disableDebug();
      } else {
        nextStage.enableDebug();
      }
      debugActive.value = !debugActive.value;
    }
  };
  window.addEventListener("keydown", onKeyDown);
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
  <Transition name="fade">
    <div v-if="readyState !== 'ready'" class="loading-overlay">
      <span v-if="readyState === 'mounting'">Initializing…</span>
      <span v-else-if="readyState === 'skeleton'">Loading sprites…</span>
    </div>
  </Transition>
  <div ref="hostRef" class="the-tree"></div>
</template>
<style scoped>
.loading-overlay {
  background: black;
  color: white;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100vh;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.the-tree {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
<style>
#stats {
  position: absolute;
  z-index: 1000;
  bottom: 0;
}
</style>
