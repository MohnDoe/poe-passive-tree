<script setup lang="ts">
import { useTreeStore } from "@/stores/treeStore";
import { storeToRefs } from "pinia";

const treeStore = useTreeStore();
const { selectedClassId } = storeToRefs(treeStore);
</script>
<template>
  <div>
    <button
      v-for="[classId, pClass] of treeStore.tree?.classes"
      :key="classId"
      @click="treeStore.selectClass(classId)"
    >
      {{ pClass.id }} -
      {{ pClass.name }}
      <span v-if="selectedClassId === classId">[active]</span>
    </button>
  </div>
</template>
