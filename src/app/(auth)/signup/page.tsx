// app/(auth)/signup/page.tsx
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justwify-center p-4 bg-surface">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
        <SignUpForm />
      </div>
    </div>
  );
}