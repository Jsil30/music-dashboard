<template>
  <span
    class="trend-badge"
    :class="[
      trend >= 0 ? 'trend-badge--up' : 'trend-badge--down',
      compact ? 'trend-badge--compact' : '',
    ]"
  >
    <v-icon :size="compact ? 12 : 14">
      {{ trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
    </v-icon>
    <span v-if="!compact" class="trend-text ml-1">{{ Math.abs(trend).toFixed(1) }}%</span>
    <span v-else class="trend-text">{{ Math.abs(trend).toFixed(1) }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  trend: number
  compact?: boolean
}>()
</script>

<style scoped>
.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.trend-badge--up {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.trend-badge--down {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.trend-badge--compact {
  padding: 1px 4px;
  font-size: 10px;
}

.trend-text {
  line-height: 1;
}
</style>
