[← Back to overview](../../README.md)

# 🎬 Season Recap

When an EA FC edition ends, every player who took part gets a personal, story-style recap of their season — like a "wrapped", but for the whole season instead of a week.

---

## How it starts

- **Automatically, once**: the first time you open the app after your recap is ready, the app checks in the background and — if you haven't seen it yet on this device — opens it for you. It never interrupts an active flow (e.g. mid-way through recording a match) and only checks once per app session
- **From the dashboard**: a "Dein *Edition*-Rückblick ist da" card appears for the first two weeks after your recap is generated
- **From the leaderboard**: once a season is closed, its view shows a "Dein *Edition*-Rückblick" button
- **From a push notification**: "Dein Rückblick auf FC26 ist fertig" opens it directly

Every entry point leads to the same URL, `/app/recap/<season>` (e.g. `/app/recap/fc26`), so it's shareable and bookmarkable — though naturally it only ever shows *your own* recap.

## The story

Full-screen, story-style, ten slides — auto-advancing roughly every 7 seconds, pausing while you press and holding. Tap or swipe left/right to go back or forward, arrow keys work on desktop, Escape or the ✕ closes it. A slide is skipped entirely when its data isn't there (e.g. no "match of the season" without enough matches).

1. **Intro** — the season and its dates, your avatar, your total matches
2. **Zahlen** — wins/draws/losses, your win rate, your rank among the league for wins
3. **Tore** — goals, assists, goals per game, hattricks, clean sheets
4. **Wann du spielst** — your most common matchday, your "lucky day", how much of your football happens on a lunch break, your favourite kickoff hour
5. **Mit wem** — your best partner, your nemesis, your favourite victim
6. **Dein Spiel der Saison** — the season's standout match (with a highlight link when there is one), plus your biggest win, highest-scoring match, most common scoreline and favourite/best club
7. **Deine ELO-Reise** — your rating from the start to the end of the season, a sparkline, your peak and your league-wide rank
8. **Das neue ELO** — if you played before League-ELO v2 shipped, your rating under the old system vs. the new one, plus personal reasons your number moved the way it did (cards, 1v2 matches, draws, shootouts)
9. **Saison-Awards** — every league award for that season, with a confetti burst if you won one
10. **Finale** — your AI season summary (if generated) and the Talkrunde recording (if ready), your FC27 starting rating, and a button back to the live Rangliste

## Design notes

The story is intentionally a fully dark, immersive screen — the same idea as the new-match wizard — rather than the app's regular light/dark theme, so it reads like a highlight reel rather than another settings page. Count-up numbers, slide transitions and the confetti burst are all skipped under the OS-level "reduce motion" setting; navigation itself still works exactly the same.

## Where the data comes from

The whole story renders from a single API call — `getSeasonRecap(seasonId)` — which can legitimately return nothing (a player with no matches that season, or a recap not generated yet). The season switch on the leaderboard is the general entry point to browse past seasons; the recap is specifically the personal, narrative view of one that has already closed.

---

[← Leaderboard](LEADERBOARD.md) · [Back to overview](../../README.md) · [Dashboard →](DASHBOARD.md)
