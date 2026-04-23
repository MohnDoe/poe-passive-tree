<script setup lang="ts">
import { treeService } from "@/domain/TreeService";
import { useBuildStore } from "@/stores/build.store";
import { storeToRefs } from "pinia";

const buildStore = useBuildStore();
const { activeClassId } = storeToRefs(buildStore);
</script>
<template>
  <div>
    <button
      v-for="[classId, pClass] of treeService.tree.value?.classes"
      :key="classId"
      @click="buildStore.selectClass(classId)"
    >
      {{ pClass.id }} -
      {{ pClass.name }}
      <span v-if="activeClassId === classId">[active]</span>
    </button>
  </div>
</template>
