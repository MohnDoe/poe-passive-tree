import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { BuildState } from "../models/BuildState";

export interface PointBudgetSummary {
  spent: {
    passive: number;
    ascendancy: number;
  };
  remaining: {
    passive: number;
    ascendancy: number;
  };
  budget: {
    passive: number;
    ascendancy: number;
  };
}

export function getPointBudgetSummary(graph: PassiveGraph, build: BuildState): PointBudgetSummary {
  const summary: PointBudgetSummary = {
    spent: {
      passive: 0,
      ascendancy: 0,
    },
    remaining: {
      passive: 0,
      ascendancy: 0,
    },
    budget: {
      passive: build.passivePointsBudget,
      ascendancy: build.ascendancyPointsBudget,
    },
  };

  for (const nodeId of build.allocatedNodeIds) {
    const region = graph.regionByNodeId.get(nodeId);
    if (region === "ascendancy") {
      summary.spent.ascendancy++;
    } else {
      summary.spent.passive++;
    }
  }

  summary.remaining = {
    passive: Math.max(0, summary.budget.passive - summary.spent.passive),
    ascendancy: Math.max(0, summary.budget.ascendancy - summary.spent.ascendancy),
  };

  return summary;
}
