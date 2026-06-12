# GSPM Digital — Complete Next.js + Supabase Authentication Guide
> Covers everything from folder structure to email templates, for a beginner building their first production app.

---

## Table of Contents
1. [What is Supabase and why it fits this project](#1-what-is-supabase)
2. [Project folder structure — where everything lives](#2-folder-structure)
3. [Installing and wiring up Supabase in Next.js](#3-installing-supabase)
4. [The three Supabase helper files explained](#4-supabase-helpers)
5. [Middleware — the security gatekeeper](#5-middleware)
6. [Converting your HTML login page to TSX components](#6-converting-login)
7. [The auth route handler (route.ts)](#7-route-ts)
8. [Email/Password sign-in flow](#8-email-password)
9. [Sign in with Google (OAuth)](#9-google-oauth)
10. [Supabase dashboard setup — tables, policies, settings](#10-supabase-dashboard)
11. [Email verification & custom email templates](#11-email-templates)
12. [Environment variables & secrets — keeping them safe](#12-env-variables)
13. [Complete generalised rundown — the full lifecycle](#13-full-rundown)

---

## 1. What is Supabase?

Supabase is a **Backend-as-a-Service** (BaaS). Instead of you writing a database, an authentication server, and an API from scratch, Supabase gives you all three hosted and ready to use.

For this project it provides:
- **Authentication** — email/password login, Google OAuth, session management, JWTs
- **PostgreSQL database** — where your users, parishes, reports, etc. are stored
- **Row Level Security (RLS)** — database-level rules that say "this user can only read their own parish data"
- **Realtime** — live updates (useful for dashboards later)
- **Storage** — file uploads (useful for document uploads later)
- **Edge Functions** — serverless functions if you need custom server logic

Supabase gives you a project dashboard at https://supabase.com and an auto-generated API. Your Next.js app talks to that API using their official SDK.

---

## 2. Folder Structure

After `npx create-next-app@latest gspm-portal --typescript --app --tailwind`, your `src/` directory should be organized like this:

```
gspm-portal/
├── src/
│   ├── app/                          ← Next.js App Router (all pages and API routes live here)
│   │   ├── layout.tsx                ← Root HTML shell, applies to all pages
│   │   ├── page.tsx                  ← Your homepage (redirects to /login or /dashboard)
│   │   │
│   │   ├── (auth)/                   ← Route group — auth pages share a layout
│   │   │   ├── layout.tsx            ← Auth-specific layout (the split left/right you designed)
│   │   │   ├── login/
│   │   │   │   └── page.tsx          ← The login page (/login route)
│   │   │   └── signup/
│   │   │       └── page.tsx          ← The signup page (/signup route)
│   │   │
│   │   ├── (dashboard)/              ← Protected pages after login
│   │   │   ├── layout.tsx            ← Dashboard layout (sidebar, header)
│   │   │   └── dashboard/
│   │   │       └── page.tsx          ← Main dashboard (/dashboard route)
│   │   │
│   │   └── auth/                     ← Supabase auth callback handler
│   │       └── callback/
│   │           └── route.ts          ← Handles OAuth redirects and email confirmations
│   │
│   ├── components/                   ← Reusable React components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx         ← The sign-in form (email/password inputs)
│   │   │   ├── GoogleSignInButton.tsx← The "Sign in with Google" button
│   │   │   └── AuthLeftPanel.tsx     ← The left narrative panel (desktop only)
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Input.tsx
│   │
│   ├── lib/                          ← Non-component helper code
│   │   └── supabase/
│   │       ├── client.ts             ← Browser-side Supabase client
│   │       ├── server.ts             ← Server-side Supabase client (RSC + Server Actions)
│   │       └── middleware.ts         ← Supabase session refresh logic (used by middleware.ts)
│   │
│   ├── middleware.ts                 ← Next.js middleware — runs on EVERY request
│   │
│   └── types/
│       └── database.types.ts         ← Auto-generated TypeScript types from Supabase
│
├── .env.local                        ← Your secrets — NEVER commit this to git
├── .gitignore                        ← Make sure .env.local is in here
└── next.config.ts
```

### Why route groups like `(auth)` and `(dashboard)`?
Parentheses in folder names create **route groups** in Next.js. The folder name does **not** become part of the URL. `/app/(auth)/login/page.tsx` is still reached at `/login`. The purpose is purely organizational — it lets you share a layout (the left panel, the split design) between login and signup without affecting routing.

---

## 3. Installing Supabase in Next.js

### Step 1 — Install the packages

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- `@supabase/supabase-js` — the core Supabase SDK
- `@supabase/ssr` — the modern package designed specifically for Next.js (App Router), handles cookies correctly for both server and client components

### Step 2 — Create a Supabase project

1. Go to https://supabase.com and sign up
2. Click **New Project**
3. Name it `gspm-portal`, choose a strong database password, pick the region closest to Uganda (EU West or ME South 1)
4. Wait ~2 minutes for it to provision

### Step 3 — Get your keys

In your Supabase dashboard:
- Go to **Project Settings → API**
- Copy **Project URL** (looks like `https://xyzabc.supabase.co`)
- Copy **anon public key** (a long JWT string — safe to use in the browser)
- Copy **service_role key** (keep this secret — full admin access)

### Step 4 — Create `.env.local`

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Used only in server-side code — never expose to the browser
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Why `NEXT_PUBLIC_`?** Next.js bakes any env variable prefixed with `NEXT_PUBLIC_` into the browser bundle. The URL and anon key are safe to expose — they are designed for public use. The service role key must never have this prefix.

---

## 4. The Three Supabase Helper Files Explained

### `src/lib/supabase/client.ts` — For the browser

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**When to use it:** In any `"use client"` component — forms, buttons, interactive UI. This client reads/writes auth tokens from the browser's cookies automatically.

---

### `src/lib/supabase/server.ts` — For the server

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component (read-only)
            // Middleware handles this instead
          }
        },
      },
    }
  );
}
```

**When to use it:** In Server Components (pages, layouts that fetch data), Server Actions, and `route.ts` API handlers. This client reads the session from the request cookies, not from `localStorage`.

---

### `src/lib/supabase/middleware.ts` — Session refresher

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not remove this — refreshes the session on every request
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected pages
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

**Why is this separate?** The middleware file at the root is a Next.js concept. The Supabase logic for refreshing sessions is extracted here to keep things clean.

---

## 5. Middleware — The Security Gatekeeper

```typescript
// src/middleware.ts  (root of src/, NOT inside app/)
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on all routes EXCEPT static files and _next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**How middleware works in Next.js:**
Before a page loads, Next.js runs this file. It intercepts every HTTP request. The `matcher` config tells it which routes to run on.

What it does for your app:
1. Calls `updateSession` which silently refreshes the user's JWT (Supabase sessions expire after 1 hour by default — middleware keeps them alive)
2. If the user is NOT logged in and tries to visit `/dashboard`, they get redirected to `/login`
3. If the user IS logged in and visits `/login`, you can redirect them to `/dashboard`

This is your first line of protection. Without it, a user could bookmark `/dashboard` and access it after their session expired.

---

## 6. Converting Your HTML Login Page to TSX Components

### The Auth Layout: `src/app/(auth)/layout.tsx`

```tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — only visible on desktop */}
      <AuthLeftPanel />
      
      {/* Right side — the actual form, swaps between login and signup */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
        {children}
      </div>
    </div>
  );
}
```

### The Left Panel Component: `src/components/auth/AuthLeftPanel.tsx`

This is a purely presentational component — it has no logic, just your branding. Extract the entire left `<div>` from your HTML into this file as a React component.

```tsx
// src/components/auth/AuthLeftPanel.tsx
export default function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
      {/* Your cathedral image, mission text, glass overlay — all from your HTML */}
      {/* ...paste the left column content here... */}
    </div>
  );
}
```

### The Login Page: `src/app/(auth)/login/page.tsx`

```tsx
// src/app/(auth)/login/page.tsx
import LoginForm from "@/components/auth/LoginForm";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      {/* Mobile logo */}
      <div className="flex flex-col items-center mb-8 lg:hidden">
        <span className="material-symbols-outlined text-primary text-5xl mb-2">church</span>
        <h2 className="font-headline-md text-headline-md text-primary">GSPM Portal</h2>
      </div>

      {/* Card */}
      <div className="bg-white border border-outline-variant rounded-xl p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-on-surface mb-2">Welcome to your Portal</h2>
          <p className="text-on-surface-variant">Sign in to access your parish or deanery operations.</p>
        </div>

        {/* Email/password form */}
        <LoginForm />

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-on-surface-variant">or</span>
          </div>
        </div>

        {/* Google sign in */}
        <GoogleSignInButton />

        {/* Footer links */}
        <div className="mt-8 pt-6 border-t border-outline-variant flex flex-wrap justify-center gap-6">
          <a href="#" className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-base">public</span>
            Public Site
          </a>
          <a href="#" className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-base">support_agent</span>
            Support
          </a>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-outline">
        © 2024 Kampala Archdiocese GSPM. Authorized Personnel Only.
      </p>
    </div>
  );
}
```

### The Login Form Component: `src/components/auth/LoginForm.tsx`

This is where auth logic lives. It's a Client Component because it handles form state and browser events.

```tsx
// src/components/auth/LoginForm.tsx
"use client"; // REQUIRED — this component uses browser APIs (useState, form submission)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Success — Next.js router pushes to dashboard
    // Middleware will verify the session on the server
    router.push("/dashboard");
    router.refresh(); // Tells Next.js to re-fetch server components
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-6">
      {error && (
        <div className="bg-error-container text-on-error-container text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-on-surface block">
          Email Address
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
            mail
          </span>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@archdiocese.org"
            required
            className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="text-sm font-medium text-on-surface">
            Password
          </label>
          <a href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
            lock
          </span>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full pl-11 pr-11 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-lg">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* Remember me */}
      <div className="flex items-center">
        <input
          id="remember"
          type="checkbox"
          className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary"
        />
        <label htmlFor="remember" className="ml-2 text-sm text-on-surface-variant">
          Remember me for 30 days
        </label>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-container text-on-primary text-sm font-medium py-4 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="animate-spin h-5 w-5 border-2 border-on-primary border-t-transparent rounded-full" />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <span className="material-symbols-outlined text-lg">login</span>
          </>
        )}
      </button>
    </form>
  );
}
```

### The Google Sign-In Button: `src/components/auth/GoogleSignInButton.tsx`

```tsx
// src/components/auth/GoogleSignInButton.tsx
"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // This tells Google where to redirect after they authenticate
      },
    });
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full border border-outline-variant text-on-surface text-sm font-medium py-3 rounded-lg hover:bg-surface-container transition-all flex items-center justify-center gap-3"
    >
      {/* Google SVG icon */}
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );
}
```

---

## 7. What Does `route.ts` Do?

A `route.ts` file inside `src/app/` is a **Next.js API route handler**. It defines server-side HTTP endpoints. It replaces the old `pages/api/` approach.

For authentication, the most critical one is the **OAuth callback handler**:

```typescript
// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  // When Google (or email link) sends the user back to your app,
  // they come to /auth/callback?code=SOME_CODE
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    // Exchange the one-time code for a real session
    // Supabase stores the session in cookies automatically
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, send them back to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

**The OAuth flow step by step:**
1. User clicks "Continue with Google"
2. Your app calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`
3. User is taken to Google's login page
4. User approves — Google redirects them to `/auth/callback?code=abc123`
5. Your `route.ts` picks up that `?code=` parameter
6. It calls `exchangeCodeForSession(code)` — Supabase validates the code with Google and creates a user session
7. Session is stored as a secure cookie
8. User lands on `/dashboard` as a logged-in user

**Why can't this just be client-side?** Because exchanging an OAuth code for a session involves your secret keys and should never happen in the browser.

---

## 8. Email/Password Sign-In Flow

The `signInWithPassword` call handles this entirely. What happens under the hood:

1. Supabase checks if the email exists in their `auth.users` table
2. If found, it compares the bcrypt-hashed password
3. If correct, it generates a JWT (access token) and refresh token
4. Both tokens are stored as HTTP-only cookies on your domain
5. Every subsequent request to Supabase includes these cookies
6. Your middleware refreshes the JWT before it expires

### Signup Flow

Create `src/app/(auth)/signup/page.tsx` and `src/components/auth/SignUpForm.tsx`:

```tsx
// In SignUpForm.tsx — the key difference from LoginForm
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    // After they click the verification email, they land at /auth/callback
    // which exchanges the code and logs them in
    data: {
      // You can store extra user metadata here
      full_name: fullName,
      role: "parish_staff", // or "admin", "deanery_coordinator" etc.
    }
  }
});

// After sign up, show them a message to check their email
// Don't auto-login — they need to verify first
if (!error) {
  setMessage("Check your email for a verification link.");
}
```

**What Supabase does on signup:**
1. Creates a record in `auth.users` (managed by Supabase, not directly accessible)
2. Sends a verification email to the address given
3. The user clicks the link → comes to `/auth/callback` → session created → redirected to dashboard

---

## 9. Sign In with Google (OAuth) — Supabase Dashboard Setup

### Step 1 — Enable Google provider in Supabase

1. Dashboard → **Authentication → Providers**
2. Find **Google** and toggle it on
3. You'll see two fields: **Client ID** and **Client Secret**

### Step 2 — Create a Google OAuth app

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Name it "GSPM Portal"
7. Under **Authorized redirect URIs**, add:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   (This is Supabase's internal callback URI — NOT your app's URL)
8. Click Create — copy the **Client ID** and **Client Secret**

### Step 3 — Paste them into Supabase

Paste the Client ID and Client Secret from Google into the Supabase Google provider settings. Save.

### Step 4 — Add your app's URL to Supabase allowed redirects

1. Supabase Dashboard → **Authentication → URL Configuration**
2. **Site URL**: `http://localhost:3000` (change to your production URL when live)
3. **Redirect URLs** (add all of these):
   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   ```

---

## 10. Supabase Dashboard Setup

### The `profiles` table

Supabase creates an `auth.users` table automatically, but you can't add custom columns to it. Instead, create a `profiles` table in the **public** schema:

In Supabase Dashboard → **SQL Editor**, run:

```sql
-- Create the profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  role text default 'staff' check (role in ('admin', 'deanery_coordinator', 'parish_staff', 'chaplain')),
  parish_id uuid,  -- link to a parishes table later
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
-- Without this, any logged-in user could read everyone's profile
alter table public.profiles enable row level security;

-- Policy: users can only read their own profile
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Policy: users can update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$;

-- Trigger that runs the function after every new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Why RLS matters:** Imagine a parish administrator at St. Charles Lwanga can't accidentally see the data from St. Kizito's parish. RLS enforces this at the database level — even if your code has a bug, the database won't allow unauthorized reads.

---

## 11. Email Verification & Custom Email Templates

### Where email settings live

Supabase Dashboard → **Authentication → Email Templates**

You'll see templates for:
- **Confirm signup** — sent when someone registers
- **Invite user** — sent when you invite a user (useful for admin-adding staff)
- **Magic link** — passwordless login
- **Change email address**
- **Reset password**

### Designing your email template

In the **Confirm signup** template editor, you can write custom HTML. Here's a branded example that matches your GSPM design:

```html
<html>
<body style="margin:0; padding:0; background-color:#f8f9ff; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#002045; padding: 32px 40px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:600; letter-spacing:-0.5px;">
                GSPM Digital Portal
              </h1>
              <p style="color:#adc7f7; margin:8px 0 0; font-size:13px;">
                Kampala Archdiocese — Good Samaritans &amp; Prisons Ministry
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="color:#0b1c30; font-size:16px; margin:0 0 16px;">Dear Ministry Member,</p>
              <p style="color:#43474e; font-size:15px; line-height:1.6; margin:0 0 24px;">
                You have been granted access to the GSPM Digital Operations Portal. 
                Please confirm your email address to activate your account.
              </p>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
                <tr>
                  <td style="background-color:#002045; border-radius:6px; text-align:center; padding: 14px 32px;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; display:inline-block;">
                      Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color:#74777f; font-size:13px; line-height:1.6; margin:0 0 8px;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color:#002045; font-size:12px; word-break:break-all; margin:0 0 24px;">
                {{ .ConfirmationURL }}
              </p>
              
              <hr style="border:none; border-top: 1px solid #e5eeff; margin: 24px 0;" />
              
              <p style="color:#74777f; font-size:12px; margin:0;">
                This link expires in 24 hours. If you did not request this, please ignore this email 
                or contact the GSPM Digital Administrator.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#eff4ff; padding: 20px 40px; text-align:center;">
              <p style="color:#74777f; font-size:11px; margin:0;">
                © 2024 Good Samaritans &amp; Prisons Ministry — Kampala Archdiocese<br/>
                This is an automated message. Authorized personnel only.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Template variables Supabase provides:**
- `{{ .ConfirmationURL }}` — the unique magic link
- `{{ .Email }}` — the user's email
- `{{ .SiteURL }}` — your site URL from settings

### Custom SMTP (important for production)

By default, Supabase uses its own mail server with rate limits (3 emails/hour in free tier). For production, set up a real email provider:

1. Supabase Dashboard → **Project Settings → Auth → SMTP Settings**
2. Use a service like **Resend** (resend.com) — cheapest, designed for transactional emails
   - Sign up → Create API key → Add your domain
   - SMTP Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: your Resend API key

This gives you full control, proper deliverability, and no rate limits.

---

## 12. Environment Variables & Secrets

Your `.env.local` file stays on your computer and **never goes to GitHub**. Make sure `.env.local` is in your `.gitignore` (it is by default with create-next-app).

```
# .gitignore (should already have this)
.env.local
.env.*.local
```

### For production deployment (Vercel)

When you deploy to Vercel:
1. Go to your Vercel project → **Settings → Environment Variables**
2. Add each variable from `.env.local` manually
3. Vercel injects them at build time — your app never reads `.env.local` in production

### Summary of all env variables for this project

```env
# .env.local

# Supabase — safe for browser (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase — server only (NO NEXT_PUBLIC_ prefix — never expose)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Your app URL (used in OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 13. Complete Generalised Rundown — The Full Lifecycle

Here is every moving piece in one mental model:

### The user visits `/login`

1. **Next.js Middleware runs first** — it checks for a Supabase session cookie. No cookie → user is unauthenticated, middleware lets them through to `/login`. If they HAD a session, it could redirect them straight to `/dashboard`.

2. **The page renders** — `src/app/(auth)/login/page.tsx` is a Server Component. It has no client-side JS of its own. It renders the shell (card, branding, links) on the server and streams it to the browser as HTML.

3. **LoginForm and GoogleSignInButton hydrate** — because they're `"use client"` components, React takes over in the browser and attaches event listeners to the form inputs and buttons.

---

### The user clicks "Sign In" (email/password)

4. `handleSignIn` fires — it creates a browser Supabase client from `client.ts`
5. It calls `supabase.auth.signInWithPassword({ email, password })`
6. The browser makes a `POST` request to Supabase's API (`https://xxxx.supabase.co/auth/v1/token`)
7. Supabase validates the credentials, returns a JWT access token + refresh token
8. `@supabase/ssr` stores these as secure cookies on your domain
9. `router.push('/dashboard')` navigates the user
10. **Middleware runs again** for the `/dashboard` request — this time it finds the session cookie, calls `supabase.auth.getUser()` to validate it with Supabase's server, confirms the user is real, lets the request through
11. The dashboard page renders with real user data

---

### The user clicks "Continue with Google"

4. `handleGoogleSignIn` fires → calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
5. Browser is redirected to Google's OAuth consent screen
6. User approves → Google sends them to **Supabase's** redirect URI (`your-project.supabase.co/auth/v1/callback?code=xxx`)
7. Supabase validates the code with Google, creates/finds the user in `auth.users`, then redirects the user to YOUR app at `/auth/callback?code=yyy`
8. **`src/app/auth/callback/route.ts` runs** — this is a server-side handler. It picks up the `?code=` from the URL
9. It calls `supabase.auth.exchangeCodeForSession(code)` — Supabase creates a session and sets cookies
10. User is redirected to `/dashboard` as authenticated

---

### The user signs up for the first time

4. `supabase.auth.signUp({ email, password })` is called
5. Supabase creates a user in `auth.users` with `email_confirmed_at = null`
6. Supabase sends a **verification email** using your template
7. The user clicks the link in the email → lands at `/auth/callback?code=xxx`
8. `exchangeCodeForSession` runs → sets `email_confirmed_at` to now, creates a session
9. The database trigger `on_auth_user_created` fires and creates a row in `public.profiles`
10. User is redirected to `/dashboard`

---

### Staying logged in

- Supabase JWTs expire after **1 hour** by default
- Every time a request hits your app, middleware calls `supabase.auth.getUser()` — this silently uses the **refresh token** (valid for 7 days by default) to get a new JWT
- The new JWT is stored in the cookie, replacing the old one
- The user never knows this is happening — they stay logged in seamlessly
- If the refresh token also expires (user was inactive for 7+ days), they're redirected to `/login`

---

### Security summary

| Layer | What it protects |
|-------|-----------------|
| `.env.local` | Keeps secrets off GitHub |
| HTTP-only cookies | Prevents JavaScript from stealing tokens (XSS protection) |
| Middleware | Prevents unauthenticated access to any `/dashboard/*` route |
| Row Level Security | Prevents cross-user data access even if your code has bugs |
| Supabase JWTs | Cryptographically signed — can't be forged |
| Email verification | Ensures only real email owners can create accounts |

---

### Your build order for authentication

Work through these in order and test each one before moving on:

1. ✅ Install packages, create `.env.local`, create the three Supabase helper files
2. ✅ Create `src/middleware.ts`  
3. ✅ Create the `(auth)` route group with its layout and left panel
4. ✅ Build the login page with `LoginForm` and `GoogleSignInButton`
5. ✅ Create the `/auth/callback/route.ts` handler
6. ✅ Test email/password login with a test account in Supabase
7. ✅ Set up Google OAuth in Supabase + Google Cloud Console
8. ✅ Test Google login
9. ✅ Build the signup page
10. ✅ Set up email templates in Supabase dashboard
11. ✅ Set up custom SMTP (Resend or similar) before going live
12. ✅ Create `profiles` table with RLS policies
13. ✅ Add a protected `/dashboard` page to verify the whole flow works end-to-end

---

*This guide covers the complete authentication layer. Once this foundation is solid, every other feature in the app (parish management, reports, user roles) builds on top of the Supabase client files and RLS policies established here.*