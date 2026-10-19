import { createRouter, createWebHistory } from 'vue-router';
import EventDetailView from './views/EventDetailView.vue';
import EventsView from './views/EventsView.vue';
import NewEventView from './views/NewEventView.vue';
import StatsView from './views/StatsView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'events', component: EventsView },
    { path: '/events/new', name: 'new-event', component: NewEventView },
    { path: '/events/:id', name: 'event', component: EventDetailView, props: true },
    { path: '/stats', name: 'stats', component: StatsView }
  ]
});
