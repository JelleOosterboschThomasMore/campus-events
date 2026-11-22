import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { mailDispatcher } from '../../src/mail/index.mjs';
import { createTestApp, validEvent } from '../helpers/testApp.mjs';

// The requirement: when the mail provider breaks, the registration must still be stored.
// MAIL_AUTO_DISPATCH=false in .env.test, so the tests call processDueJobs() themselves.
const workingProvider = () => ({ sent: [], async send(mail) { this.sent.push(mail); } });
const brokenProvider = () => ({ async send() { throw new Error('provider is down'); } });

describe('registration confirmation mail', () => {
  let app;
  let db;
  let eventId;

  const register = (body = { name: 'Ada', email: 'ada@example.com' }) =>
    request(app).post(`/api/events/${eventId}/registrations`).send(body);

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
    const created = await request(app).post('/api/events').send(validEvent({ title: 'Backend Bootcamp' }));
    eventId = created.body.id;
  });

  it('stores a pending mail job together with the registration', async () => {
    const res = await register();

    const jobs = await db.MailJob.findAll();
    assert.equal(res.status, 201);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].to, 'ada@example.com');
    assert.equal(jobs[0].status, 'pending');
    assert.equal(jobs[0].registrationId, res.body.id);
  });

  it('still registers (201) when the mail provider is down, and sends the mail after it recovers', async () => {
    mailDispatcher.setTransport(brokenProvider());

    const res = await register();
    await mailDispatcher.processDueJobs();

    assert.equal(res.status, 201);
    assert.equal(await db.Registration.count(), 1);
    const [failedJob] = await db.MailJob.findAll();
    assert.equal(failedJob.status, 'pending');
    assert.equal(failedJob.attempts, 1);
    assert.match(failedJob.lastError, /provider is down/);

    const provider = workingProvider();
    mailDispatcher.setTransport(provider);
    await mailDispatcher.processDueJobs(new Date(Date.now() + 60 * 60 * 1000));

    const [sentJob] = await db.MailJob.findAll();
    assert.equal(sentJob.status, 'sent');
    assert.equal(provider.sent.length, 1);
    assert.equal(provider.sent[0].to, 'ada@example.com');
    assert.match(provider.sent[0].subject, /Backend Bootcamp/);
  });

  it('creates no mail job when the registration is rejected', async () => {
    await register();

    const duplicate = await register({ name: 'Ada again', email: 'ada@example.com' });

    assert.equal(duplicate.status, 409);
    assert.equal(await db.MailJob.count(), 1);
  });
});
