-- 1440 · Circles
-- Small, invite-only groups (max 10). Friends see ✓ days and streaks, never minutes.
-- Privacy is enforced here, in the database, not only in the app.
-- Each phone publishes one "snapshot" per circle that holds ONLY the activities
-- the person chose to share with that circle. Unshared activities never leave the phone.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table public.circle_snapshots (
  circle_id uuid not null,
  user_id uuid not null,
  data jsonb not null check (octet_length(data::text) < 20000),
  updated_at timestamptz not null default now(),
  primary key (circle_id, user_id),
  foreign key (circle_id, user_id) references public.circle_members (circle_id, user_id) on delete cascade
);

create table public.kudos (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  target text not null check (char_length(target) <= 120),
  created_at timestamptz not null default now(),
  unique (circle_id, from_user, to_user, target),
  check (from_user <> to_user)
);

create index circle_members_user_idx on public.circle_members (user_id);
create index kudos_to_idx on public.kudos (to_user, created_at desc);

create or replace function public.is_member(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from circle_members where circle_id = c and user_id = auth.uid());
$$;

create or replace function public.shares_a_circle(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from circle_members a join circle_members b on a.circle_id = b.circle_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create or replace function public.enforce_circle_size()
returns trigger language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.circle_members where circle_id = new.circle_id) >= 10 then
    raise exception 'circle_full';
  end if;
  return new;
end $$;

create trigger circle_size before insert on public.circle_members
for each row execute function public.enforce_circle_size();

create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into circle_members (circle_id, user_id) values (new.id, new.owner_id);
  return new;
end $$;

create trigger circle_owner_joins after insert on public.circles
for each row execute function public.add_owner_as_member();

alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_snapshots enable row level security;
alter table public.kudos enable row level security;

create policy "see myself and people in my circles" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.shares_a_circle(id));
create policy "create my profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "edit my profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "see circles I'm in" on public.circles
  for select to authenticated using (public.is_member(id));
create policy "create a circle I own" on public.circles
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owner renames" on public.circles
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner deletes" on public.circles
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "see members of my circles" on public.circle_members
  for select to authenticated using (public.is_member(circle_id));
create policy "leave a circle" on public.circle_members
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "see snapshots in my circles" on public.circle_snapshots
  for select to authenticated using (public.is_member(circle_id));
create policy "publish my snapshot" on public.circle_snapshots
  for insert to authenticated with check (user_id = (select auth.uid()) and public.is_member(circle_id));
create policy "update my snapshot" on public.circle_snapshots
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.is_member(circle_id));

create policy "see kudos in my circles" on public.kudos
  for select to authenticated using (public.is_member(circle_id));
create policy "give kudos to someone in my circle" on public.kudos
  for insert to authenticated with check (
    from_user = (select auth.uid())
    and public.is_member(circle_id)
    and exists (select 1 from public.circle_members m where m.circle_id = kudos.circle_id and m.user_id = kudos.to_user)
  );
create policy "take back my kudos" on public.kudos
  for delete to authenticated using (from_user = (select auth.uid()));

create or replace function public.preview_circle(code text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', c.id,
    'name', c.name,
    'owner', (select p.name from profiles p where p.id = c.owner_id),
    'members', (select coalesce(json_agg(p.name order by m.joined_at), '[]'::json)
                from circle_members m join profiles p on p.id = m.user_id where m.circle_id = c.id),
    'full', (select count(*) >= 10 from circle_members m where m.circle_id = c.id)
  )
  from circles c where c.invite_code = upper(trim(code));
$$;

create or replace function public.join_circle(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select id into cid from circles where invite_code = upper(trim(code));
  if cid is null then raise exception 'invalid_code'; end if;
  insert into circle_members (circle_id, user_id) values (cid, auth.uid())
  on conflict do nothing;
  return cid;
end $$;

create or replace function public.create_circle(circle_name text)
returns json language plpgsql security definer set search_path = public as $$
declare
  c circles;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  insert into circles (name, owner_id) values (trim(circle_name), auth.uid()) returning * into c;
  return json_build_object('id', c.id, 'name', c.name, 'invite_code', c.invite_code, 'owner_id', c.owner_id, 'created_at', c.created_at);
end $$;

revoke all on function public.preview_circle(text) from public, anon;
revoke all on function public.join_circle(text) from public, anon;
revoke all on function public.create_circle(text) from public, anon;
revoke all on function public.is_member(uuid) from public, anon;
revoke all on function public.shares_a_circle(uuid) from public, anon;
revoke all on function public.enforce_circle_size() from public, anon, authenticated;
revoke all on function public.add_owner_as_member() from public, anon, authenticated;
grant execute on function public.preview_circle(text) to authenticated;
grant execute on function public.join_circle(text) to authenticated;
grant execute on function public.create_circle(text) to authenticated;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.shares_a_circle(uuid) to authenticated;
