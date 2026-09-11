import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('client bundle registers Provider Detector as a first-level Settings section', () => {
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
      assert.equal(name, 'settings.section');
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
  assert.deepEqual(Array.from(plugin.inject), ['slots']);
  assert.equal(registration.options.id, 'provider-detector');
  assert.equal(registration.options.name, 'settings.section');
  assert.equal(registration.options.label, 'Provider 检测');
});
