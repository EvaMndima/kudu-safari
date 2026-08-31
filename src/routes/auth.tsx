import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { claimOperator } from "@/lib/operator.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Operator Sign In — Kudu Safari" },
      {
        name: "description",
        content:
          "Operators sign in to the Kudu Safari console to review reservations and mark them confirmed.",
      },
      { property: "og:title", content: "Operator Sign In — Kudu Safari" },
      {
        property: "og:description",
        content: "Private console for Kudu Safari operators and their own reservations.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const claim = useServerFn(claimOperator);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
        await claim({ data: { code } });
        navigate({ to: "/dashboard" });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (code.trim()) {
        try {
          await claim({ data: { code } });
        } catch (claimError) {
          toast.error(
            claimError instanceof Error ? claimError.message : "That access code didn't work.",
          );
        }
      }
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="deco deco-fade">
      <section className="mx-auto max-w-md px-6 py-20">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.45em] text-gold/80">OPERATOR CONSOLE</p>
          <h1 className="mt-3 font-display text-3xl text-bone">
            {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm font-light text-bone/50">
            Operators see only their own reservations. Use your company access code the first time
            you sign in to link your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 border border-gold/25 bg-ink2/70 p-7">
          <div>
            <label className="mb-2 block text-[10px] tracking-[0.25em] text-gold/80">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gold/30 bg-ink px-4 py-3 text-sm text-bone/90 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] tracking-[0.25em] text-gold/80">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gold/30 bg-ink px-4 py-3 text-sm text-bone/90 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] tracking-[0.25em] text-gold/80">
              OPERATOR ACCESS CODE {mode === "signin" ? "(IF NOT YET LINKED)" : ""}
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="KUDU-MARA"
              required={mode === "signup"}
              className="w-full border border-gold/30 bg-ink px-4 py-3 text-sm tracking-[0.2em] text-bone/90 outline-none placeholder:text-bone/25 focus:border-gold"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full border border-goldlight bg-goldlight px-6 py-3 text-[11px] tracking-[0.25em] text-ink transition hover:bg-transparent hover:text-goldlight disabled:opacity-40"
          >
            {busy ? "WORKING…" : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-center text-[10px] tracking-[0.2em] text-gold/70 hover:text-gold"
          >
            {mode === "signin" ? "NO ACCOUNT YET? CREATE ONE" : "ALREADY REGISTERED? SIGN IN"}
          </button>
        </form>
      </section>
    </main>
  );
}
