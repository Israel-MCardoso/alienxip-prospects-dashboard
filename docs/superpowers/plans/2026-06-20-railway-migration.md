# Railway Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move MOTHERXIP/Alienxip Prospects production hosting from Vercel to Railway without changing product features.

**Architecture:** Railway will deploy the Next.js app from `app-next` using the standalone Next.js server. CI will keep lint/build gates in GitHub before Railway autodeploys from `main`, while secrets remain in Railway Variables.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Railway, GitHub Actions.

---

### Task 1: Configure Railway Runtime

**Files:**
- Modify: `app-next/next.config.ts`
- Modify: `app-next/package.json`
- Create: `railway.json`
- Delete: `vercel.json`

- [ ] **Step 1: Enable Next.js standalone output**

Set `output: "standalone"` in `app-next/next.config.ts` and preserve the existing Turbopack root.

- [ ] **Step 2: Use the standalone server start command**

Change `app-next/package.json` script `start` from `next start` to `node .next/standalone/server.js`.

- [ ] **Step 3: Add Railway config-as-code**

Create `railway.json` with Railway build/deploy settings for the repository root:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm --prefix app-next ci && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/os/login",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

- [ ] **Step 4: Remove Vercel config**

Delete `vercel.json` so new deploy metadata no longer advertises Vercel as the active platform.

### Task 2: Remove Runtime Vercel Coupling

**Files:**
- Modify: `app-next/src/features/auth/login-form.tsx`
- Create: `app-next/src/lib/site-url.ts`
- Create: `app-next/.env.example`

- [ ] **Step 1: Add a public site URL helper**

Create a helper that normalizes `NEXT_PUBLIC_SITE_URL`, supports Railway public domains, and falls back to `window.location.origin` in the browser.

- [ ] **Step 2: Replace hardcoded Vercel reset URL**

Use the helper to build `/os/reset-password` dynamically in `login-form.tsx`.

- [ ] **Step 3: Document required environment variables**

Create `app-next/.env.example` listing required Railway variables without secret values.

### Task 3: Add CI/CD Gate

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Add GitHub Actions workflow**

Run install, lint, and build on pull requests and pushes to `main`.

- [ ] **Step 2: Keep deployment on Railway**

Do not add Vercel CLI, Vercel secrets, or Vercel deploy steps.

### Task 4: Document Railway Operations

**Files:**
- Create: `docs/RAILWAY_MIGRATION_RUNBOOK.md`

- [ ] **Step 1: Add environment variable checklist**

List all variables that must be configured in Railway Variables.

- [ ] **Step 2: Add deployment and rollback steps**

Document Railway GitHub deployment, public domain, logs, healthcheck, and rollback through previous deployment redeploy.

- [ ] **Step 3: Add post-deploy validation**

Include login, `/os`, protected route redirect, reset password URL, API route readiness, and Supabase redirect URL checks.

### Task 5: Verify Locally

**Files:**
- No source changes expected unless verification exposes an issue.

- [ ] **Step 1: Run lint**

Run: `npm run lint`

- [ ] **Step 2: Run build**

Run: `npm run build`

- [ ] **Step 3: Inspect native Vercel references**

Run: `rg -n "vercel|Vercel|VERCEL" app-next package.json .github docs README.md`

Only historical documentation or migration notes may remain.

### Task 6: Commit, Push, Deploy, Validate

**Files:**
- Git metadata only.

- [ ] **Step 1: Stage only migration files**

Stage `.gitignore`, Railway config, CI, docs, Next config, auth helper changes, and removal of `vercel.json`.

- [ ] **Step 2: Commit**

Commit message: `chore: migrate production hosting to railway`

- [ ] **Step 3: Push to main**

Push the commit to `origin/main`.

- [ ] **Step 4: Configure Railway project**

Use Railway CLI or Railway dashboard/API to create/link the service, set service root to `app-next`, configure variables, generate public domain, and deploy from GitHub.

- [ ] **Step 5: Validate production**

Validate that the public Railway URL serves the current MOTHERXIP app and that Vercel is no longer the active production target.
