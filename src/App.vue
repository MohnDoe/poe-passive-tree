<script setup lang="ts">
import { onMounted } from "vue";
import ClassSelector from "./presentation/components/ClassSelector.vue";
import PassiveTreeCanvas from "./presentation/components/PassiveTreeCanvas.vue";
import { usePassiveTreeRuntime } from "./presentation/composables/usePassiveTreeRuntime";
import StatsPanel from "./presentation/components/StatsPanel.vue";

const { status, error, ensureLoaded } = usePassiveTreeRuntime();

onMounted(() => {
  void ensureLoaded();
});
</script>

<template>
  <div class="app-layout">
    <header>
      <h1>PoE Passive Tree (WIP)</h1>
      <ClassSelector />
      <StatsPanel />
    </header>
    <main>
      <p v-if="status === 'loading'">Loading ...</p>
      <p v-else-if="status === 'error'">{{ error }}</p>
      <PassiveTreeCanvas v-else-if="status === 'ready'" />
    </main>
  </div>
</template>

<style scoped>
.app-layout,
main {
  height: 100%;
}
</style>
