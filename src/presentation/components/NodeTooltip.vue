<script setup lang="ts">
import { computed } from "vue";
import type { PassiveNodeKind } from "@/domain/graph/PassiveNode";

export interface NodeTooltipProps {
  hoverInfo: {
    name: string;
    kind: PassiveNodeKind;
    stats: string[];
    budget: {
      cost: number | null;
      refundCount: number | null;
    };
  } | null;
  position: { x: number; y: number };
}

const props = defineProps<NodeTooltipProps>();

const hasBudgetLine = computed(
  () =>
    props.hoverInfo !== null &&
    (props.hoverInfo.budget.cost ?? props.hoverInfo.budget.refundCount) !== null,
);

const budgetLineText = computed(() => {
  if (props.hoverInfo === null) return "";
  const { cost, refundCount } = props.hoverInfo.budget;
  if (cost !== null) return `+${cost} nodes`;
  if (refundCount !== null) return `-${refundCount} nodes`;
  return "";
});

const tooltipStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}));
</script>

<template>
  <template v-if="hoverInfo">
    <div class="node-tooltip" :style="tooltipStyle">
      <div class="tooltip-header">
        <span class="node-name">{{ hoverInfo.name }}</span>
      </div>
      <div v-if="hoverInfo.stats.length" class="tooltip-stats">
        <div v-for="(stat, i) in hoverInfo.stats" :key="i" class="stat-line">
          {{ stat }}
        </div>
      </div>
      <div v-if="hasBudgetLine" class="tooltip-budget">
        {{ budgetLineText }}
      </div>
    </div>
  </template>
</template>

<style scoped>
.node-tooltip {
  position: absolute;
  pointer-events: none;
  background: #1a1a2e;
  color: #e0e0e0;
  padding: 6px 10px;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 1.4;
  border-radius: 4px;
}

.node-name {
  font-weight: bold;
}
</style>
