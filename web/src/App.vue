<script setup>
import { onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { subscribeToNotifications } from './api/notifications.js';
import ToastList from './components/ToastList.vue';
import { showToast, toastText } from './toasts.js';

// One connection for the whole app, opened here and not in a page: a page is mounted again on
// every visit, which would open a second connection and show every toast twice.
let unsubscribe = () => {};

onMounted(() => {
  unsubscribe = subscribeToNotifications((notification) => {
    const text = toastText(notification);
    if (text) showToast(text);
  });
});

onUnmounted(() => unsubscribe());
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand">Campus Events</RouterLink>
    <nav>
      <RouterLink to="/">Events</RouterLink>
      <RouterLink to="/stats">Occupancy</RouterLink>
      <RouterLink to="/events/new" class="button button--small">New event</RouterLink>
    </nav>
  </header>
  <main class="page">
    <RouterView />
  </main>
  <ToastList />
</template>
