alter publication supabase_realtime add table
  public.schedule_items,
  public.expenses,
  public.expense_splits,
  public.trips,
  public.trip_members;

-- DELETE events must carry the old row so trip_id filters still match
alter table public.schedule_items replica identity full;
alter table public.expenses       replica identity full;
alter table public.expense_splits replica identity full;
