import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ProviderDetectorService } = require('../lib/index.js');

test('service discovers providers and models from the DSH llm service', async () => {
  const calls = [];
  const ctx = {
    llm: {
      listProviders: () => [
        { id: 'alpha', name: 'Alpha' },
        { id: 'beta', name: 'Beta' },
      ],
      listModels: async (provider) => {
        calls.push(provider);
        return [{ provider, id: `${provider}-model`, name: `${provider} model` }];
      },
      stream: async function* ({ provider, model }) {
        yield { type: 'text-delta', index: 0, text: `${provider}:${model}` };
        yield { type: 'finish', reason: { kind: 'stop' } };
      },
    },
    logger: { info() {}, warn() {}, error() {} },
  };

  const service = new ProviderDetectorService(ctx, { detectionTimeout: 100 });
  const providers = await service.getAllProviders();
  assert.deepEqual(providers.map(({ id }) => id), ['alpha', 'beta']);
  assert.deepEqual(providers[0].models.map(({ id }) => id), ['alpha-model']);

  const result = await service.detectProvider('alpha');
  assert.equal(result.isAvailable, true);
  assert.equal(result.models[0].isAvailable, true);
  assert.equal(result.models[0].responseText, 'alpha:alpha-model');
  assert.deepEqual(calls, ['alpha', 'beta', 'alpha']);
});

test('service supports probing only the selected model ids', async () => {
  const probed = [];
  const ctx = {
    llm: {
      listProviders: () => [{ id: 'alpha', name: 'Alpha' }],
      listModels: async () => [
        { provider: 'alpha', id: 'one', name: 'One' },
        { provider: 'alpha', id: 'two', name: 'Two' },
      ],
      stream: async function* ({ model }) {
        probed.push(model);
        yield { type: 'finish', reason: { kind: 'stop' } };
      },
    },
    logger: { info() {}, warn() {}, error() {} },
  };

  const service = new ProviderDetectorService(ctx, { detectionTimeout: 100 });
  const result = await service.detectProvider('alpha', ['two']);
  assert.deepEqual(probed, ['two']);
  assert.deepEqual(result.models.map(({ modelId }) => modelId), ['two']);
});
