# Provider Model Detection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Detect real model availability for selected DSH providers by sending a short current-time prompt through the native `ctx.llm` service.

**Architecture:** Use `ctx.llm.listProviders()` and `ctx.llm.listModels()` for the live provider/model catalog, then use `ctx.llm.stream()` with a bounded request for each selected model. Keep the host API as the source of truth and update the existing Vue panel to consume structured provider/model rows.

**Tech Stack:** TypeScript, Node built-in test runner, DSH Cordis/WebServer, DSH `@deepseek-ai/dsh-llm` runtime APIs, Vue SFC.

---

### Task 1: Extract and test pure detection helpers

**Files:**
- Create: `src/detection.ts`
- Create: `test/detection.test.mjs`
- Modify: `package.json` (test script and DSH LLM dev/peer dependency if needed)

**Step 1: Write failing tests**

Cover provider/model normalization, selected-model filtering, text chunk aggregation, terminal error classification, and timeout behavior using fake streams.

**Step 2: Run tests to verify failure**

Run: `npm test`
Expected: FAIL because `src/detection.ts` does not exist.

**Step 3: Implement minimal helpers**

Add pure functions for model selection, response text collection, finish/error mapping, and abortable execution. Do not perform network calls in these helpers.

**Step 4: Run tests**

Run: `npm test`
Expected: PASS.

### Task 2: Implement live DSH provider/model discovery and real model probing

**Files:**
- Modify: `src/index.ts`
- Modify: `src/routes.ts`
- Modify: `package.json`

**Step 1: Add failing service tests**

Test the service with a fake `llm` object that exposes `listProviders`, `listModels`, and `stream`; assert that only selected models are probed and that stream errors/timeouts become per-model failures.

**Step 2: Run the focused test**

Run: `node --test test/service.test.mjs`
Expected: FAIL because the service still returns empty catalogs and does not stream requests.

**Step 3: Implement live discovery/probing**

Use the runtime methods, create a user message containing `请回答当前时间，只输出当前时间。`, set a small `maxTokens`, enforce `detectionTimeout`, collect text/usage/finish, and never expose credentials.

**Step 4: Update API contracts**

Return structured providers with models from `GET /providers`. Accept optional `{ modelIds }` in `POST /detect/:providerId`; default to all listed models. Keep per-model failures isolated.

**Step 5: Run focused tests**

Run: `node --test test/service.test.mjs`
Expected: PASS.

### Task 3: Update the Web UI for provider selection and model results

**Files:**
- Modify: `src/components/DetectorPanel.vue`
- Modify: `README.md`
- Modify: `HOW_TO_USE.md`

**Step 1: Add/update UI tests or compile checks**

Use TypeScript build as the baseline check because the component is not currently registered in a standalone frontend test harness.

**Step 2: Implement UI changes**

Render structured providers and model counts, preserve provider multi-select, submit selected provider IDs, and display response preview, elapsed time, usage, finish state, and errors.

**Step 3: Run build**

Run: `npm run build`
Expected: PASS.

### Task 4: Integration verification in DSH

**Files:**
- No source changes expected.

**Step 1: Build plugin**

Run: `npm run build`.

**Step 2: Start DSH web profile**

Run: `pnpm dlx @deepseek-ai/dsh@latest web --no-open`.

**Step 3: Verify API**

Call `/api/provider-detector/providers`, select one returned provider, call `/api/provider-detector/detect/<id>`, and inspect that each returned model has a real response or a useful provider error.

**Step 4: Stop the test DSH process and record results**

Do not leave a verification server running; document any provider-specific failures without exposing keys.

### Task 5: Commit implementation

**Step 1: Review diff and status**

Run: `git diff --check` and `git status --short`.

**Step 2: Run complete verification**

Run: `npm test && npm run build`.

**Step 3: Commit**

```bash
git add src test package.json README.md HOW_TO_USE.md docs/plans
git commit -m "feat: detect provider model availability"
```
