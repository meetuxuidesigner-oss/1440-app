// Runs the real migration in an in-memory Postgres and checks the privacy rules.
// Run with: node supabase/tests/circles.test.mjs
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to authenticated, anon;
  grant execute on function auth.uid() to authenticated, anon;
  alter default privileges in schema public grant all on tables to authenticated;
`);
for (const f of ['20261005000000_circles.sql', '20261005000100_circles_private_helpers.sql'])
  await db.exec(readFileSync(new URL('../migrations/' + f, import.meta.url), 'utf8'));

const U = (n) => `00000000-0000-0000-0000-00000000000${n}`;
for (let i = 1; i <= 9; i++) await db.query(`insert into auth.users values ($1)`, [U(i)]);

// Act as a signed-in user, like Supabase does for each request.
async function as(user, sql, params = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ''}', false); set role authenticated;`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec('reset role');
  }
}
async function fails(user, sql, params, msg) {
  await assert.rejects(() => as(user, sql, params), undefined, msg);
}

const [meet, riya, arjun, outsider] = [U(1), U(2), U(3), U(4)];
for (const [u, name] of [[meet, 'Meet'], [riya, 'Riya'], [arjun, 'Arjun'], [outsider, 'Stranger']])
  await as(u, 'insert into profiles (id, name) values ($1, $2)', [u, name]);
await fails(meet, 'insert into profiles (id, name) values ($1, $2)', [U(5), 'Fake'], "can't create someone else's profile");

// Create
const created = (await as(meet, 'select create_circle($1) as c', ['Morning learners'])).rows[0].c;
assert.equal(created.name, 'Morning learners');
assert.equal(created.invite_code.length, 6);
assert.equal((await as(meet, 'select * from circles')).rows.length, 1, 'owner sees the circle');
assert.equal((await as(riya, 'select * from circles')).rows.length, 0, 'non-member sees nothing');

// Preview and join
const preview = (await as(riya, 'select preview_circle($1) as p', [created.invite_code.toLowerCase()])).rows[0].p;
assert.deepEqual(preview.members, ['Meet']);
assert.equal(preview.owner, 'Meet');
await as(riya, 'select join_circle($1)', [created.invite_code]);
await as(arjun, 'select join_circle($1)', [created.invite_code]);
await as(arjun, 'select join_circle($1)', [created.invite_code]); // twice is harmless
await fails(riya, 'select join_circle($1)', ['ZZZZZZ'], 'bad code rejected');
await fails(riya, 'insert into circle_members values ($1, $2)', [created.id, outsider], "can't add others directly");
assert.equal((await as(riya, 'select * from circle_members')).rows.length, 3);
assert.equal((await as(outsider, 'select * from circle_members')).rows.length, 0, 'outsider sees no members');

// Profiles: only people who share a circle
assert.equal((await as(riya, 'select * from profiles')).rows.length, 3);
assert.equal((await as(outsider, 'select * from profiles')).rows.length, 1, 'outsider only sees self');

// Snapshots
const snap = { name: 'Riya', activities: [{ name: 'Learn English', marks: ['done'], streak: 6 }] };
await as(riya, 'insert into circle_snapshots (circle_id, user_id, data) values ($1, $2, $3)', [created.id, riya, snap]);
await as(riya, 'update circle_snapshots set data = $1 where circle_id = $2 and user_id = $3', [snap, created.id, riya]);
await fails(riya, 'insert into circle_snapshots (circle_id, user_id, data) values ($1, $2, $3)', [created.id, meet, snap], "can't write someone else's snapshot");
await fails(outsider, 'insert into circle_snapshots (circle_id, user_id, data) values ($1, $2, $3)', [created.id, outsider, snap], "non-member can't publish");
assert.equal((await as(meet, 'select * from circle_snapshots')).rows.length, 1, 'member sees snapshot');
assert.equal((await as(outsider, 'select * from circle_snapshots')).rows.length, 0, 'outsider sees no snapshot');
assert.equal((await as(riya, 'update circle_snapshots set data = $1 where user_id = $2', [snap, meet])).affectedRows, 0);

// Kudos
await as(meet, 'insert into kudos (circle_id, from_user, to_user, target) values ($1, $2, $3, $4)', [created.id, meet, riya, 'english:2026-09-21']);
await fails(meet, 'insert into kudos (circle_id, from_user, to_user, target) values ($1, $2, $3, $4)', [created.id, meet, riya, 'english:2026-09-21'], 'no double kudos');
await fails(meet, 'insert into kudos (circle_id, from_user, to_user, target) values ($1, $2, $3, $4)', [created.id, riya, arjun, 'x'], "can't give kudos as someone else");
await fails(meet, 'insert into kudos (circle_id, from_user, to_user, target) values ($1, $2, $3, $4)', [created.id, meet, outsider, 'x'], 'only to members');
await fails(meet, 'insert into kudos (circle_id, from_user, to_user, target) values ($1, $2, $3, $4)', [created.id, meet, meet, 'x'], 'not to yourself');
assert.equal((await as(riya, 'select * from kudos')).rows.length, 1);
assert.equal((await as(riya, 'delete from kudos')).affectedRows, 0, "can't delete others' kudos");
assert.equal((await as(meet, 'delete from kudos')).affectedRows, 1, 'take back my kudos');

// Max 10 members (3 so far)
const extra = (i) => `00000000-0000-0000-0000-0000000001${String(i).padStart(2, '0')}`;
for (let i = 1; i <= 8; i++) {
  await db.query('insert into auth.users values ($1)', [extra(i)]);
  await as(extra(i), 'insert into profiles (id, name) values ($1, $2)', [extra(i), `P${i}`]);
  if (i <= 7) await as(extra(i), 'select join_circle($1)', [created.invite_code]);
}
assert.equal((await as(meet, 'select count(*)::int as n from circle_members')).rows[0].n, 10);
await fails(extra(8), 'select join_circle($1)', [created.invite_code], 'circle full at 10');
assert.equal((await as(outsider, 'select preview_circle($1) as p', [created.invite_code])).rows[0].p.full, true);

// Leave
assert.equal((await as(arjun, 'delete from circle_members where user_id = $1', [riya])).affectedRows, 0, "can't remove others");
assert.equal((await as(arjun, 'delete from circle_members where user_id = $1', [arjun])).affectedRows, 1, 'can leave');
assert.equal((await as(arjun, 'select * from circles')).rows.length, 0, 'left circle is hidden');

console.log('Circles database rules: all checks passed');
