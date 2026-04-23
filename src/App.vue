<script setup lang="ts">
import { onMounted } from "vue";
import ClassSelector from "./components/ClassSelector.vue";
import PassiveTreeCanvas from "./components/PassiveTreeCanvas.vue";
import { useBuildStore } from "./stores/build.store";

const buildStore = useBuildStore();

onMounted(async () => {
  await buildStore.initTree();
});
</script>

<template>
  <div class="app-layout">
    <header>
      <h1>PoE Passive Tree (WIP)</h1>
      <ClassSelector />
    </header>
    <main>
      <PassiveTreeCanvas />
    </main>
  </div>
</template>

<style scoped>
.app-layout,
main {
  height: 100%;
}
</style>
