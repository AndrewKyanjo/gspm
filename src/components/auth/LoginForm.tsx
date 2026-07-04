"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithPassword, type SignInState } from "@/features/auth/actions";

const initialState: SignInState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-sm font-medium text-on-primary shadow-sm transition-all hover:bg-primary-container hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
          <span>Authenticating...</span>
        </>
      ) : (
        <>
          <span>Sign In</span>
          <span className="material-symbols-outlined text-lg">login</span>
        </>
      )}
    </button>
  );
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useActionState(signInWithPassword, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-on-surface">
          Email Address
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-outline">
            mail
          </span>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="name@archdiocese.org"
            required
            className="w-full rounded-lg border border-outline-variant bg-surface py-3 pl-11 pr-4 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-on-surface">
            Password
          </label>
          <a href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-outline">
            lock
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="********"
            required
            className="w-full rounded-lg border border-outline-variant bg-surface py-3 pl-11 pr-11 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-lg">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="remember"
          type="checkbox"
          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
        />
        <label htmlFor="remember" className="ml-2 text-sm text-on-surface-variant">
          Remember me for 30 days
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}
