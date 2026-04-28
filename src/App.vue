<script setup lang="ts">
import { onMounted } from "vue";
import ClassSelector from "./components/ClassSelector.vue";
import PassiveTreeCanvas from "./components/PassiveTreeCanvas.vue";
import { usePassiveTreeRuntime } from "./composables/usePassiveTreeRuntime";

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
