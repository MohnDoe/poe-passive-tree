import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import { createPassiveTreeRuntime } from "@/services/passiveTree/runtime/createPassiveTreeRuntime";
import { defineStore } from "pinia";

export interface RuntimeState {
  status: "idle" | "loading" | "ready" | "error";
  graph: PassiveGraph | null;
  error: string | null;
}

export const useRuntimeStore = defineStore("runtime", {
  state: (): RuntimeState => ({
    status: "idle",
    graph: null,
    error: null,
  }),
  actions: {
    async load() {
      if (this.status === "loading") return;
      this.status = "loading";
      this.error = null;

      try {
        const { graph } = await createPassiveTreeRuntime();
        this.graph = graph;
        this.status = "ready";
      } catch (error) {
        this.graph = null;
        this.error = error instanceof Error ? error.message : "Unknown runtime loading error.";
        this.status = "error";
      }
    },
  },
});
