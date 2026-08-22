# Deploy Yokai Musubi on Vercel

This repository is configured to deploy the storefront and its API from one Vercel project:

- `/` and `/order/*` serve the React storefront.
- `/api/*` runs the Express ordering API.
- Direct visits to `/order`, `/order/checkout`, and `/order/confirmation` fall back to the storefront instead of returning a Vercel 404.

## Vercel project settings

1. Set the project **Root Directory** to the repository root — not `artifacts/yokai-musubi` or `artifacts/api-server`.
2. Leave the build and output settings managed by `vercel.json`.
3. Redeploy after the latest GitHub commit is available.

## Required environment variables

Add these values in **Vercel → Project → Settings → Environment Variables**:

| Variable | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Menu and ordering API | PostgreSQL connection string used by the ordering data store. |
| `SESSION_SECRET` | Checkout confirmation security | Use a long random value. |
| `PUBLIC_APP_URL` | Stripe return URLs | Set to the exact `https://` production storefront URL. |
| `STAFF_ACCESS_KEY` | Staff order management | Use a long random value; never expose it in the browser. |
| `STRIPE_SECRET_KEY` | Live payment | Keep absent until live payments are approved. |
| `STRIPE_WEBHOOK_SECRET` | Verified Stripe payment webhooks | Keep absent until live payments are approved. |

When Stripe is enabled, configure its webhook endpoint as:

`https://your-vercel-domain/api/stripe/webhook`

The ordering API remains in draft mode until the staff settings explicitly enable it. That means deploying these files does not turn on payments or submit customer orders by itself.