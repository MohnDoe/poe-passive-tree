import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { makeLineGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { describe, expect, it } from "vitest";
import { createBuildCommandContext } from "../createBuildCommandContext.ts";

describe("createBuildCommandContext", () => {
  it("returns context with graph and build properties", () => {
    const { graph } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1 });

    const ctx = createBuildCommandContext(graph, build);

    expect(ctx).toHaveProperty("graph");
    expect(ctx).toHaveProperty("build");
    expect(ctx.graph).toBe(graph);
    expect(ctx.build).toBe(build);
  });
});
