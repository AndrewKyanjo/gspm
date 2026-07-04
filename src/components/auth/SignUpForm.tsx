// src/components/auth/SignUpForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/features/auth/actions";
import {
  ROLES_BY_LEVEL,
  ROLE_LABELS,
  LEVEL_LABELS,
  SELF_REGISTERABLE_LEVELS,
} from "@/lib/permissions/roles";
import type { AppRole } from "@/types/roles";
import type { HierarchyLevel, HierarchyOptions } from "@/types/hierarchy";

export default function SignUpForm({ hierarchy }: { hierarchy: HierarchyOptions }) {
  const router = useRouter();

  // Personal details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Office / role being requested
  const [level, setLevel] = useState<HierarchyLevel | "">("");
  const [vicariateId, setVicariateId] = useState("");
  const [deaneryId, setDeaneryId] = useState("");
  const [parishId, setParishId] = useState("");
  const [role, setRole] = useState<AppRole | "">("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatUnknownError = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (value instanceof Error && value.message) {
      return value.message;
    }

    return "The server returned an unreadable error. This usually means signup reached the server, but registration setup failed.";
  };

  const roleOptions = level ? ROLES_BY_LEVEL[level] : [];

  const deaneryOptions = useMemo(
    () => hierarchy.deaneries.filter((d) => d.vicariate_id === vicariateId),
    [hierarchy.deaneries, vicariateId]
  );
  const parishOptions = useMemo(
    () => hierarchy.parishes.filter((p) => p.deanery_id === deaneryId),
    [hierarchy.parishes, deaneryId]
  );

  const handleLevelChange = (value: HierarchyLevel | "") => {
    setLevel(value);
    setVicariateId("");
    setDeaneryId("");
    setParishId("");
    setRole("");
  };

  const handleVicariateChange = (value: string) => {
    setVicariateId(value);
    setDeaneryId("");
    setParishId("");
  };

  const handleDeaneryChange = (value: string) => {
    setDeaneryId(value);
    setParishId("");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!level || !role) {
      setError("Please select the office and role you're applying for.");
      return;
    }
    if (!vicariateId) {
      setError("Please select a Vicariate.");
      return;
    }
    if ((level === "deanery" || level === "parish") && !deaneryId) {
      setError("Please select a Deanery.");
      return;
    }
    if (level === "parish" && !parishId) {
      setError("Please select a Parish.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        fullName,
        email,
        phone: phone || undefined,
        title: title || undefined,
        password,
        requestedRole: role,
        requestedLevel: level,
        requestedArchdioceseId: hierarchy.archdioceseId,
        requestedVicariateId: vicariateId || undefined,
        requestedDeaneryId: deaneryId || undefined,
        requestedParishId: parishId || undefined,
      });

      setLoading(false);

      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (error) {
      setLoading(false);
      setError(formatUnknownError(error));
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="bg-primary-container/10 border border-primary-container rounded-lg p-6">
          <span className="material-symbols-outlined text-4xl text-primary mb-2">
            mark_email_read
          </span>
          <h3 className="text-lg font-semibold text-on-surface mt-3">
                Account created
          </h3>
          <p className="text-sm text-on-surface-variant mt-2">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Once verified, an Archdiocese administrator will review your
            registration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface mb-1">
          Request Portal Access
        </h2>
        <p className="text-sm text-on-surface-variant">
          Create your account, then submit a registration request for admin approval.
        </p>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-1">
        <label htmlFor="full-name" className="text-sm font-medium text-on-surface block">
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

      {/* Phone (optional) */}
      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-medium text-on-surface block">
          Phone <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
            call
          </span>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+256 700 000000"
            className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
          />
        </div>
      </div>

      <div className="h-px bg-outline-variant" />

      {/* Level */}
      <div className="space-y-1">
        <label htmlFor="level" className="text-sm font-medium text-on-surface block">
          Which office are you applying for?
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
            account_tree
          </span>
          <select
            id="level"
            value={level}
            onChange={(e) => handleLevelChange(e.target.value as HierarchyLevel | "")}
            required
            className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base appearance-none"
          >
            <option value="" disabled>
              Select a level
            </option>
            {SELF_REGISTERABLE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {LEVEL_LABELS[lvl]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vicariate */}
      {level && (
        <div className="space-y-1">
          <label htmlFor="vicariate" className="text-sm font-medium text-on-surface block">
            Vicariate
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
              church
            </span>
            <select
              id="vicariate"
              value={vicariateId}
              onChange={(e) => handleVicariateChange(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base appearance-none"
            >
              <option value="" disabled>
                Select a Vicariate
              </option>
              {hierarchy.vicariates.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Deanery */}
      {(level === "deanery" || level === "parish") && vicariateId && (
        <div className="space-y-1">
          <label htmlFor="deanery" className="text-sm font-medium text-on-surface block">
            Deanery
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
              domain
            </span>
            <select
              id="deanery"
              value={deaneryId}
              onChange={(e) => handleDeaneryChange(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base appearance-none"
            >
              <option value="" disabled>
                Select a Deanery
              </option>
              {deaneryOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Parish */}
      {level === "parish" && deaneryId && (
        <div className="space-y-1">
          <label htmlFor="parish" className="text-sm font-medium text-on-surface block">
            Parish
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
              location_city
            </span>
            <select
              id="parish"
              value={parishId}
              onChange={(e) => setParishId(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base appearance-none"
            >
              <option value="" disabled>
                Select a Parish
              </option>
              {parishOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Role */}
      {level && (
        <div className="space-y-1">
          <label htmlFor="role" className="text-sm font-medium text-on-surface block">
            Role
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
              badge
            </span>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              required
              className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base appearance-none"
            >
              <option value="" disabled>
                Select your role
              </option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Title (optional) */}
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-on-surface block">
          Title / Position <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Parish Priest, Coordinator"
          className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
        />
      </div>

      <div className="h-px bg-outline-variant" />

      {/* Password */}
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-on-surface block">
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
            minLength={8}
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
          Minimum 8 characters.
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
            <span className="material-symbols-outlined text-lg">person_add</span>
          </>
        )}
      </button>

      <p className="text-center text-sm text-on-surface-variant">
        Already have an account?{" "}
        <a href="/login" className="text-primary hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
