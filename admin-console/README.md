# HINTERLAND Administration

Standalone administrator console for HINTERLAND. It is a separate Next.js
application and a separate deployment from the public site; only the Supabase
project is shared.

- Console: `/admin`
- Sign in: `/login` (administrator accounts only; ordinary accounts are rejected)
- First sign-in after provisioning is redirected to `/admin/set-password`
- All reads and writes go through the security-definer RPCs in
  `../supabase/migrations`, which reject non-administrators at the database layer.

## Environment

Copy `.env.example` and fill in:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (public) key |
| `NEXT_PUBLIC_SITE_URL` | This admin deployment's origin |
| `NEXT_PUBLIC_MAIN_SITE_URL` | Public HINTERLAND site |
| `MAIN_SITE_URL` | Used by the System Health checks |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Optional AI provider health check |

No service-role key is used by this application.

## Development

```bash
npm install
npm run dev        # http://localhost:3100
npm run build
npm start
```

## Deployment

Create a Vercel project from the same repository with **Root Directory**
`admin-console`, framework preset Next.js, and the environment variables above.
Every push to `main` then redeploys both the public site and this console; they
are independent projects.
