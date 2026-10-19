import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { register } from '../src/api/events.js';
import { ApiError } from '../src/api/client.js';
import RegistrationForm from '../src/components/RegistrationForm.vue';

// Replace the real API module: no server needed for component tests.
vi.mock('../src/api/events.js', () => ({ register: vi.fn() }));

async function fillAndSubmit(wrapper) {
  await wrapper.find('input[name="name"]').setValue('Ada');
  await wrapper.find('input[name="email"]').setValue('ada@example.com');
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('RegistrationForm', () => {
  beforeEach(() => {
    vi.mocked(register).mockReset();
  });

  it('sends the form and emits "registered"', async () => {
    vi.mocked(register).mockResolvedValue({ id: 1, name: 'Ada' });
    const wrapper = mount(RegistrationForm, { props: { eventId: 3 } });

    await fillAndSubmit(wrapper);

    expect(register).toHaveBeenCalledWith(3, { name: 'Ada', email: 'ada@example.com' });
    expect(wrapper.emitted('registered')).toHaveLength(1);
  });

  it('shows the API error message, e.g. when the event is full', async () => {
    vi.mocked(register).mockRejectedValue(new ApiError(409, { code: 'CONFLICT', message: 'Event is full' }));
    const wrapper = mount(RegistrationForm, { props: { eventId: 3 } });

    await fillAndSubmit(wrapper);

    expect(wrapper.find('[role="alert"]').text()).toBe('Event is full');
    expect(wrapper.emitted('registered')).toBeUndefined();
  });

  it('shows validation messages next to the field', async () => {
    const details = [{ field: 'email', message: 'Invalid email address' }];
    vi.mocked(register).mockRejectedValue(new ApiError(400, { code: 'VALIDATION_ERROR', message: 'x', details }));
    const wrapper = mount(RegistrationForm, { props: { eventId: 3 } });

    await fillAndSubmit(wrapper);

    expect(wrapper.text()).toContain('Invalid email address');
  });
});
