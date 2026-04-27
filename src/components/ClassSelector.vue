<script setup lang="ts">
import { useBuildStore } from "@/stores/build.store";
import { useRuntimeStore } from "@/stores/runtime.store";
import { storeToRefs } from "pinia";

const buildStore = useBuildStore();
const runtimeStore = useRuntimeStore();

const { graph } = storeToRefs(runtimeStore);
const { activeClassId } = storeToRefs(buildStore);
</script>
<template>
  <div>
    <button
      v-for="[classId, pClass] of graph?.classesById"
      :key="classId"
      @click="buildStore.setClass(classId)"
    >
      {{ pClass.id }} -
      {{ pClass.name }}
      <span v-if="activeClassId === classId">[active]</span>
    </button>
  </div>
</template>
