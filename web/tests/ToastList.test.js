import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import ToastList from '../src/components/ToastList.vue';
import { showToast, toasts } from '../src/toasts.js';

describe('ToastList', () => {
  afterEach(() => toasts.splice(0));

  it('shows the current toasts and removes one when its close button is clicked', async () => {
    showToast('New event: Backend Bootcamp');
    showToast('Someone just registered for Backend Bootcamp');
    const wrapper = mount(ToastList);

    expect(wrapper.findAll('.toast')).toHaveLength(2);
    expect(wrapper.text()).toContain('New event: Backend Bootcamp');

    await wrapper.find('.toast__close').trigger('click');

    expect(wrapper.findAll('.toast')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('New event: Backend Bootcamp');
  });
});
