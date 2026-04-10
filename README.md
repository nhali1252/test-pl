# Pocket Ledger

A mobile-friendly personal finance tracker with income, expenses, loans, dues, PWA support, and bilingual (English / Bangla) UI.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite 5 + Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions)
- **PWA:** vite-plugin-pwa with auto-update service worker

---

## Environment Variables

Create a `.env` file (or set these in your hosting dashboard):

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Your Supabase anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Optional | Supabase project ref (used internally) |

Copy `.env.example` to `.env` and fill in your values.

---

## Local Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:8080`.

---

## Production Build

```bash
npm run build
```

Output is in the `dist/` folder — a static site ready to deploy.

---

## Deployment

### Vercel

1. Import the repo on [vercel.com](https://vercel.com).
2. Set environment variables in **Settings → Environment Variables**.
3. Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.
4. Deploy. SPA rewrites are handled by `vercel.json`.

### Netlify

1. Import the repo on [netlify.com](https://app.netlify.com).
2. Set environment variables in **Site settings → Environment variables**.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Deploy. SPA redirects are handled by `netlify.toml` and `public/_redirects`.

### GitHub Pages

1. Build locally or via CI: `npm run build`.
2. Deploy the `dist/` folder. If hosted under a subpath (e.g., `/repo-name/`), set `base` in `vite.config.ts`:
   ```ts
   base: "/repo-name/",
   ```
3. For SPA routing, use a `404.html` redirect trick or deploy with a tool like [spa-github-pages](https://github.com/rafgraph/spa-github-pages).

### Other Static Hosting (Render, VPS, Caddy, Nginx)

1. Build: `npm run build`.
2. Serve the `dist/` folder as a static site.
3. Configure SPA fallback — all non-file requests should serve `index.html`.

**Nginx example:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Caddy example:**
```
try_files {path} /index.html
```

---

## Supabase Configuration After Deployment

After deploying to a new domain, update these settings in your **Supabase dashboard** → **Authentication → URL Configuration**:

| Setting | Value |
|---|---|
| **Site URL** | `https://your-domain.com` |
| **Redirect URLs** | `https://your-domain.com`, `https://your-domain.com/reset-password` |

For **local development**, also add:

| Setting | Value |
|---|---|
| **Redirect URLs** | `http://localhost:8080`, `http://localhost:8080/reset-password` |

### Google OAuth Setup

1. In your **Supabase dashboard** → **Authentication → Providers → Google**, enable the Google provider.
2. In the **Google Cloud Console** → **APIs & Services → Credentials**, create an OAuth 2.0 Client ID (Web application).
3. Under **Authorized redirect URIs**, add your Supabase auth callback URL:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```
4. Copy the **Client ID** and **Client Secret** into the Supabase Google provider settings.
5. Under **Authorized JavaScript origins**, add your production domain and `http://localhost:8080` for local dev.

The app uses standard `supabase.auth.signInWithOAuth()` with `redirectTo: window.location.origin`, so the user lands back at the app root after Google sign-in. No custom callback route is needed — Supabase handles the `/auth/v1/callback` internally and redirects to your `redirectTo` URL.

---

## PWA Notes

- The service worker and manifest work on any HTTPS host.
- Auto-update checks run every 60 seconds in production.
- The service worker is **not** registered in development or inside iframes/Lovable preview.

---

## Base Path

By default the app is served from `/`. To deploy under a subpath, set `base` in `vite.config.ts`:

```ts
export default defineConfig({
  base: "/your-subpath/",
  // ...
});
```

Update `start_url` in `public/manifest.json` accordingly.
