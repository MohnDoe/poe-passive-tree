import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import { loadPassiveTreeRuntime } from "@/services/passiveTree/runtime/createPassiveTreeRuntime";
import { defineStore } from "pinia";
import { markRaw, shallowRef, type ShallowRef } from "vue";

export interface RuntimeState {
  loading: boolean;
  graph: ShallowRef<PassiveGraph | null>;
}

export const useRuntimeStore = defineStore("runtime", {
  state: (): RuntimeState => ({
    loading: false,
    graph: shallowRef(null),
  }),
  actions: {
    async load() {
      // TODO: handle potential errors
      this.loading = true;
      try {
        this.graph = markRaw(await loadPassiveTreeRuntime());
      } finally {
        this.loading = false;
      }
    },
  },
});
