// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    // When Google (or email link) sends the user back to your app,
    // they come to /auth/callback?code=SOME_CODE
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        const supabase = await createClient(await cookies());

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
