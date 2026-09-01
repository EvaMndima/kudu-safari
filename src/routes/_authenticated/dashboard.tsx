import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getMyOperator, listMyBookings, setBookingStatus } from "@/lib/operator.functions";
import { money } from "@/lib/trip-images";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Operator Console — Kudu Safari" },
      {
        name: "description",
        content: "Review your own reservations and mark deposits confirmed.",
      },
      { property: "og:title", content: "Operator Console — Kudu Safari" },
      { property: "og:description", content: "Your reservations, only yours." },
    ],
  }),
  component: Dashboard,
});

function statusChip(status: string) {
  if (status === "confirmed") {
    return "border border-bone/20 text-bone/50";
  }
  if (status === "cancelled") {
    return "border border-destructive/40 text-destructive";
  }
  return "border border-gold/40 text-gold";
}

function Dashboard() {
  const fetchOperator = useServerFn(getMyOperator);
  const fetchBookings = useServerFn(listMyBookings);
  const updateStatus = useServerFn(setBookingStatus);
  const queryClient = useQueryClient();

  const operator = useQuery({ queryKey: ["my-operator"], queryFn: () => fetchOperator() });
  const bookings = useQuery({ queryKey: ["my-bookings"], queryFn: () => fetchBookings() });

  async function mark(id: string, status: "confirmed" | "cancelled") {
    try {
      await updateStatus({ data: { id, status } });
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      toast.success(status === "confirmed" ? "Booking confirmed." : "Booking cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update that booking.");
    }
  }

  const rows = bookings.data ?? [];
  const initial = operator.data?.name?.charAt(0)?.toUpperCase() ?? "K";

  return (
    <main className="deco deco-fade">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="border border-gold/25 bg-ink2/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/20 pb-4">
            <div>
              <p className="text-[10px] tracking-[0.35em] text-gold/80">OPERATOR CONSOLE</p>
              <p className="mt-1 font-display text-lg text-bone">Your Bookings</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-bone/70">
              <span className="grid size-6 place-items-center border border-gold/40 text-xs text-gold">
                {initial}
              </span>
              {operator.data?.name ?? "NO COMPANY LINKED"}
            </div>
          </div>

          {!operator.isLoading && !operator.data && (
            <p className="py-6 text-sm font-light text-bone/55">
              Your account isn't linked to a company yet. Sign in again with your operator access
              code to link it —{" "}
              <Link to="/auth" className="text-gold">
                go to sign in
              </Link>
              .
            </p>
          )}

          {bookings.isLoading && (
            <p className="py-6 text-sm font-light text-bone/50">Loading reservations…</p>
          )}

          {!bookings.isLoading && operator.data && rows.length === 0 && (
            <p className="py-6 text-sm font-light text-bone/50">
              No reservations yet. New requests appear here as soon as guests reserve a departure.
            </p>
          )}

          <div className="mt-2 divide-y divide-gold/15">
            {rows.map((b) => {
              const trip = (b.trips as unknown as { title: string } | null)?.title ?? "Expedition";
              const departsOn = (b.departures as unknown as { departs_on: string } | null)
                ?.departs_on;
              return (
                <div
                  key={b.id}
                  className="grid items-center gap-4 py-4 md:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div>
                    <p className="text-sm text-bone">
                      {trip}{" "}
                      <span className="ml-2 text-[10px] tracking-[0.2em] text-gold/60">
                        {b.reference}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-bone/45">
                      {b.guest_name} · {b.guests} guest{b.guests > 1 ? "s" : ""} ·{" "}
                      {departsOn
                        ? new Date(`${departsOn}T00:00:00`).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "date TBC"}
                    </p>
                    <p className="mt-0.5 text-xs text-bone/35">{b.guest_email}</p>
                  </div>

                  <span className="text-sm text-goldlight">{money(b.deposit_cents)}</span>

                  <span
                    className={`px-3 py-1 text-center text-[9px] tracking-[0.2em] uppercase ${statusChip(b.status)}`}
                  >
                    {b.status}
                  </span>

                  {b.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => mark(b.id, "confirmed")}
                        className="bg-gold px-4 py-2 text-[10px] tracking-[0.2em] text-ink transition hover:bg-goldlight"
                      >
                        CONFIRM
                      </button>
                      <button
                        onClick={() => mark(b.id, "cancelled")}
                        className="border border-gold/30 px-4 py-2 text-[10px] tracking-[0.2em] text-bone/60 transition hover:border-destructive hover:text-destructive"
                      >
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <span className="px-4 py-2 text-[10px] tracking-[0.2em] text-bone/30">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
