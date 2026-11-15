"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";

/** Asks for the admin password in the app instead of a browser auth dialog. */
export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  /** Only ever bounce back inside /admin, never to an outside URL. */
  function destination() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/admin") && !next.startsWith("/admin/login")
      ? next
      : "/admin";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || pending) return;

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not sign in.");
        return;
      }
      router.replace(destination());
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center py-10">
      <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
          <KeyRound className="size-5" />
        </span>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">Admin access</h1>
        <p className="mt-1 text-sm text-muted">
          Enter the admin password to open the database console.
        </p>

        {!configured ? (
          <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-300">
            This deployment has no <code className="font-mono">ADMIN_PASSWORD</code> set, so
            nobody can sign in yet. Add it to the project&apos;s environment variables and
            redeploy.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-accent"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!password || pending || !configured}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending ? "Checking…" : "Unlock admin"}
          </button>
        </form>
      </div>

      <Link
        href="/"
        className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs text-muted transition-colors hover:text-slate-200"
      >
        <ArrowLeft className="size-3.5" /> Back to tasks
      </Link>
    </div>
  );
}
