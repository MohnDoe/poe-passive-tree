<script setup lang="ts">
import { onMounted } from "vue";
import ClassSelector from "./presentation/components/ClassSelector.vue";
import PassiveTreeCanvas from "./presentation/components/PassiveTreeCanvas.vue";
import StatsPanel from "./presentation/components/StatsPanel.vue";
import { usePassiveTreeRuntime } from "./presentation/composables/usePassiveTreeRuntime";

const { status, error, ensureLoaded } = usePassiveTreeRuntime();

onMounted(() => {
  void ensureLoaded();
});
</script>

<template>
  <div class="app-layout">
    <main>
      <p v-if="status === 'loading'">Loading ...</p>
      <p v-else-if="status === 'error'">{{ error }}</p>
      <div v-else-if="status === 'ready'">
        <div class="header">
          <div class="allocation">
            <ClassSelector />
            <StatsPanel />
          </div>
        </div>
        <p class="info">
          <b class="warning">A work in progress.</b>
          <br />
          Recreating Path of Exile's passive tree using <em>TypeScript</em> and <em>Pixi.js</em>.
          <br />
          <span class="progress">
            Core allocation & refund logic ✅<br />
            Unit tests ⏳️<br />
            Visual rendering ⏳️
          </span>
          <br />
          <a href="https://github.com/MohnDoe/poe-passive-tree" target="blank">Source code</a>
        </p>
        <PassiveTreeCanvas />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout,
main {
  height: 100sh;
  width: 100vw;
}

.header {
  position: absolute;
  top: 16px;
  left: 16px;
}

.allocation {
  display: flex;
  gap: 16px;
}

.info {
  opacity: 0.9;
  text-align: right;
  position: absolute;
  top: 16px;
  right: 16px;
  color: white;
  font-family: "Fontin";
  max-width: 300px;
  font-size: 14px;
}

.info a {
  color: white;
  font-weight: bold;
}

.progress {
  margin: 8px 0;
  display: inline-block;
  font-size: 12px;
  border: 1px solid #ffffffa0;
  padding: 8px;
}
</style>
