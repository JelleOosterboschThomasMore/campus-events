<script setup>
import { reactive, ref } from 'vue';
import { register } from '../api/events.js';
import { fieldError } from '../utils/errors.js';
import ErrorMessage from './ErrorMessage.vue';

const props = defineProps({
  eventId: { type: [Number, String], required: true }
});
const emit = defineEmits(['registered']);

const form = reactive({ name: '', email: '' });
const error = ref(null);
const saving = ref(false);

async function submit() {
  saving.value = true;
  error.value = null;
  try {
    const registration = await register(props.eventId, { ...form });
    form.name = '';
    form.email = '';
    emit('registered', registration);
  } catch (err) {
    error.value = err;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <label class="field">
      <span>Name</span>
      <input v-model="form.name" name="name" autocomplete="name" required />
      <small v-if="fieldError(error, 'name')">{{ fieldError(error, 'name') }}</small>
    </label>
    <label class="field">
      <span>Email</span>
      <input v-model="form.email" name="email" type="email" autocomplete="email" required />
      <small v-if="fieldError(error, 'email')">{{ fieldError(error, 'email') }}</small>
    </label>
    <ErrorMessage v-if="!error?.details?.length" :error="error" />
    <button class="button" type="submit" :disabled="saving">
      {{ saving ? 'Registering…' : 'Register' }}
    </button>
  </form>
</template>
