<script setup>
defineProps({
  error: { type: Error, default: null }
});
</script>

<template>
  <p v-if="error" class="error-message" role="alert">{{ error.message }}</p>
</template>
