// src/components/auth/LoginForm.tsx
"use client"; // REQUIRED — this component uses browser APIs (useState, form submission)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";

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
                <label
                    htmlFor="email"
                    className="text-sm font-medium text-on-surface block"
                >
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
                    <label
                        htmlFor="password"
                        className="text-sm font-medium text-on-surface"
                    >
                        Password
                    </label>
                    <a
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline"
                    >
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
                <label
                    htmlFor="remember"
                    className="ml-2 text-sm text-on-surface-variant"
                >
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
                        <span className="material-symbols-outlined text-lg">
                            login
                        </span>
                    </>
                )}
            </button>
        </form>
    );
}
