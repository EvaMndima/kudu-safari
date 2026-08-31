import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listTrips = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, slug, title, region, days, price_cents, deposit_pct, summary, image_key")
    .order("days", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getTrip = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: trip, error } = await supabase
      .from("trips")
      .select("id, slug, title, region, days, price_cents, deposit_pct, summary, image_key")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!trip) return null;

    const { data: departures, error: depError } = await supabase
      .from("departures")
      .select("id, departs_on, seats_total, seats_taken")
      .eq("trip_id", trip.id)
      .order("departs_on", { ascending: true });
    if (depError) throw new Error(depError.message);

    return { trip, departures: departures ?? [] };
  });

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        departureId: z.string().uuid(),
        guestName: z.string().min(2).max(120),
        guestEmail: z.string().email(),
        guests: z.number().int().min(1).max(8),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();

    const { data: departure, error: depError } = await supabase
      .from("departures")
      .select("id, seats_total, seats_taken, trip_id, trips(id, operator_id, price_cents, deposit_pct)")
      .eq("id", data.departureId)
      .maybeSingle();
    if (depError) throw new Error(depError.message);
    if (!departure || !departure.trips) throw new Error("That departure is no longer available.");

    const seatsLeft = departure.seats_total - departure.seats_taken;
    if (seatsLeft < data.guests) {
      throw new Error(`Only ${seatsLeft} seat(s) left on that departure.`);
    }

    const trip = departure.trips as unknown as {
      id: string;
      operator_id: string;
      price_cents: number;
      deposit_pct: number;
    };
    const depositCents = Math.round((trip.price_cents * trip.deposit_pct) / 100) * data.guests;

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        operator_id: trip.operator_id,
        trip_id: trip.id,
        departure_id: departure.id,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        guests: data.guests,
        deposit_cents: depositCents,
        status: "pending",
      })
      .select("reference, deposit_cents, guests")
      .single();
    if (error) throw new Error(error.message);

    return booking;
  });
