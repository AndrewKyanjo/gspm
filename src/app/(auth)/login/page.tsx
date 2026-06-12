// src/app/(auth)/login/page.tsx
import LoginForm from "@/components/auth/LoginForm";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
    return (
        <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex flex-col items-center mb-8 lg:hidden">
                <span className="material-symbols-outlined text-primary text-5xl mb-2">
                    church
                </span>
                <h2 className="font-headline-md text-headline-md text-primary">
                    GSPM Portal
                </h2>
            </div>

            {/* Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 login-card">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-on-surface mb-2">
                        Welcome to your Portal
                    </h2>
                    <p className="text-on-surface-variant">
                        Sign in to access your parish or deanery operations.
                    </p>
                </div>

                {/* Email/password form */}
                <LoginForm />

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-outline-variant" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-on-surface-variant">
                            or
                        </span>
                    </div>
                </div>

                {/* Google sign in */}
                <GoogleSignInButton />

                {/* Footer links */}
                <div className="mt-8 pt-6 border-t border-outline-variant flex flex-wrap justify-center gap-6">
                    <a
                        href="#"
                        className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-base">
                            public
                        </span>
                        Public Site
                    </a>
                    <a
                        href="#"
                        className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-base">
                            support_agent
                        </span>
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
