<script setup lang="ts">
import { useAvailableClassAscendancyIds } from "@/composables/useAvailableClassAscendancyIds";
import { useTreeInteraction } from "@/composables/useTreeInteraction";
import type { AscendancyId } from "@/domain/passiveGraph/PassiveAscendancy";
import type { ClassId } from "@/domain/passiveGraph/PassiveClass";

import { useBuildStore } from "@/stores/build.store";
import { useRuntimeStore } from "@/stores/runtime.store";
import { storeToRefs } from "pinia";
import { computed } from "vue";

const buildStore = useBuildStore();
const treeInteraction = useTreeInteraction();
const runtimeStore = useRuntimeStore();

const { availableClassAscendancyIds } = useAvailableClassAscendancyIds();

const { graph } = storeToRefs(runtimeStore);

const selectedClassId = computed({
  get: () => buildStore.build.activeClassId,
  set: (value: ClassId) => treeInteraction.setClass(value),
});

const selectedAscendancyId = computed({
  get: () => buildStore.build.activeAscendancy,
  set: (value: AscendancyId) => treeInteraction.setAscendancy(value),
});
</script>
<template>
  <div>
    <select v-model="selectedClassId">
      <option disabled :value="null">Choose a class</option>
      <option v-for="[classId, pClass] of graph?.classesById" :key="classId" :value="classId">
        {{ pClass.name }}
      </option>
    </select>
    <select v-model="selectedAscendancyId">
      <option disabled :value="null">Choose an ascendancy</option>
      <option
        v-for="ascendancyId of availableClassAscendancyIds"
        :value="ascendancyId"
        :key="ascendancyId"
      >
        {{ ascendancyId }}
      </option>
    </select>
  </div>
</template>
