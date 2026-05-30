import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { computeDependencies } from "./algorithms/dependencies";
import { computeWeightedPaths, materializePath } from "./algorithms/pathfinding";
import { getPointBudgetSummary } from "./selectors/getPointBudgetSummary";

import type { BuildState } from "./models/BuildState";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";

interface AllocationNodeState {
  id: NodeId;

  // There is a valid path to it from a root
  reachable: boolean;

  // The node is *reachable* AND path cost fits point budget and/or rule set
  allocatable: boolean;

  allocated: boolean;

  // Cheapest path to any root
  cheapestPath: NodeId[] | null;
  cheapestPathCost: number | null;

  dependsOn: Set<NodeId>;
  requiredBy: ReadonlySet<NodeId>;
}

export interface AllocationState {
  activeClassId: ClassId | null;

  startNodeIds: ReadonlySet<NodeId>;

  allocatedNodeIds: ReadonlySet<NodeId>;
  allocatableNodeIds: ReadonlySet<NodeId>;

  activeEdgeKeys: ReadonlySet<EdgeKey>;

  nodeStateById: Map<NodeId, AllocationNodeState>;
}

export class AllocationStateEngine {
  nodeStateById: Map<NodeId, AllocationNodeState>;
  allocatableNodeIds: ReadonlySet<NodeId>;
  allocatedNodeIds: ReadonlySet<NodeId>;
  startNodeIds: ReadonlySet<NodeId>;
  activeClassId: ClassId | null;
  activeEdgeKeys: ReadonlySet<EdgeKey>;

  private constructor(
    nodeStateById: Map<NodeId, AllocationNodeState>,
    allocatableNodeIds: Set<NodeId>,
    allocatedNodeIds: ReadonlySet<NodeId>,
    startNodeIds: ReadonlySet<NodeId>,
    activeClassId: ClassId | null,
    activeEdgeKeys: ReadonlySet<EdgeKey>,
  ) {
    this.nodeStateById = nodeStateById;
    this.allocatableNodeIds = allocatableNodeIds;
    this.allocatedNodeIds = allocatedNodeIds;
    this.startNodeIds = startNodeIds;
    this.activeClassId = activeClassId;
    this.activeEdgeKeys = activeEdgeKeys;
  }

  static compute(graph: PassiveGraph, buildState: BuildState): AllocationState {
    return AllocationStateEngine.#builder.build(graph, buildState);
  }

  static readonly #builder = class {
    private static nodeStateById = new Map<NodeId, AllocationNodeState>();

    static build(graph: PassiveGraph, buildState: BuildState): AllocationState {
      this.nodeStateById = new Map<NodeId, AllocationNodeState>();

      this.createDefaultNodeState(graph, buildState);
      this.applyWeightedPaths(graph, buildState);
      this.applyAllocationFlags(graph, buildState);
      this.mergeDependencies(graph, buildState);

      const allocatedNodeIds = new Set(buildState.allocatedNodeIds);
      const buildStartNodeIds = graph.getBuildStartNodeIds(
        buildState.activeClassId,
        buildState.activeAscendancy,
      );
      const allocatableNodeIds = new Set<NodeId>(
        [...this.nodeStateById]
          .filter(([_, nodeState]) => nodeState.allocatable)
          .map(([nodeId]) => nodeId),
      );
      const activeEdgeKeys = graph.computeEdgeKeysFromNodeIds(allocatedNodeIds);

      return new AllocationStateEngine(
        this.nodeStateById,
        allocatableNodeIds,
        allocatedNodeIds,
        buildStartNodeIds,
        buildState.activeClassId,
        activeEdgeKeys,
      );
    }

    private static createDefaultNodeState(graph: PassiveGraph, buildState: BuildState): void {
      const allocatedNodeIds = new Set(buildState.allocatedNodeIds);

      for (const [nodeId] of graph.nodesById) {
        this.nodeStateById.set(nodeId, {
          id: nodeId,
          allocatable: false,
          reachable: false,
          allocated: allocatedNodeIds.has(nodeId),
          cheapestPath: null,
          cheapestPathCost: null,
          dependsOn: new Set<NodeId>(),
          requiredBy: new Set<NodeId>(),
        });
      }
    }

    private static applyWeightedPaths(graph: PassiveGraph, buildState: BuildState): void {
      const allocatedNodeIds = new Set(buildState.allocatedNodeIds);
      const buildStartNodeIds = graph.getBuildStartNodeIds(
        buildState.activeClassId,
        buildState.activeAscendancy,
      );

      const weightedPaths = computeWeightedPaths({
        graph,
        startNodeIds: buildStartNodeIds,
        allocatedNodeIds,
      });

      for (const [nodeId, nodeState] of this.nodeStateById) {
        if (!weightedPaths.distanceByNodeId.has(nodeId)) {
          nodeState.cheapestPathCost = null;
          nodeState.cheapestPath = null;
          nodeState.reachable = false;
          continue;
        }

        const pathCost = weightedPaths.distanceByNodeId.get(nodeId)!;

        nodeState.cheapestPathCost = pathCost;
        nodeState.cheapestPath = materializePath(nodeId, weightedPaths.predecessorByNodeId);

        if (nodeState.cheapestPath.length > 0 && !buildStartNodeIds.has(nodeId)) {
          nodeState.reachable = true;
        }
      }
    }

    private static applyAllocationFlags(graph: PassiveGraph, buildState: BuildState): void {
      const pointBudgetSummary = getPointBudgetSummary(graph, buildState);

      for (const [nodeId, nodeState] of this.nodeStateById) {
        const node = graph.nodesById.get(nodeId);
        if (!node) {
          nodeState.allocatable = false;
          continue;
        }

        const pathCost = nodeState.cheapestPathCost ?? 0;

        const region = graph.regionByNodeId.get(nodeId);

        const buildHasEnoughBudget =
          region === "ascendancy"
            ? pointBudgetSummary.remaining.ascendancy >= pathCost
            : pointBudgetSummary.remaining.passive >= pathCost;

        nodeState.allocatable =
          !nodeState.allocated &&
          nodeState.reachable &&
          buildHasEnoughBudget &&
          node.kind !== "classStart" &&
          node.kind !== "ascendancyStart";
      }
    }

    private static mergeDependencies(graph: PassiveGraph, buildState: BuildState): void {
      const allocatedNodeIds = new Set(buildState.allocatedNodeIds);

      const dependencies = computeDependencies({
        graph,
        startNodeIds: graph.getBuildStartNodeIds(
          buildState.activeClassId,
          buildState.activeAscendancy,
        ),
        allocatedNodeIds,
      });

      for (const [nodeId, nodeState] of this.nodeStateById) {
        nodeState.dependsOn = dependencies.dependsOnByNodeId.get(nodeId) ?? new Set<NodeId>();
        nodeState.requiredBy = dependencies.requiredByNodeId.get(nodeId) ?? new Set<NodeId>();
      }
    }
  };
}
