import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** The signed-in user's operator company, if their account is linked to one. */
export const getMyOperator = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("operators")
      .select("id, name")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

/** Bookings belonging to the signed-in operator only (enforced by row policies). */
export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select(
        "id, reference, guest_name, guest_email, guests, deposit_cents, deposit_status, status, created_at, trips(title), departures(departs_on)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Links the signed-in account to an operator company using its access code. */
export const claimOperator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ code: z.string().min(3).max(64) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("operators")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return { ok: true, alreadyLinked: true };

    const code = data.code.trim().toUpperCase();
    const { data: operator, error } = await supabaseAdmin
      .from("operators")
      .select("id, user_id")
      .eq("claim_code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!operator) throw new Error("That access code doesn't match any operator.");
    if (operator.user_id) throw new Error("That access code has already been used.");

    const { error: linkError } = await supabaseAdmin
      .from("operators")
      .update({ user_id: context.userId })
      .eq("id", operator.id)
      .is("user_id", null);
    if (linkError) throw new Error(linkError.message);

    return { ok: true, alreadyLinked: false };
  });
