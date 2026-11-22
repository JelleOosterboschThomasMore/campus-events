// Sends the mails waiting in the outbox (MailJob rows).
//
// Why this exists: registering must never depend on the mail provider. The registration and its
// mail job are saved together; sending happens afterwards, outside the request. If the provider is
// slow, down or throws, the job stays in the outbox and is retried with a growing delay, until
// maxAttempts is reached. Delivery is "at least once": if the process dies between sending and
// marking the job as sent, that one mail can go out twice. That is the usual trade-off.
//
// Dependencies are passed in (jobs repository, transport, logger) so the unit tests need no database.

const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Mail provider did not answer within ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function createMailDispatcher({ jobs, transport, logger, options }) {
  let currentTransport = transport;
  let intervalId = null;
  let inFlight = null;
  let rerunRequested = false;

  const logFailure = (err) => logger.error('mail dispatch failed', { error: err.message });
  const retryDelayMs = (attempts) => Math.min(options.baseDelayMs * 2 ** (attempts - 1), MAX_RETRY_DELAY_MS);

  async function deliver(job, now) {
    const attempts = job.attempts + 1;
    try {
      await withTimeout(
        currentTransport.send({ to: job.to, subject: job.subject, text: job.body }),
        options.sendTimeoutMs
      );
      await jobs.update(job.id, { status: 'sent', sentAt: now, attempts, lastError: null });
      return 'sent';
    } catch (err) {
      const giveUp = attempts >= options.maxAttempts;
      await jobs.update(job.id, {
        status: giveUp ? 'failed' : 'pending',
        attempts,
        lastError: String(err.message).slice(0, 500),
        nextAttemptAt: new Date(now.getTime() + retryDelayMs(attempts))
      });
      logger.warn('confirmation mail not sent', { jobId: job.id, attempts, giveUp, error: err.message });
      return giveUp ? 'failed' : 'retry';
    }
  }

  async function runBatch(now) {
    const summary = { sent: 0, retry: 0, failed: 0 };
    const due = await jobs.findDue(now, options.batchSize);
    for (const job of due) {
      summary[await deliver(job, now)] += 1;
    }
    return summary;
  }

  // Only one batch runs at a time. A call during a batch asks for one more run afterwards,
  // so a job saved while the batch was running is not forgotten until the next interval.
  function processDueJobs(now = new Date()) {
    if (inFlight) {
      rerunRequested = true;
      return inFlight;
    }
    inFlight = runBatch(now).finally(() => {
      inFlight = null;
      if (rerunRequested) {
        rerunRequested = false;
        processDueJobs().catch(logFailure);
      }
    });
    return inFlight;
  }

  return {
    processDueJobs,

    // Called after a registration is saved. Never throws and never makes the request wait.
    kick() {
      if (!options.autoDispatch) return;
      setImmediate(() => processDueJobs().catch(logFailure));
    },

    // Also picks up jobs left over from before a restart.
    start() {
      processDueJobs().catch(logFailure);
      intervalId = setInterval(() => processDueJobs().catch(logFailure), options.retryIntervalMs);
      intervalId.unref();
    },

    async stop() {
      clearInterval(intervalId);
      await inFlight?.catch(() => {});
    },

    setTransport(next) {
      currentTransport = next;
    }
  };
}
