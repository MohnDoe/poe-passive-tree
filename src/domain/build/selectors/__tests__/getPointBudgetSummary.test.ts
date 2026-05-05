import { makeRegionGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures";
import { describe, expect, it } from "vitest";
import { makeBuild } from "@/domain/build/__tests__/BuildState.fixtures";
import { getPointBudgetSummary } from "../getPointBudgetSummary";

describe("getPointBugetSummary", () => {
  const { graph, nodes } = makeRegionGraph();

  it("should correctly count passive point budget", () => {
    const passivePointsBudget = 2;
    const ascendancyPointsBudget = 2;
    const build = makeBuild({
      allocatedNodeIds: new Set([nodes.main.normal.id]),
      passivePointsBudget,
      ascendancyPointsBudget,
    });

    const pointBudgetSummary = getPointBudgetSummary(graph, build);

    expect(pointBudgetSummary.budget.passive).toBe(passivePointsBudget);
    expect(pointBudgetSummary.spent.passive).toBe(1);
    expect(pointBudgetSummary.remaining.passive).toBe(1);

    expect(pointBudgetSummary.spent.ascendancy).toBe(0);
    expect(pointBudgetSummary.remaining.ascendancy).toBe(ascendancyPointsBudget);
  });

  it("should correctly count ascendancy point budget", () => {
    const passivePointsBudget = 2;
    const ascendancyPointsBudget = 2;
    const build = makeBuild({
      allocatedNodeIds: new Set([nodes.ascendancyA.normal.id, nodes.ascendancyB.normal.id]),
      passivePointsBudget,
      ascendancyPointsBudget,
    });

    const pointBudgetSummary = getPointBudgetSummary(graph, build);

    expect(pointBudgetSummary.budget.ascendancy).toBe(passivePointsBudget);
    expect(pointBudgetSummary.spent.ascendancy).toBe(2);
    expect(pointBudgetSummary.remaining.ascendancy).toBe(0);
  });

  it("clamps budget to 0 when it gets lower", () => {
    const passivePointsBudget = 0;
    const ascendancyPointsBudget = 0;
    const build = makeBuild({
      allocatedNodeIds: new Set([nodes.ascendancyA.normal.id, nodes.main.normal.id]),
      passivePointsBudget,
      ascendancyPointsBudget,
    });

    const pointBudgetSummary = getPointBudgetSummary(graph, build);

    expect(pointBudgetSummary.spent.ascendancy).toBe(1);
    expect(pointBudgetSummary.spent.passive).toBe(1);

    expect(pointBudgetSummary.remaining.ascendancy).toBe(0);
    expect(pointBudgetSummary.remaining.passive).toBe(0);
  });

  it("does not count nodes more than once", () => {
    const passivePointsBudget = 4;
    const ascendancyPointsBudget = 2;
    const build = makeBuild({
      allocatedNodeIds: new Set([nodes.main.normal.id, nodes.main.normal.id]),
      passivePointsBudget,
      ascendancyPointsBudget,
    });

    const pointBudgetSummary = getPointBudgetSummary(graph, build);

    expect(pointBudgetSummary.spent.passive).toBe(1);
    expect(pointBudgetSummary.remaining.passive).toBe(3);
  });
});
