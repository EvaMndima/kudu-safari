DROP POLICY "trips_operator_write" ON public.trips;
DROP POLICY "departures_operator_write" ON public.departures;
DROP POLICY "bookings_operator_read" ON public.bookings;
DROP POLICY "bookings_operator_update" ON public.bookings;
DROP FUNCTION IF EXISTS public.current_operator_id();

CREATE POLICY "trips_operator_write" ON public.trips FOR ALL TO authenticated
  USING (operator_id IN (SELECT o.id FROM public.operators o WHERE o.user_id = auth.uid()))
  WITH CHECK (operator_id IN (SELECT o.id FROM public.operators o WHERE o.user_id = auth.uid()));

CREATE POLICY "departures_operator_write" ON public.departures FOR ALL TO authenticated
  USING (trip_id IN (SELECT t.id FROM public.trips t JOIN public.operators o ON o.id = t.operator_id WHERE o.user_id = auth.uid()))
  WITH CHECK (trip_id IN (SELECT t.id FROM public.trips t JOIN public.operators o ON o.id = t.operator_id WHERE o.user_id = auth.uid()));

CREATE POLICY "bookings_operator_read" ON public.bookings FOR SELECT TO authenticated
  USING (operator_id IN (SELECT o.id FROM public.operators o WHERE o.user_id = auth.uid()));

CREATE POLICY "bookings_operator_update" ON public.bookings FOR UPDATE TO authenticated
  USING (operator_id IN (SELECT o.id FROM public.operators o WHERE o.user_id = auth.uid()))
  WITH CHECK (operator_id IN (SELECT o.id FROM public.operators o WHERE o.user_id = auth.uid()));