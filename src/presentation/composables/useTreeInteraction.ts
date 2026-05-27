import { err, type Result } from "neverthrow";
import type { AscendancyId } from "@/domain/graph/PassiveAscendancy";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { NodeId } from "@/domain/graph/PassiveNode";
import type { BuildState } from "@/domain/build/models/BuildState";
import type { BuildFailureReason } from "@/domain/build/Build";
import { storeToRefs } from "pinia";
import { useBuildStore } from "../stores/build.store";
import { useRuntimeStore } from "../stores/runtime.store";

export function useTreeInteraction() {
  const buildStore = useBuildStore();
  const runtimeStore = useRuntimeStore();

  return {
    toggleNode(nodeId: NodeId): Result<BuildState, BuildFailureReason> {
      const { graph } = storeToRefs(runtimeStore);
      if (!graph.value) return err("NO_ACTIVE_CLASS");

      return buildStore.toggleNode(graph.value, nodeId);
    },
    setClass(classId: ClassId): Result<BuildState, BuildFailureReason> {
      return buildStore.setClass(classId);
    },
    setAscendancy(ascendancyId: AscendancyId | null): Result<BuildState, BuildFailureReason> {
      const { graph } = runtimeStore;
      if (!graph) return err("NO_ACTIVE_CLASS");

      return buildStore.setAscendancy(graph, ascendancyId);
    },
  };
}
