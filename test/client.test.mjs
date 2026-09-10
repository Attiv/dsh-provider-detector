import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('client bundle registers a Provider Detector tab in DSH Settings', () => {
  let plugin;
  const fakeDocument = {
    getElementById() { return null; },
    createElement() { return { set id(_) {}, set textContent(_) {}, remove() {} }; },
    head: { appendChild() {} },
  };
  const context = {
    document: fakeDocument,
    window: {
      __ModuleLoader__: {
        load(entry) {
          plugin = entry.factory((name) => {
            if (name === 'react') return { createElement() {} };
            throw new Error(`unexpected dependency: ${name}`);
          });
        },
      },
    },
  };

  vm.runInNewContext(fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8'), context);

  let registration;
  const slots = {
    inject(name, callback) {
      assert.equal(name, 'settings.plugins.tab');
      registration = callback();
    },
    register(options, component) {
      return { options, component };
    },
  };

  plugin.apply({
    get(name) { return name === 'slots' ? slots : undefined; },
    effect(fn) { fn(); },
  });

  assert.equal(plugin.name, 'dsh-provider-detector');
  assert.equal(registration.options.id, 'provider-detector');
  assert.equal(registration.options.name, 'settings.plugins.tab');
  assert.equal(registration.options.label, 'Provider Detector');
});
