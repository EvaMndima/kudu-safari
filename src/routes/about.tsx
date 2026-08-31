import { createFileRoute, Link } from "@tanstack/react-router";
import { Ornament } from "@/components/SiteChrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "The Company — Kudu Safari" },
      {
        name: "description",
        content:
          "Kudu Safari runs small-group expeditions with independent operators. Each operator keeps a private console for their own reservations.",
      },
      { property: "og:title", content: "The Company — Kudu Safari" },
      {
        property: "og:description",
        content: "Small-group expeditions run by independent operators, each with a private console.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <main className="deco deco-fade">
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-8 text-center">
        <p className="text-[11px] tracking-[0.5em] text-gold">THE COMPANY</p>
        <h1 className="mt-6 font-display text-4xl leading-tight text-bone md:text-5xl">
          A SMALL HOUSE, RUN BY GUIDES
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-light tracking-wide text-bone/55">
          We keep departures small, camps quiet, and the driving slow. Every expedition is led by an
          independent operator who knows the ground it crosses.
        </p>
      </section>

      <Ornament />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-7 md:grid-cols-3">
          <div className="border border-gold/15 bg-ink2/40 p-6 text-center md:col-span-1">
            <div className="mx-auto grid size-11 rotate-45 place-items-center border border-gold">
              <span className="-rotate-45 font-display text-lg text-gold">K</span>
            </div>
            <h2 className="mt-5 font-display text-lg text-bone">Separate by Operator</h2>
            <p className="mt-3 text-sm leading-relaxed font-light text-bone/50">
              Each operator signs in to a private console and sees only their own reservations.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-block border border-gold/50 px-5 py-2.5 text-[10px] tracking-[0.25em] text-gold transition hover:bg-gold hover:text-ink"
            >
              OPERATOR LOGIN
            </Link>
          </div>

          <div className="border border-gold/25 bg-ink2/70 p-6 md:col-span-2">
            <p className="text-[10px] tracking-[0.35em] text-gold/80">HOW A RESERVATION WORKS</p>
            <div className="mt-4 divide-y divide-gold/15">
              <div className="flex items-baseline gap-5 py-4">
                <span className="font-display text-gold">01</span>
                <p className="text-sm font-light text-bone/70">
                  Choose an expedition and a departure date from the current season.
                </p>
              </div>
              <div className="flex items-baseline gap-5 py-4">
                <span className="font-display text-gold">02</span>
                <p className="text-sm font-light text-bone/70">
                  Reserve your seats with a deposit of the trip price — the balance falls due 60 days
                  before departure.
                </p>
              </div>
              <div className="flex items-baseline gap-5 py-4">
                <span className="font-display text-gold">03</span>
                <p className="text-sm font-light text-bone/70">
                  Your operator reviews the reservation and marks it confirmed, then sends the
                  balance schedule.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
