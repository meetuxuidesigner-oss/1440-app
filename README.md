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

Next: weekly statement, rest-day planning and Day Off (M2), Circles with accounts (M3), Live Activity and bedtime check (M4).

## Run it

```bash
npm install
npx expo start        # scan the QR code with Expo Go
npm run web           # or open in the browser
```

## Checks

```bash
npm test              # domain rules (day boundaries, sphere fill, streaks, Day Off maths)
npm run typecheck
npx expo lint
```

## Stack

Expo SDK 57 · Expo Router · React Native Skia (sphere) · Reanimated 4 · Zustand + AsyncStorage · Inter
