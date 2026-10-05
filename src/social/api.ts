import { supabase } from './supabase';
import type { Circle, CirclePreview, Kudos, Member, Profile, Snapshot } from './types';

/** Friendly words for every error a person can actually hit. */
export function friendlyError(e: unknown): string {
  const msg = String((e as { message?: string })?.message ?? e ?? '');
  if (msg.includes('invalid_code')) return 'That code doesn’t match a circle. Check the letters and try again.';
  if (msg.includes('circle_full')) return 'That circle is full. Circles stay small, 10 people at most.';
  if (/anonymous/i.test(msg)) return 'Sign-in is switched off on the server. Ask Meet to turn on anonymous sign-ins in Supabase.';
  if (/fetch|network|Failed to fetch|timeout/i.test(msg)) return 'Can’t reach the server. Check your internet and try again.';
  if (msg.includes('not_signed_in') || /JWT|session/i.test(msg)) return 'You’re signed out. Close this and try again.';
  return msg || 'Something went wrong. Try again.';
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Signs in quietly (no email, no password) and saves the name friends will see. */
export async function signIn(name: string): Promise<Profile> {
  const sb = supabase();
  let { data: session } = await sb.auth.getSession();
  if (!session.session) {
    const { error } = await sb.auth.signInAnonymously();
    fail(error);
    session = (await sb.auth.getSession()).data;
  }
  const id = session.session!.user.id;
  const { error } = await sb.from('profiles').upsert({ id, name: name.trim() });
  fail(error);
  return { id, name: name.trim() };
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase().auth.getSession();
  return data.session?.user.id ?? null;
}

export async function rename(id: string, name: string) {
  const { error } = await supabase().from('profiles').update({ name: name.trim() }).eq('id', id);
  fail(error);
}

export async function createCircle(name: string): Promise<string> {
  const { data, error } = await supabase().rpc('create_circle', { circle_name: name.trim() });
  fail(error);
  return (data as { id: string }).id;
}

export async function previewCircle(code: string): Promise<CirclePreview | null> {
  const { data, error } = await supabase().rpc('preview_circle', { code: code.trim() });
  fail(error);
  return (data as CirclePreview | null) ?? null;
}

export async function joinCircle(code: string): Promise<string> {
  const { data, error } = await supabase().rpc('join_circle', { code: code.trim() });
  fail(error);
  return data as string;
}

export async function leaveCircle(circleId: string, me: string) {
  const { error } = await supabase().from('circle_members').delete().eq('circle_id', circleId).eq('user_id', me);
  fail(error);
}

export async function publishSnapshot(circleId: string, me: string, snapshot: Snapshot) {
  const { error } = await supabase()
    .from('circle_snapshots')
    .upsert({ circle_id: circleId, user_id: me, data: snapshot, updated_at: new Date().toISOString() });
  fail(error);
}

export async function giveKudos(circleId: string, from: string, to: string, target: string) {
  const { error } = await supabase().from('kudos').insert({ circle_id: circleId, from_user: from, to_user: to, target });
  if (error && !/duplicate/i.test(error.message)) fail(error);
}

export async function takeBackKudos(circleId: string, from: string, to: string, target: string) {
  const { error } = await supabase()
    .from('kudos')
    .delete()
    .eq('circle_id', circleId)
    .eq('from_user', from)
    .eq('to_user', to)
    .eq('target', target);
  fail(error);
}

type CircleRow = { id: string; name: string; invite_code: string; owner_id: string; created_at: string };
type MemberRow = { circle_id: string; user_id: string; joined_at: string; profile: { name: string } | null };
type SnapshotRow = { circle_id: string; user_id: string; data: Snapshot };
type KudosRow = { circle_id: string; from_user: string; to_user: string; target: string; created_at: string };

/** Everything for the Circles tab in four small reads. The database only returns circles I'm in. */
export async function loadCircles(): Promise<Circle[]> {
  const sb = supabase();
  const since = new Date(Date.now() - 21 * 864e5).toISOString();
  const [c, m, s, k] = await Promise.all([
    sb.from('circles').select('id,name,invite_code,owner_id,created_at').order('created_at'),
    sb.from('circle_members').select('circle_id,user_id,joined_at,profile:profiles(name)').order('joined_at'),
    sb.from('circle_snapshots').select('circle_id,user_id,data'),
    sb.from('kudos').select('circle_id,from_user,to_user,target,created_at').gte('created_at', since),
  ]);
  for (const r of [c, m, s, k]) fail(r.error);

  const snapshots = new Map(((s.data ?? []) as SnapshotRow[]).map((r) => [`${r.circle_id}:${r.user_id}`, r.data]));
  const members = (m.data ?? []) as unknown as MemberRow[];
  const kudos = (k.data ?? []) as KudosRow[];

  return ((c.data ?? []) as CircleRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    members: members
      .filter((x) => x.circle_id === row.id)
      .map<Member>((x) => ({
        id: x.user_id,
        name: x.profile?.name ?? 'Friend',
        joinedAt: x.joined_at,
        snapshot: snapshots.get(`${row.id}:${x.user_id}`) ?? null,
      })),
    kudos: kudos
      .filter((x) => x.circle_id === row.id)
      .map<Kudos>((x) => ({ circleId: x.circle_id, from: x.from_user, to: x.to_user, target: x.target, createdAt: x.created_at })),
  }));
}
