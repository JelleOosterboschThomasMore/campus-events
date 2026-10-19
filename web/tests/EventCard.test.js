import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import EventCard from '../src/components/EventCard.vue';

const mountCard = (event) =>
  mount(EventCard, { props: { event }, global: { stubs: { RouterLink: RouterLinkStub } } });

const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

describe('EventCard', () => {
  it('links to the event detail page', () => {
    const wrapper = mountCard({ id: 7, title: 'Demo Day', location: 'Room B204', startsAt: inDays(3), capacity: 30 });

    expect(wrapper.findComponent(RouterLinkStub).props().to).toBe('/events/7');
    expect(wrapper.text()).toContain('Demo Day');
    expect(wrapper.text()).toContain('30 seats');
  });

  it('marks events in the past', () => {
    const wrapper = mountCard({ id: 1, title: 'Old', location: 'Online', startsAt: inDays(-3), capacity: 10 });

    expect(wrapper.find('.ticket--past').exists()).toBe(true);
    expect(wrapper.text()).toContain('Took place');
  });
});
