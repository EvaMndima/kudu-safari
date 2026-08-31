import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listTrips } from "@/lib/trips.functions";
import { tripImage, money } from "@/lib/trip-images";
import { Ornament } from "@/components/SiteChrome";

const tripsQuery = queryOptions({
  queryKey: ["trips"],
  queryFn: () => listTrips(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kudu Safari — Journeys Beyond the Golden Horizon" },
      {
        name: "description",
        content:
          "Private, small-group safaris across the Serengeti, Ngorongoro and the Maasai Mara. Choose your expedition, pick your dates, reserve with a deposit.",
      },
      { property: "og:title", content: "Kudu Safari — Journeys Beyond the Golden Horizon" },
      {
        property: "og:description",
        content: "Small-group safaris. Pick your dates and reserve your place with a deposit.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(tripsQuery),
  component: Home,
  errorComponent: () => (
    <p className="py-24 text-center text-sm text-bone/55">
      We couldn't load the expeditions just now. Please refresh.
    </p>
  ),
  notFoundComponent: () => <p className="py-24 text-center text-sm text-bone/55">Not found.</p>,
});

function Home() {
  const { data: trips } = useSuspenseQuery(tripsQuery);

  return (
    <main className="deco deco-fade">
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-10 text-center">
        <p className="text-[11px] tracking-[0.5em] text-gold">EST. MMXIV · SERENGETI</p>
        <h1 className="mt-6 font-display text-5xl leading-[1.05] text-bone md:text-7xl">
          JOURNEYS BEYOND THE GOLDEN HORIZON
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-light tracking-wide text-bone/55">
          Private, small-group safaris across the Serengeti. Choose your expedition, select your
          dates, and secure your place with a refundable deposit.
        </p>
        <div className="mt-9 flex items-center justify-center gap-4">
          <a
            href="#trips"
            className="border border-goldlight bg-goldlight px-7 py-3.5 text-xs tracking-[0.25em] text-ink transition hover:bg-transparent hover:text-goldlight"
          >
            EXPLORE TRIPS
          </a>
          <Link
            to="/auth"
            className="border border-gold/50 px-7 py-3.5 text-xs tracking-[0.25em] text-gold transition hover:bg-gold hover:text-ink"
          >
            OPERATOR LOGIN
          </Link>
        </div>
      </section>

      <Ornament />

      <section id="trips" className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <p className="text-[10px] tracking-[0.45em] text-gold/80">THE COLLECTION</p>
          <h2 className="mt-3 font-display text-3xl text-bone md:text-4xl">
            SIGNATURE EXPEDITIONS
          </h2>
        </div>

        <div className="grid gap-7 md:grid-cols-3">
          {trips.map((trip, i) => (
            <article key={trip.id} className="group border border-gold/25 bg-ink2/70">
              <div className="relative">
                <img
                  src={tripImage(trip.image_key)}
                  alt={`${trip.title} — ${trip.region}`}
                  width={1024}
                  height={768}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-goldlight px-3 py-1 text-[9px] tracking-[0.2em] text-ink">
                  {trip.days} DAYS
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl text-bone">{trip.title}</h3>
                  <span className="text-sm tracking-wide text-goldlight">
                    {money(trip.price_cents)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed font-light text-bone/50">
                  {trip.summary}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-gold/20 pt-4">
                  <span className="text-[10px] tracking-[0.25em] text-gold/70">
                    {trip.deposit_pct}% DEPOSIT TO RESERVE
                  </span>
                  <Link
                    to="/trips/$slug"
                    params={{ slug: trip.slug }}
                    className="border-b border-gold/40 pb-0.5 text-[10px] tracking-[0.2em] text-gold group-hover:border-gold"
                  >
                    RESERVE
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
