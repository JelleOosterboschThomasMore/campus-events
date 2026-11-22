import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { buildConfirmationMail } from '../../src/mail/confirmation.mjs';
import { createMailDispatcher } from '../../src/mail/dispatcher.mjs';

// Unit tests with a fake outbox and a fake mail provider: no database, no network.
const logger = { info() {}, warn() {}, error() {} };
const options = { autoDispatch: false, retryIntervalMs: 1000, baseDelayMs: 1000, maxAttempts: 3, sendTimeoutMs: 50, batchSize: 10 };

function fakeOutbox(rows) {
  return {
    rows,
    async findDue(now, limit) {
      return rows.filter((job) => job.status === 'pending' && job.nextAttemptAt <= now).slice(0, limit).map((job) => ({ ...job }));
    },
    async update(id, fields) {
      Object.assign(rows.find((job) => job.id === id), fields);
    }
  };
}

const newJob = (overrides = {}) => ({
  id: 1, to: 'ada@example.com', subject: 'Hi', body: 'Hello', status: 'pending', attempts: 0, nextAttemptAt: new Date(0), ...overrides
});

const workingProvider = () => ({ sent: [], async send(mail) { this.sent.push(mail); } });
const brokenProvider = () => ({ async send() { throw new Error('connect ECONNREFUSED'); } });
const hangingProvider = () => ({ send: () => new Promise(() => {}) });

describe('mail dispatcher', () => {
  let outbox;

  beforeEach(() => {
    outbox = fakeOutbox([newJob()]);
  });

  const dispatcherWith = (transport) => createMailDispatcher({ jobs: outbox, transport, logger, options });

  it('sends a due job and marks it as sent', async () => {
    const provider = workingProvider();

    const summary = await dispatcherWith(provider).processDueJobs();

    assert.deepEqual(summary, { sent: 1, retry: 0, failed: 0 });
    assert.deepEqual(provider.sent, [{ to: 'ada@example.com', subject: 'Hi', text: 'Hello' }]);
    assert.equal(outbox.rows[0].status, 'sent');
    assert.equal(outbox.rows[0].attempts, 1);
  });

  it('keeps the job and schedules a retry when the provider is down', async () => {
    const now = new Date('2026-01-01T10:00:00Z');

    const summary = await dispatcherWith(brokenProvider()).processDueJobs(now);

    assert.deepEqual(summary, { sent: 0, retry: 1, failed: 0 });
    assert.equal(outbox.rows[0].status, 'pending');
    assert.equal(outbox.rows[0].attempts, 1);
    assert.match(outbox.rows[0].lastError, /ECONNREFUSED/);
    assert.equal(outbox.rows[0].nextAttemptAt.getTime(), now.getTime() + 1000);
  });

  it('does not try again before the retry time, and succeeds once the provider is back', async () => {
    const now = new Date('2026-01-01T10:00:00Z');
    const dispatcher = dispatcherWith(brokenProvider());
    await dispatcher.processDueJobs(now);

    const tooEarly = await dispatcher.processDueJobs(new Date(now.getTime() + 500));
    const provider = workingProvider();
    dispatcher.setTransport(provider);
    const later = await dispatcher.processDueJobs(new Date(now.getTime() + 1500));

    assert.deepEqual(tooEarly, { sent: 0, retry: 0, failed: 0 });
    assert.deepEqual(later, { sent: 1, retry: 0, failed: 0 });
    assert.equal(provider.sent.length, 1);
    assert.equal(outbox.rows[0].status, 'sent');
  });

  it('gives up after maxAttempts', async () => {
    outbox.rows[0].attempts = options.maxAttempts - 1;

    const summary = await dispatcherWith(brokenProvider()).processDueJobs();

    assert.deepEqual(summary, { sent: 0, retry: 0, failed: 1 });
    assert.equal(outbox.rows[0].status, 'failed');
  });

  it('treats a provider that never answers as a failure', async () => {
    const summary = await dispatcherWith(hangingProvider()).processDueJobs();

    assert.deepEqual(summary, { sent: 0, retry: 1, failed: 0 });
    assert.match(outbox.rows[0].lastError, /did not answer within 50 ms/);
  });

  it('runs one batch at a time, so a job is never sent twice', async () => {
    const provider = workingProvider();
    const dispatcher = dispatcherWith(provider);

    await Promise.all([dispatcher.processDueJobs(), dispatcher.processDueJobs()]);

    assert.equal(provider.sent.length, 1);
  });
});

describe('confirmation mail', () => {
  it('addresses the participant and names the event', () => {
    const mail = buildConfirmationMail(
      { title: 'Backend Bootcamp', location: 'Room C101', startsAt: '2026-12-01T13:00:00Z' },
      { name: 'Ada', email: 'ada@example.com' }
    );

    assert.equal(mail.to, 'ada@example.com');
    assert.equal(mail.subject, 'You are registered for Backend Bootcamp');
    assert.match(mail.body, /Hi Ada,/);
    assert.match(mail.body, /Room C101/);
    assert.match(mail.body, /14:00/); // 13:00 UTC is 14:00 in Brussels (winter time)
  });
});
