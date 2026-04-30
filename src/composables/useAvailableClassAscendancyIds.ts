import type { AscendancyId } from "@/domain/passiveGraph/PassiveAscendancy";
import { useBuildStore } from "@/stores/build.store";
import { useRuntimeStore } from "@/stores/runtime.store";
import { storeToRefs } from "pinia";
import { computed } from "vue";

export function useAvailableClassAscendancyIds() {
  const buildStore = useBuildStore();
  const runtimeStore = useRuntimeStore();

  const { build } = storeToRefs(buildStore);
  const { graph } = storeToRefs(runtimeStore);

  const availableClassAscendancyIds = computed((): ReadonlySet<AscendancyId> => {
    if (!graph.value || build.value.activeClassId === null) return new Set();

    return graph.value.ascendancyIdsByClassId.get(build.value.activeClassId!) ?? new Set();
  });

  return {
    availableClassAscendancyIds,
  };
}
