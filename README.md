# 1440

A calm, gamified time app for professionals and students. It rewards balance and consistency, not hustle.

Your day is a glass sphere. Each activity you do pours a layer of colour into it, up to its daily target. When the sphere is full, you did what you planned, and you're done for today.

## Milestone 1 (this version)

- Onboarding: wake and sleep times, first activity with a daily target and days per week, or "Try with a sample week"
- Home: the liquid sphere (time well spent vs. today's plan), awake-day arc, activity rows with one-tap timer (auto-switch, undo)
- Quick log for forgotten time (7 days back, no overlaps, no future)
- Activity detail: weekly streak, week strip, today, last 7 days of sessions
- Week: where each activity stands this week
- Local-first: data stays on the device

## Milestone 3: Circles (this version)

- Small private groups, up to 10 people, joined with a 6-letter code
- You choose what each circle sees, per activity. Everything starts private
- Friends see ✓ days and streaks. Never minutes, times, or missed days
- One-tap kudos with a soft ripple; tap again to take it back
- No feeds, no leaderboards
- Backend: Supabase (Postgres). Privacy rules live in the database (`supabase/migrations`) and are tested (`npm run test:db`)
- Sign-in is invisible for now (anonymous account + first name). Apple / Google sign-in comes with the native build

Next: weekly statement, rest-day planning and Day Off (M2), Live Activity and bedtime check (M4).

## Run it

```bash
npm install
npx expo start        # scan the QR code with Expo Go
npm run web           # or open in the browser
```

## Checks

```bash
npm test              # domain rules (day boundaries, sphere fill, streaks, Day Off maths, what circles see)
npm run test:db       # Circles privacy rules, run against a real Postgres in memory
npm run typecheck
npx expo lint
```

## Stack

Expo SDK 57 · Expo Router · React Native Skia (sphere) · Reanimated 4 · Zustand + AsyncStorage · Supabase · Inter
