// src/app/(auth)/layout.tsx
import "../globals.css";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
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
