# Railway Migration Runbook

## Objective

Migrate MOTHERXIP / Alienxip Prospects from Vercel to Railway while preserving the current Next.js application, Supabase integration, CI/CD gates, and rollback safety.

## Railway Service

- Repository: `Alienxip Prospects / alienxip-prospects-dashboard`
- Branch: `main`
- Service root directory: repository root
- Build command: `npm --prefix app-next ci && npm run build`
- Start command: `npm start`
- Healthcheck path: `/os/login`
- Runtime: Next.js standalone server

## Required Railway Variables

Configure these in Railway Variables. Do not commit real values.

### Public browser variables

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Server-only variables

- `HOSTNAME=0.0.0.0`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOTHERXIP_WEBHOOK_SECRET`
- `MOTHERXIP_PUBLIC_URL`
- `N8N_OUTREACH_WEBHOOK_URL`

### Provider safety variables

- `SDR_LLM_MODE=mock`
- `PROVIDER_ENABLED=false`
- `AI_DRY_RUN=true`
- `OPENAI_API_KEY`
- `OPENAI_SDR_MODEL`
- `MAX_COST_PER_CONVERSATION=0`
- `MAX_DAILY_COST=0`

Keep real AI/provider activation blocked until a separate go-live approval.

## Supabase Auth Checklist

After Railway generates the public domain, add the Railway URL and final custom domain in Supabase Auth URL settings:

- Site URL
- Redirect URLs
- Password recovery redirect: `/os/reset-password`

The app now builds password recovery redirects from `NEXT_PUBLIC_SITE_URL` or the current browser origin.

## Runtime Binding

Set `HOSTNAME=0.0.0.0` in Railway Variables. Without this override, the Next.js standalone server can bind to the container hostname and Railway healthchecks/public networking may fail even though the server logs show `Ready`.

## Deployment Flow

1. Push to `main`.
2. GitHub Actions runs lint and build.
3. Railway autodeploys the repository root service from `main`.
4. Railway healthcheck validates `/os/login`.
5. Validate the public Railway URL before disabling Vercel.

## Post-Deploy Validation

- Open Railway public URL.
- Confirm `/os/login` renders.
- Login with the production test account.
- Confirm `/os` redirects correctly for authenticated users.
- Confirm protected routes do not return 404.
- Request password recovery and verify the generated redirect uses Railway/custom domain.
- Check `/api/outreach/events` rejects requests without `x-motherxip-webhook-secret`.
- Check Railway deployment logs for build/runtime errors.
- Confirm no active user-facing flow points to `alienxip-prospects-dashboard.vercel.app`.

## Rollback

Before disabling Vercel, keep the last working Vercel deployment as rollback.

After Railway is the active host, rollback through Railway:

1. Open the Railway service.
2. Select the previous healthy deployment.
3. Redeploy it.
4. Re-run the post-deploy validation checklist.

## Vercel Decommission

Only after Railway production is validated:

1. Remove or disable Vercel Git autodeploy for this repository.
2. Remove the production custom domain from Vercel.
3. Point the production custom domain to Railway.
4. Keep historical Vercel docs only as migration record.
