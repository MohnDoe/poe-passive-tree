import type { BuildCommandResult } from "@/domain/build/commands/types";
import type { AscendancyId } from "@/domain/graph/PassiveAscendancy";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { NodeId } from "@/domain/graph/PassiveNode";

import { useBuildStore } from "@/stores/build.store";
import { useRuntimeStore } from "@/stores/runtime.store";
import { storeToRefs } from "pinia";

export function useTreeInteraction() {
  const buildStore = useBuildStore();
  const runtimeStore = useRuntimeStore();

  return {
    toggleNode(nodeId: NodeId): BuildCommandResult {
      const { graph } = storeToRefs(runtimeStore);
      if (!graph.value) return { ok: false, reason: "NO_ACTIVE_CLASS" };

      return buildStore.toggleNode(graph.value, nodeId);
    },
    setClass(classId: ClassId) {
      return buildStore.setClass(classId);
    },
    setAscendancy(ascendancyId: AscendancyId | null): BuildCommandResult {
      const { graph } = runtimeStore;
      if (!graph) return { ok: false, reason: "NO_ACTIVE_CLASS" };

      return buildStore.setAscendancy(graph, ascendancyId);
    },
  };
}
