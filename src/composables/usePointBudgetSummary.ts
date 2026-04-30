import { getPointBudgetSummary } from "@/domain/build/selectors/getPointBudgetSummary";
import { useBuildStore } from "@/stores/build.store";
import { useRuntimeStore } from "@/stores/runtime.store";
import { storeToRefs } from "pinia";
import { computed } from "vue";

export function usePointBudgetSummary() {
  const buildStore = useBuildStore();
  const runtimeStore = useRuntimeStore();

  const { build } = storeToRefs(buildStore);
  const { graph } = storeToRefs(runtimeStore);

  const pointSummary = computed(() => {
    if (!graph.value) return null;
    return getPointBudgetSummary(graph.value, build.value);
  });

  return { pointSummary };
}
