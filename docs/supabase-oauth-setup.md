# Supabase Google OAuth Setup

> **Manual action required** — these steps must be completed in the Supabase Dashboard before Google login will work.

---

## 1. Enable Google Provider

1. Open your project in the [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication → Providers**
3. Find **Google** in the list and toggle it **on**
4. Leave the page open — you'll need to paste credentials here in step 3

---

## 2. Add Redirect URLs

1. In the Supabase Dashboard, go to **Authentication → URL Configuration**
2. Under **Redirect URLs**, click **Add URL** and add:
   - `http://localhost:3000/auth/callback` (local development)
   - `https://yourdomain.com/auth/callback` (production — replace with your actual domain)
3. Click **Save**

---

## 3. Get Google OAuth Credentials

You need a **Client ID** and **Client Secret** from Google Cloud Console.

### Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set **Application type** to **Web application**
6. Under **Authorized redirect URIs**, add:
   - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
   - You can find this URL in the Supabase Dashboard under **Authentication → Providers → Google**
7. Click **Create** — copy the **Client ID** and **Client Secret**

### Paste into Supabase

1. Back in the Supabase Dashboard under **Authentication → Providers → Google**
2. Paste the **Client ID** and **Client Secret**
3. Click **Save**

---

## 4. Verify the Flow

Once configured, test the full OAuth flow:

1. Start the dev server: `pnpm dev`
2. Visit `http://localhost:3000/login`
3. Click **Entrar com Google**
4. You should be redirected to Google, then back to `/auth/callback`, then to `/bracket`

If the redirect fails, check:

- The redirect URL in **Authentication → URL Configuration** matches exactly
- The authorized redirect URI in Google Cloud Console matches the Supabase callback URL
- Your `.env.local` has the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Environment Variables Reference

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # never expose to client
```

See `.env.local.example` for the template.
