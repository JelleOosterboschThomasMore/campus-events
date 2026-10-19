import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SeatMeter from '../src/components/SeatMeter.vue';

describe('SeatMeter', () => {
  it('shows how many seats are left', () => {
    const wrapper = mount(SeatMeter, { props: { capacity: 25, registered: 5 } });

    expect(wrapper.text()).toContain('20');
    expect(wrapper.text()).toContain('of 25 seats left');
  });

  it('shows a full state when no seats are left', () => {
    const wrapper = mount(SeatMeter, { props: { capacity: 2, registered: 2 } });

    expect(wrapper.text()).toContain('This event is full');
    expect(wrapper.classes()).toContain('seat-meter--full');
  });
});
