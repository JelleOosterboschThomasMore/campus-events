<script setup>
import { dismissToast, toasts } from '../toasts.js';
</script>

<template>
  <!-- aria-live: screen readers read a new toast out loud without moving the focus -->
  <div class="toasts" aria-live="polite">
    <div v-for="toast in toasts" :key="toast.id" class="toast">
      <span>{{ toast.text }}</span>
      <button type="button" class="toast__close" aria-label="Dismiss notification" @click="dismissToast(toast.id)">×</button>
    </div>
  </div>
</template>
