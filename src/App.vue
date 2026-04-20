<script setup lang="ts">
import PassiveTreeCanvas from './components/PassiveTreeCanvas.vue'
import ClassSelector from './components/ClassSelector.vue'
import { useTreeStore } from './stores/treeStore';
import { onMounted } from 'vue';

const treeStore = useTreeStore();

onMounted(async () => {
  await treeStore.loadTree();
})
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
