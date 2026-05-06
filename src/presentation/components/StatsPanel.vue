<script setup lang="ts">
import { usePointBudgetSummary } from "../composables/usePointBudgetSummary";

const { pointSummary } = usePointBudgetSummary();
</script>

<template>
  <span v-if="pointSummary">
    {{ pointSummary.remaining.passive }}/{{ pointSummary.budget.passive }} -
    {{ pointSummary.remaining.ascendancy }}/{{ pointSummary.budget.ascendancy }}
  </span>
</template>
<style scoped>
span {
  color: white;
}
</style>
