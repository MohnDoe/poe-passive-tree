import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { BuildState } from "../models/BuildState";

export interface PointBudgets {
  spent: {
    passive: number;
    ascendancy: number;
  };
  remaining: {
    passive: number;
    ascendancy: number;
  };
}

export function getPointBudgets(graph: PassiveGraph, build: BuildState): PointBudgets {
  const budget: PointBudgets = {
    spent: {
      passive: 0,
      ascendancy: 0,
    },
    remaining: {
      passive: 0,
      ascendancy: 0,
    },
  };

  for (const nodeId of build.allocatedNodeIds) {
    const region = graph.regionByNodeId.get(nodeId);
    if (region === "ascendancy") {
      budget.spent.ascendancy++;
    } else {
      budget.spent.passive++;
    }
  }

  budget.remaining = {
    passive: Math.max(0, build.passivePointsBudget - budget.spent.passive),
    ascendancy: Math.max(0, build.ascendancyPointsBudget - budget.spent.ascendancy),
  };

  return budget;
}
