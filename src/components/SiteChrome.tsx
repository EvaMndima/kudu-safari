import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function Diamond({ size = "size-9", letter = "K" }: { size?: string; letter?: string }) {
  return (
    <div className={`${size} rotate-45 grid place-items-center border border-gold`}>
      <span className="-rotate-45 font-display text-sm text-gold">{letter}</span>
    </div>
  );
}

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-gold/25">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <Diamond />
          <div>
            <p className="font-display text-sm leading-none tracking-[0.35em] text-bone">KUDU</p>
            <p className="mt-1 text-[9px] tracking-[0.4em] text-gold/70">SAFARI</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-xs tracking-[0.2em] text-bone/70 md:flex">
          <Link to="/" hash="trips" className="hover:text-gold">
            TRIPS
          </Link>
          <Link to="/about" className="hover:text-gold">
            THE COMPANY
          </Link>
          {signedIn ? (
            <Link to="/dashboard" className="hover:text-gold">
              CONSOLE
            </Link>
          ) : (
            <Link to="/auth" className="hover:text-gold">
              OPERATOR
            </Link>
          )}
        </nav>
        {signedIn ? (
          <button
            onClick={signOut}
            className="border border-gold/50 px-5 py-2.5 text-xs tracking-[0.2em] text-gold transition hover:bg-gold hover:text-ink"
          >
            SIGN OUT
          </button>
        ) : (
          <Link
            to="/auth"
            className="border border-goldlight bg-goldlight px-5 py-2.5 text-xs tracking-[0.2em] text-ink transition hover:bg-transparent hover:text-goldlight"
          >
            SIGN IN
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-6 border-t border-gold/20">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 md:flex-row">
        <p className="font-display text-sm tracking-[0.3em] text-bone/70">KUDU SAFARI</p>
        <p className="text-[10px] tracking-[0.25em] text-gold/50">SERENGETI · TANZANIA · MMXXV</p>
      </div>
    </footer>
  );
}

export function Ornament() {
  return (
    <div className="mx-auto my-4 flex max-w-5xl items-center justify-center gap-4">
      <span className="h-px w-28 bg-gold/40" />
      <span className="size-2 rotate-45 border border-gold/70" />
      <span className="h-px w-28 bg-gold/40" />
    </div>
  );
}
