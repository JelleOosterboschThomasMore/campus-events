<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createEvent } from '../api/events.js';
import ErrorMessage from '../components/ErrorMessage.vue';
import { fieldError } from '../utils/errors.js';

const router = useRouter();
const form = reactive({ title: '', description: '', location: '', startsAt: '', capacity: 20 });
const error = ref(null);
const saving = ref(false);

async function submit() {
  saving.value = true;
  error.value = null;
  try {
    const event = await createEvent({
      ...form,
      description: form.description || undefined,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : ''
    });
    router.push(`/events/${event.id}`);
  } catch (err) {
    error.value = err;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <h1 class="page-title">New event</h1>

  <form class="form form--wide" novalidate @submit.prevent="submit">
    <label class="field">
      <span>Title</span>
      <input v-model="form.title" name="title" required />
      <small v-if="fieldError(error, 'title')">{{ fieldError(error, 'title') }}</small>
    </label>
    <label class="field">
      <span>Description <em>(optional)</em></span>
      <textarea v-model="form.description" name="description" rows="3"></textarea>
    </label>
    <label class="field">
      <span>Location</span>
      <input v-model="form.location" name="location" required />
      <small v-if="fieldError(error, 'location')">{{ fieldError(error, 'location') }}</small>
    </label>
    <div class="field-row">
      <label class="field">
        <span>Starts at</span>
        <input v-model="form.startsAt" name="startsAt" type="datetime-local" required />
        <small v-if="fieldError(error, 'startsAt')">{{ fieldError(error, 'startsAt') }}</small>
      </label>
      <label class="field">
        <span>Seats</span>
        <input v-model.number="form.capacity" name="capacity" type="number" min="1" required />
        <small v-if="fieldError(error, 'capacity')">{{ fieldError(error, 'capacity') }}</small>
      </label>
    </div>
    <ErrorMessage v-if="!error?.details?.length" :error="error" />
    <button class="button" type="submit" :disabled="saving">{{ saving ? 'Creating…' : 'Create event' }}</button>
  </form>
</template>
