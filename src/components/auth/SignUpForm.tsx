// src/components/auth/SignUpForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client"; // Adjust path as needed

export default function SignUpForm() {
    const router = useRouter();

    // Form fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [parish, setParish] = useState("");
    const [role, setRole] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const supabase = createClient();

        // Store additional profile information in user metadata
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    parish: parish,
                    role: role,
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // If the user object exists but the session is null,
        // email confirmation is required.
        if (data.user && !data.session) {
            setSuccess(true);
            setLoading(false);
            // Optionally, auto-redirect after a few seconds
            setTimeout(() => {
                router.push("/signin");
            }, 5000);
            return;
        }

        // Otherwise, the user is signed in immediately
        router.push("/dashboard");
        router.refresh();
    };

    if (success) {
        return (
            <div className="space-y-6 text-center">
                <div className="bg-primary-container/10 border border-primary-container rounded-lg p-6">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">
                        mark_email_read
                    </span>
                    <h3 className="text-lg font-semibold text-on-surface mt-3">
                        Check your email
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2">
                        We&apos;ve sent a confirmation link to{" "}
                        <strong>{email}</strong>. Please verify your account
                        before signing in.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/login")}
                    className="w-full bg-primary text-on-primary py-4 rounded-lg font-medium hover:bg-primary-container transition-colors shadow-sm"
                >
                    Go to Sign In
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSignUp} className="space-y-6">
            {error && (
                <div className="bg-error-container text-on-error-container text-sm p-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Full Name */}
            <div className="space-y-1">
                <label
                    htmlFor="full-name"
                    className="text-sm font-medium text-on-surface block"
                >
                    Full Name
                </label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
                        person
                    </span>
                    <input
                        id="full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                    />
                </div>
            </div>

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
                        placeholder="name@organization.org"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                    />
                </div>
            </div>

            {/* Parish / Organization */}
            <div className="space-y-1">
                <label
                    htmlFor="parish"
                    className="text-sm font-medium text-on-surface block"
                >
                    Parish / Organization
                </label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
                        church
                    </span>
                    <input
                        id="parish"
                        type="text"
                        value={parish}
                        onChange={(e) => setParish(e.target.value)}
                        placeholder="St. Mary's Cathedral"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                    />
                </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
                <label
                    htmlFor="role"
                    className="text-sm font-medium text-on-surface block"
                >
                    Role Selection
                </label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
                        badge
                    </span>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base appearance-none"
                    >
                        <option value="" disabled>
                            Select your official role
                        </option>
                        <option value="parish">Parish Coordinator</option>
                        <option value="deanery">Deanery Coordinator</option>
                        <option value="administrator">
                            Regional Administrator
                        </option>
                        <option value="staff">Administrative Staff</option>
                    </select>
                </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
                <label
                    htmlFor="password"
                    className="text-sm font-medium text-on-surface block"
                >
                    Password
                </label>
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">
                            {showPassword ? "visibility_off" : "visibility"}
                        </span>
                    </button>
                </div>
                <p className="text-xs text-on-surface-variant/70 mt-1 italic">
                    Minimum 8 characters with specialized symbols.
                </p>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container text-on-primary text-sm font-medium py-4 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <span className="animate-spin h-5 w-5 border-2 border-on-primary border-t-transparent rounded-full" />
                        <span>Creating Account...</span>
                    </>
                ) : (
                    <>
                        <span>Create Account</span>
                        <span className="material-symbols-outlined text-lg">
                            person_add
                        </span>
                    </>
                )}
            </button>
        </form>
    );
}
