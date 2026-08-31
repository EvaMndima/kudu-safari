-- OPERATORS
CREATE TABLE public.operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  claim_code text NOT NULL UNIQUE,
  user_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.operators TO authenticated;
GRANT ALL ON public.operators TO service_role;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operators_select_own" ON public.operators FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.current_operator_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.operators WHERE user_id = auth.uid() LIMIT 1;
$$;

-- TRIPS
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  region text NOT NULL,
  days integer NOT NULL,
  price_cents integer NOT NULL,
  deposit_pct integer NOT NULL DEFAULT 20,
  summary text NOT NULL,
  image_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips_public_read" ON public.trips FOR SELECT USING (true);
CREATE POLICY "trips_operator_write" ON public.trips FOR ALL TO authenticated
  USING (operator_id = public.current_operator_id())
  WITH CHECK (operator_id = public.current_operator_id());

-- DEPARTURES
CREATE TABLE public.departures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  departs_on date NOT NULL,
  seats_total integer NOT NULL DEFAULT 6,
  seats_taken integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departures TO authenticated;
GRANT ALL ON public.departures TO service_role;
ALTER TABLE public.departures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departures_public_read" ON public.departures FOR SELECT USING (true);
CREATE POLICY "departures_operator_write" ON public.departures FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.operator_id = public.current_operator_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.operator_id = public.current_operator_id()));

-- BOOKINGS
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT 'KUD-' || lpad((floor(random() * 10000))::int::text, 4, '0'),
  operator_id uuid NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  departure_id uuid NOT NULL REFERENCES public.departures(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  deposit_cents integer NOT NULL,
  deposit_status text NOT NULL DEFAULT 'awaiting_payment',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending','confirmed','cancelled')),
  CONSTRAINT bookings_deposit_status_check CHECK (deposit_status IN ('awaiting_payment','paid','refunded'))
);
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_public_insert" ON public.bookings FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');
CREATE POLICY "bookings_operator_read" ON public.bookings FOR SELECT TO authenticated
  USING (operator_id = public.current_operator_id());
CREATE POLICY "bookings_operator_update" ON public.bookings FOR UPDATE TO authenticated
  USING (operator_id = public.current_operator_id())
  WITH CHECK (operator_id = public.current_operator_id());

-- DEMO DATA
INSERT INTO public.operators (id, name, claim_code) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Mara Expeditions', 'KUDU-MARA');

INSERT INTO public.trips (id, operator_id, slug, title, region, days, price_cents, deposit_pct, summary, image_key) VALUES
  ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111', 'serengeti-gold', 'Serengeti Gold', 'Serengeti, TZ', 7, 890000, 20, 'Sundowner camps and the great migration across the western corridor.', 'serengeti'),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'ngorongoro-crater', 'Ngorongoro Crater', 'Ngorongoro, TZ', 4, 560000, 20, 'Descend into the caldera for a compact immersion in the crater floor.', 'ngorongoro'),
  ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111111', 'mara-river-crossing', 'Mara River Crossing', 'Maasai Mara, KE', 10, 1240000, 20, 'Follow the herd to the crossing grounds with riverfront tented camps.', 'mara');

INSERT INTO public.departures (trip_id, departs_on, seats_total, seats_taken) VALUES
  ('22222222-2222-4222-8222-222222222221', '2026-09-14', 6, 2),
  ('22222222-2222-4222-8222-222222222221', '2026-10-05', 6, 0),
  ('22222222-2222-4222-8222-222222222221', '2026-11-02', 6, 1),
  ('22222222-2222-4222-8222-222222222222', '2026-09-28', 6, 4),
  ('22222222-2222-4222-8222-222222222222', '2026-10-19', 6, 0),
  ('22222222-2222-4222-8222-222222222223', '2026-10-02', 8, 3),
  ('22222222-2222-4222-8222-222222222223', '2026-11-16', 8, 0);