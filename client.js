window.__ModuleLoader__.load({
  id: 'dsh-provider-detector',
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    const React = require('react');
    const el = React.createElement;

    const CSS = `
      .pdet-root{display:flex;flex-direction:column;gap:14px;max-width:900px;color:var(--dsw-alias-label-primary);font-size:13px}
      .pdet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .pdet-title{font-size:16px;font-weight:650}
      .pdet-sub{margin-top:4px;color:var(--dsw-alias-label-secondary);line-height:1.5}
      .pdet-actions,.pdet-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .pdet-btn{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:inherit;padding:6px 11px;cursor:pointer}
      .pdet-btn.primary{background:var(--dsw-alias-brand-primary);color:white;border-color:transparent}
      .pdet-btn:disabled{opacity:.5;cursor:not-allowed}
      .pdet-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:12px}
      .pdet-providers{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px}
      .pdet-provider{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px}
      .pdet-provider small,.pdet-muted{color:var(--dsw-alias-label-secondary)}
      .pdet-result{display:flex;flex-direction:column;gap:9px}
      .pdet-result-head{display:flex;align-items:center;gap:8px;font-weight:600}
      .pdet-model{display:grid;grid-template-columns:auto minmax(150px,1fr) auto;gap:8px;align-items:center;padding:7px 0;border-top:1px solid var(--dsw-alias-border-l1)}
      .pdet-ok{color:var(--dsw-alias-state-success-primary)}
      .pdet-bad{color:var(--dsw-alias-state-error-primary)}
      .pdet-error{grid-column:2/-1;color:var(--dsw-alias-state-error-primary);font-size:12px;overflow-wrap:anywhere}
      .pdet-text{grid-column:2/-1;color:var(--dsw-alias-label-secondary);font-size:12px;white-space:pre-wrap}
    `;

    function installStyle() {
      const id = 'dsh-provider-detector-style';
      if (document.getElementById(id)) return () => {};
      const node = document.createElement('style');
      node.id = id;
      node.textContent = CSS;
      document.head.appendChild(node);
      return () => node.remove();
    }

    function DetectorPanel() {
      const [providers, setProviders] = React.useState([]);
      const [selected, setSelected] = React.useState(new Set());
      const [results, setResults] = React.useState([]);
      const [loading, setLoading] = React.useState(true);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');

      const loadProviders = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
          const response = await fetch('/api/provider-detector/providers');
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          const next = Array.isArray(data.providers) ? data.providers : [];
          setProviders(next);
          setSelected(new Set(next.map((provider) => provider.id)));
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setLoading(false);
        }
      }, []);

      React.useEffect(() => { loadProviders(); }, [loadProviders]);

      const toggleProvider = (id) => setSelected((previous) => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });

      const detectSelected = async () => {
        setBusy(true);
        setError('');
        setResults([]);
        try {
          const next = [];
          for (const providerId of selected) {
            const response = await fetch(`/api/provider-detector/detect/${encodeURIComponent(providerId)}`, { method: 'POST' });
            if (!response.ok) throw new Error(`${providerId}: HTTP ${response.status}`);
            const data = await response.json();
            if (data.result) next.push(data.result);
            setResults(next.slice());
          }
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setBusy(false);
        }
      };

      const allSelected = providers.length > 0 && selected.size === providers.length;
      const toggleAll = () => setSelected(allSelected ? new Set() : new Set(providers.map((provider) => provider.id)));

      return el('div', { className: 'pdet-root' },
        el('div', { className: 'pdet-head' },
          el('div', null,
            el('div', { className: 'pdet-title' }, 'Provider / Model 可用性检测'),
            el('div', { className: 'pdet-sub' }, '使用“请回答当前时间”发起最小真实请求，验证选中 provider 下哪些模型当前可用。')
          ),
          el('button', { className: 'pdet-btn', disabled: loading || busy, onClick: loadProviders }, '刷新')
        ),
        el('div', { className: 'pdet-card' },
          el('div', { className: 'pdet-row' },
            el('label', null, el('input', { type: 'checkbox', checked: allSelected, onChange: toggleAll }), ' 全选'),
            el('span', { className: 'pdet-muted' }, `${selected.size}/${providers.length} 个 provider`)
          ),
          loading
            ? el('div', { className: 'pdet-muted' }, '加载 providers…')
            : el('div', { className: 'pdet-providers' }, providers.map((provider) =>
              el('label', { className: 'pdet-provider', key: provider.id },
                el('input', { type: 'checkbox', checked: selected.has(provider.id), onChange: () => toggleProvider(provider.id) }),
                el('span', null, provider.name || provider.id),
                el('small', null, `${(provider.models || []).length} models`)
              )
            ))
        ),
        el('div', { className: 'pdet-actions' },
          el('button', { className: 'pdet-btn primary', disabled: busy || selected.size === 0, onClick: detectSelected }, busy ? '检测中…' : `检测选中的 ${selected.size} 个 provider`),
          el('button', { className: 'pdet-btn', disabled: busy || results.length === 0, onClick: () => setResults([]) }, '清除结果')
        ),
        error ? el('div', { className: 'pdet-bad' }, `错误：${error}`) : null,
        results.map((result) => el('div', { className: 'pdet-card pdet-result', key: result.providerId },
          el('div', { className: 'pdet-result-head' }, result.isAvailable ? '✅' : '❌', result.providerName, el('span', { className: 'pdet-muted' }, `${result.models.length} models`)),
          result.error ? el('div', { className: 'pdet-error' }, result.error) : null,
          (result.models || []).map((model) => el('div', { className: 'pdet-model', key: model.modelId },
            el('span', { className: model.isAvailable ? 'pdet-ok' : 'pdet-bad' }, model.isAvailable ? '✅' : '❌'),
            el('span', null, model.modelName || model.modelId),
            el('span', { className: 'pdet-muted' }, model.responseTime ? `${model.responseTime}ms` : model.finishKind || ''),
            model.responseText ? el('span', { className: 'pdet-text' }, model.responseText) : null,
            model.error ? el('span', { className: 'pdet-error' }, model.error) : null
          ))
        ))
      );
    }

    function apply(ctx) {
      const slots = ctx.get('slots');
      if (!slots) return;
      const cleanupStyle = installStyle();
      ctx.effect(() => cleanupStyle, 'provider-detector client styles');
      slots.inject('settings.plugins.tab', () => slots.register(
        { name: 'settings.plugins.tab', id: 'provider-detector', order: 90, label: 'Provider Detector' },
        () => el(DetectorPanel)
      ));
    }

    exports.name = 'dsh-provider-detector';
    exports.inject = ['@deepseek-ai/dsh-client-runtime', '@deepseek-ai/dsh-client-ui-settings', '@deepseek-ai/dsh-client-ui-slots'];
    exports.apply = apply;
    return module.exports;
  },
});
