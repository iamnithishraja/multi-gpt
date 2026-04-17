"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const AI_MODELS = ["GPT-4o", "Claude 3.5", "Gemini 1.5", "Llama 3.1", "Mistral"];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await signUp.email({
          email,
          password,
          name,
          // better-auth stores name, email, image in the `users` collection automatically
        });
        if (res.error) throw new Error(res.error.message);
      } else {
        const res = await signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message);
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      // Google OAuth syncs name + profile picture (image) into the `users` collection automatically
      await signIn.social({ provider: "google", callbackURL: "/" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex overflow-hidden">

      {/* ── Ambient glow orbs ── */}
      <div className="pointer-events-none absolute -top-40 -left-24 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.18)_0%,transparent_70%)] blur-[120px] animate-[orbFloat_8s_ease-in-out_infinite_alternate]" />
      <div className="pointer-events-none absolute -bottom-24 right-72 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.10)_0%,transparent_70%)] blur-[120px] animate-[orbFloat_10s_ease-in-out_infinite_alternate-reverse]" />

      {/* ── Grid pattern ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ════════════════════════════════
          LEFT — Brand / Showcase panel
      ════════════════════════════════ */}
      <div className="relative z-10 hidden lg:flex flex-1 flex-col justify-between p-12 border-r border-[rgba(201,168,76,0.12)]">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L4 7v14l10 5 10-5V7L14 2z" stroke="#C9A84C" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M14 2v19M4 7l10 5 10-5" stroke="#C9A84C" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[#e8d5a0] font-semibold text-lg tracking-tight">MultiModel</span>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-10 mt-16">
          <div>
            <h1 className="text-5xl xl:text-6xl font-bold text-[#f0e8d0] leading-[1.1] tracking-tight">
              One Interface.<br />
              <span className="bg-gradient-to-r from-[#C9A84C] via-[#E8D08A] to-[#C9A84C] bg-clip-text text-transparent">
                Every AI Model.
              </span>
            </h1>
            <p className="mt-5 text-base text-[rgba(240,232,208,0.45)] leading-relaxed max-w-md">
              Chat with the world&apos;s leading AI models side-by-side — compare, contrast, and unlock new levels of productivity.
            </p>
          </div>

          {/* Model chips */}
          <div className="flex flex-wrap gap-2">
            {AI_MODELS.map((model, i) => (
              <div
                key={model}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.07)] text-[#C9A84C] text-sm font-medium animate-[chipIn_0.5s_ease_both]"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_6px_#C9A84C] animate-[pulseDot_2s_ease-in-out_infinite]" />
                {model}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            {[
              { num: "10+", label: "AI Models" },
              { num: "50K+", label: "Users" },
              { num: "∞", label: "Possibilities" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-9 bg-[rgba(201,168,76,0.15)]" />}
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] bg-clip-text text-transparent">
                    {s.num}
                  </span>
                  <span className="text-xs text-[rgba(240,232,208,0.4)] font-medium uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat preview card */}
        <div className="rounded-2xl border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.04)] p-5 flex flex-col gap-3 animate-[slideUp_0.8s_ease_0.3s_both]">
          <p className="text-xs text-[rgba(240,232,208,0.35)] font-medium uppercase tracking-widest mb-1">Live Preview</p>

          <div className="self-end max-w-[80%] bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.25)] rounded-xl px-3.5 py-2.5 text-sm text-[#e8d5a0]">
            Compare Claude vs GPT-4o for my essay
          </div>

          <div className="self-start max-w-[80%] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-sm text-[rgba(240,232,208,0.7)] flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider">Claude 3.5</span>
            Here&apos;s my take on the key structural points…
          </div>

          <div className="self-end max-w-[80%] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-sm text-[rgba(240,232,208,0.7)] flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#74aa9c] uppercase tracking-wider">GPT-4o</span>
            Let me approach this from a different angle…
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT — Auth form panel
      ════════════════════════════════ */}
      <div className="relative z-10 flex items-center justify-center w-full lg:w-[480px] px-6 py-12">
        <div className="w-full max-w-[400px] flex flex-col gap-5 animate-[fadeSlide_0.6s_ease_both]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L4 7v14l10 5 10-5V7L14 2z" stroke="#C9A84C" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M14 2v19M4 7l10 5 10-5" stroke="#C9A84C" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[#e8d5a0] font-semibold tracking-tight">MultiModel</span>
          </div>

          {/* Tab switcher */}
          <div className="relative flex bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.15)] rounded-xl p-1">
            <button
              id="tab-signin"
              onClick={() => { setMode("signin"); setError(""); }}
              className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                mode === "signin" ? "text-[#0a0a0a]" : "text-[rgba(240,232,208,0.4)] hover:text-[rgba(240,232,208,0.7)]"
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              onClick={() => { setMode("signup"); setError(""); }}
              className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                mode === "signup" ? "text-[#0a0a0a]" : "text-[rgba(240,232,208,0.4)] hover:text-[rgba(240,232,208,0.7)]"
              }`}
            >
              Sign Up
            </button>
            {/* Sliding indicator */}
            <div
              className="absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] rounded-[9px] shadow-[0_2px_12px_rgba(201,168,76,0.4)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ left: "4px", transform: mode === "signup" ? "translateX(100%)" : "translateX(0%)" }}
            />
          </div>

          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-[#f0e8d0] tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1.5 text-sm text-[rgba(240,232,208,0.45)] leading-relaxed">
              {mode === "signin"
                ? "Sign in to access all your AI conversations."
                : "Join thousands of professionals using MultiModel."}
            </p>
          </div>

          {/* Google button */}
          <button
            id="btn-google-signin"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full py-3.5 px-5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-[#f0e8d0] text-[15px] font-medium cursor-pointer transition-all duration-200 hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.3 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.3 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.3 0-9.7-2.9-11.3-7L6 33.8C9.3 39.6 16.1 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6.2 5.2C41.5 35.1 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[rgba(201,168,76,0.12)]" />
            <span className="text-xs text-[rgba(240,232,208,0.3)] font-medium whitespace-nowrap">or continue with email</span>
            <div className="flex-1 h-px bg-[rgba(201,168,76,0.12)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">

            {/* Name — signup only */}
            {mode === "signup" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="field-name" className="text-xs font-medium text-[rgba(240,232,208,0.55)] uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[rgba(201,168,76,0.5)] pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    id="field-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.15)] rounded-xl text-[#f0e8d0] text-[15px] placeholder-[rgba(240,232,208,0.22)] outline-none transition-all duration-200 focus:border-[rgba(201,168,76,0.5)] focus:bg-[rgba(201,168,76,0.07)] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.1)]"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="field-email" className="text-xs font-medium text-[rgba(240,232,208,0.55)] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[rgba(201,168,76,0.5)] pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  id="field-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.15)] rounded-xl text-[#f0e8d0] text-[15px] placeholder-[rgba(240,232,208,0.22)] outline-none transition-all duration-200 focus:border-[rgba(201,168,76,0.5)] focus:bg-[rgba(201,168,76,0.07)] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.1)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="field-password" className="text-xs font-medium text-[rgba(240,232,208,0.55)] uppercase tracking-wider">
                  Password
                </label>
                {mode === "signin" && (
                  <a href="/forgot-password" className="text-xs text-[rgba(201,168,76,0.6)] hover:text-[#C9A84C] transition-colors">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[rgba(201,168,76,0.5)] pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="field-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "Min. 8 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-11 py-3 bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.15)] rounded-xl text-[#f0e8d0] text-[15px] placeholder-[rgba(240,232,208,0.22)] outline-none transition-all duration-200 focus:border-[rgba(201,168,76,0.5)] focus:bg-[rgba(201,168,76,0.07)] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.1)]"
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[rgba(201,168,76,0.45)] hover:text-[#C9A84C] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-center gap-2.5 px-3.5 py-3 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-xl text-[#fca5a5] text-sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-email-submit"
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A84C] via-[#E8D08A] to-[#C9A84C] bg-[length:200%_auto] text-[#0a0a0a] text-[15px] font-bold cursor-pointer tracking-wide shadow-[0_4px_20px_rgba(201,168,76,0.35)] transition-all duration-300 hover:bg-right-center hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,168,76,0.45)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-[rgba(10,10,10,0.3)] border-t-[#0a0a0a] rounded-full animate-spin" />
              ) : (
                mode === "signin" ? "Sign In →" : "Create Account →"
              )}
            </button>
          </form>

          {/* Features list — sign up mode */}
          {mode === "signup" && (
            <ul className="flex flex-col gap-2">
              {[
                "10+ AI models in one place",
                "Side-by-side model comparisons",
                "Your conversations, saved securely",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[rgba(240,232,208,0.4)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* Terms */}
          <p className="text-center text-xs text-[rgba(240,232,208,0.28)] leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-[rgba(201,168,76,0.55)] hover:text-[#C9A84C] transition-colors">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="text-[rgba(201,168,76,0.55)] hover:text-[#C9A84C] transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
