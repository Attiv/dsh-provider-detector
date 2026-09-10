import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  collectStream,
  probeModel,
  selectModels,
} = require('../lib/detection.js');

test('selectModels returns every advertised model by default and filters ids', () => {
  const models = [
    { id: 'fast', name: 'Fast' },
    { id: 'accurate', name: 'Accurate' },
  ];

  assert.deepEqual(selectModels(models), models);
  assert.deepEqual(selectModels(models, ['accurate']), [models[1]]);
  assert.deepEqual(selectModels(models, []), []);
});

test('collectStream aggregates text deltas, usage, and finish reason', async () => {
  async function* stream() {
    yield { type: 'text-delta', index: 0, text: '现在是 ' };
    yield { type: 'text-delta', index: 0, text: '12:00' };
    yield { type: 'usage', usage: { inputTokens: 8, outputTokens: 3, totalTokens: 11 } };
    yield { type: 'finish', reason: { kind: 'stop' } };
  }

  await assert.doesNotReject(async () => {
    const result = await collectStream(stream());
    assert.equal(result.text, '现在是 12:00');
    assert.deepEqual(result.usage, { inputTokens: 8, outputTokens: 3, totalTokens: 11 });
    assert.deepEqual(result.finish, { kind: 'stop' });
  });
});

test('probeModel sends the current-time probe and reports a successful response', async () => {
  let received;

  const result = await probeModel({
    providerId: 'demo',
    model: { id: 'demo-model', name: 'Demo Model' },
    timeoutMs: 100,
    stream: async function* (options) {
      received = options;
      yield { type: 'text-delta', index: 0, text: '现在是 12:00' };
      yield { type: 'finish', reason: { kind: 'stop' } };
    },
  });

  assert.equal(received.provider, 'demo');
  assert.equal(received.model, 'demo-model');
  assert.equal(received.maxTokens, 16);
  assert.equal(received.temperature, 0);
  assert.equal(received.messages[0].role, 'user');
  assert.match(received.messages[0].content[0].text, /当前时间/);
  assert.equal(result.isAvailable, true);
  assert.equal(result.responseText, '现在是 12:00');
  assert.equal(result.finishKind, 'stop');
  assert.equal(typeof result.responseTime, 'number');
});

test('probeModel aborts and reports a timeout instead of hanging', async () => {
  const result = await probeModel({
    providerId: 'demo',
    model: { id: 'slow' },
    timeoutMs: 10,
    stream: async function* (options) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(options.signal.aborted, true);
      yield { type: 'finish', reason: { kind: 'stop' } };
    },
  });

  assert.equal(result.isAvailable, false);
  assert.match(result.error, /timeout/i);
});

test('probeModel preserves useful structured provider errors', async () => {
  const result = await probeModel({
    providerId: 'demo',
    model: { id: 'broken' },
    timeoutMs: 100,
    stream: async function* () {
      yield { type: 'finish', reason: { kind: 'error', failure: { code: '401', message: 'Invalid API key' } } };
    },
  });

  assert.equal(result.isAvailable, false);
  assert.equal(result.error, 'Invalid API key');
});
