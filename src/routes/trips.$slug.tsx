import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getTrip, createBooking } from "@/lib/trips.functions";
import { tripImage, money } from "@/lib/trip-images";

const tripQuery = (slug: string) =>
  queryOptions({
    queryKey: ["trip", slug],
    queryFn: () => getTrip({ data: { slug } }),
  });

export const Route = createFileRoute("/trips/$slug")({
  head: ({ params }) => {
    const title = params.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${title} — Kudu Safari` },
        {
          name: "description",
          content: `Departure dates, deposit and reservation details for the ${title} expedition with Kudu Safari.`,
        },
        { property: "og:title", content: `${title} — Kudu Safari` },
        {
          property: "og:description",
          content: `Pick a departure date for ${title} and reserve your place with a deposit.`,
        },
      ],
    };
  },
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(tripQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  component: TripPage,
  errorComponent: () => (
    <p className="py-24 text-center text-sm text-bone/55">
      We couldn't load this expedition. Please refresh.
    </p>
  ),
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <p className="font-display text-2xl text-bone">No such expedition</p>
      <Link to="/" className="mt-4 inline-block text-xs tracking-[0.25em] text-gold">
        BACK TO THE COLLECTION
      </Link>
    </div>
  ),
});

type Confirmation = { reference: string; deposit_cents: number; guests: number };

function TripPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(tripQuery(slug));
  const trip = data!.trip;
  const departures = data!.departures;

  const bookable = useMemo(
    () => departures.filter((d) => d.seats_total - d.seats_taken > 0),
    [departures],
  );

  const [departureId, setDepartureId] = useState(bookable[0]?.id ?? "");
  const [guests, setGuests] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const submit = useServerFn(createBooking);

  const selected = departures.find((d) => d.id === departureId);
  const seatsLeft = selected ? selected.seats_total - selected.seats_taken : 0;
  const depositCents = Math.round((trip.price_cents * trip.deposit_pct) / 100) * guests;

  async function reserve(e: React.FormEvent) {
    e.preventDefault();
    if (!departureId) return;
    setSaving(true);
    try {
      const booking = await submit({
        data: { departureId, guestName: name, guestEmail: email, guests },
      });
      setConfirmation(booking as Confirmation);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't hold that reservation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="deco deco-fade">
      <section className="mx-auto max-w-6xl px-6 pt-12">
        <Link to="/" className="text-[10px] tracking-[0.25em] text-gold/70 hover:text-gold">
          ← THE COLLECTION
        </Link>
        <div className="mt-6 grid gap-7 md:grid-cols-[1.2fr_1fr] md:items-center">
          <img
            src={tripImage(trip.image_key)}
            alt={`${trip.title} — ${trip.region}`}
            width={1024}
            height={768}
            className="aspect-[4/3] w-full border border-gold/25 object-cover"
          />
          <div>
            <p className="text-[10px] tracking-[0.45em] text-gold/80">
              {trip.region.toUpperCase()} · {trip.days} DAYS
            </p>
            <h1 className="mt-4 font-display text-4xl text-bone md:text-5xl">{trip.title}</h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed font-light tracking-wide text-bone/55">
              {trip.summary}
            </p>
            <p className="mt-6 font-display text-2xl text-goldlight">
              {money(trip.price_cents)}
              <span className="ml-2 font-body text-[10px] tracking-[0.25em] text-gold/70">
                PER GUEST
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-8 text-center">
          <p className="text-[10px] tracking-[0.45em] text-gold/80">RESERVE</p>
          <h2 className="mt-3 font-display text-3xl text-bone">SECURE YOUR EXPEDITION</h2>
        </div>

        {confirmation ? (
          <div className="border border-gold/25 bg-ink2/70 p-7 text-center">
            <div className="mx-auto grid size-11 rotate-45 place-items-center border border-gold">
              <span className="-rotate-45 font-display text-lg text-gold">✓</span>
            </div>
            <h3 className="mt-5 font-display text-2xl text-bone">Your place is held</h3>
            <p className="mx-auto mt-3 max-w-md text-sm font-light text-bone/55">
              Reference <span className="text-goldlight">{confirmation.reference}</span>. A deposit of{" "}
              {money(confirmation.deposit_cents)} secures {confirmation.guests} guest(s). Your
              operator confirms the reservation and sends the deposit link within one working day.
            </p>
            <Link
              to="/"
              className="mt-7 inline-block border border-goldlight bg-goldlight px-6 py-3 text-[11px] tracking-[0.25em] text-ink transition hover:bg-transparent hover:text-goldlight"
            >
              BACK TO TRIPS
            </Link>
          </div>
        ) : (
          <form
            onSubmit={reserve}
            className="grid gap-7 border border-gold/25 bg-ink2/70 p-7 md:grid-cols-[1fr_auto] md:items-end"
          >
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-gold/80">
                  DEPARTURE DATE
                </label>
                <select
                  value={departureId}
                  onChange={(e) => setDepartureId(e.target.value)}
                  className="w-full border border-gold/30 bg-ink px-4 py-3 text-sm text-bone/90 outline-none focus:border-gold"
                  required
                >
                  {bookable.length === 0 && <option value="">No dates left this season</option>}
                  {bookable.map((d) => (
                    <option key={d.id} value={d.id}>
                      {new Date(`${d.departs_on}T00:00:00`).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · {d.seats_total - d.seats_taken} seats left
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-gold/80">
                  GUESTS
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full border border-gold/30 bg-ink px-4 py-3 text-sm text-bone/90 outline-none focus:border-gold"
                >
                  {Array.from({ length: Math.max(seatsLeft, 1) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} guest{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-gold/80">
                  YOUR NAME
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full border border-gold/30 bg-ink px-4 py-3 text-sm text-bone/90 outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] tracking-[0.25em] text-gold/80">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gold/30 bg-ink px-4 py-3 text-sm text-bone/90 outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-[10px] tracking-[0.25em] text-gold/80">DEPOSIT DUE</p>
              <p className="mt-1 font-display text-3xl text-goldlight">{money(depositCents)}</p>
              <p className="mt-1 text-[10px] tracking-[0.2em] text-bone/40">
                {trip.deposit_pct}% OF {money(trip.price_cents)} × {guests}
              </p>
              <button
                type="submit"
                disabled={saving || bookable.length === 0}
                className="mt-4 block w-full border border-goldlight bg-goldlight px-6 py-3 text-center text-[11px] tracking-[0.25em] text-ink transition hover:bg-transparent hover:text-goldlight disabled:opacity-40"
              >
                {saving ? "HOLDING…" : "RESERVE THIS DEPARTURE"}
              </button>
              <p className="mt-3 text-[10px] tracking-[0.15em] text-bone/35">
                DEPOSIT PAYABLE ON CONFIRMATION
              </p>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
