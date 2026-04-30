<script setup lang="ts">
import { usePointBudgetSummary } from "@/composables/usePointBudgetSummary";

const { pointSummary } = usePointBudgetSummary();
</script>

<template>
  <section v-if="pointSummary">
    <p>
      {{ pointSummary.remaining.passive }}/{{ pointSummary.budget.passive }} -
      {{ pointSummary.remaining.ascendancy }}/{{ pointSummary.budget.ascendancy }}
    </p>
  </section>
</template>
