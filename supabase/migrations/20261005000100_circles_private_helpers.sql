-- Keep the policy helpers out of the public API. Policies keep working (they reference the functions directly).
create schema if not exists private;
grant usage on schema private to authenticated;
alter function public.is_member(uuid) set schema private;
alter function public.shares_a_circle(uuid) set schema private;
alter function public.enforce_circle_size() set schema private;
alter function public.add_owner_as_member() set schema private;
alter function private.add_owner_as_member() set search_path = public;
alter function private.enforce_circle_size() set search_path = public;
