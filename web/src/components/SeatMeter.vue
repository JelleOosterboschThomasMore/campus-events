<script setup>
import { computed } from 'vue';

const props = defineProps({
  capacity: { type: Number, required: true },
  registered: { type: Number, required: true }
});

const spotsLeft = computed(() => Math.max(props.capacity - props.registered, 0));
const percentage = computed(() => Math.min(Math.round((props.registered / props.capacity) * 100), 100));
const isFull = computed(() => spotsLeft.value === 0);
</script>

<template>
  <div class="seat-meter" :class="{ 'seat-meter--full': isFull }">
    <p class="seat-meter__count">
      <strong>{{ spotsLeft }}</strong>
      <span>{{ isFull ? 'This event is full' : `of ${capacity} seats left` }}</span>
    </p>
    <div
      class="seat-meter__bar" role="meter" :aria-valuenow="registered" aria-valuemin="0" :aria-valuemax="capacity"
      :aria-label="`${registered} of ${capacity} seats taken`"
    >
      <span :style="{ width: `${percentage}%` }"></span>
    </div>
  </div>
</template>
