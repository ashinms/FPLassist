# FPLassist

Three AI agents debate your Fantasy Premier League transfer using live data.

Every FPL manager knows the Friday-afternoon spiral: one free transfer, two players, and a dozen conflicting signals (form, fixtures, rotation risk, price rises). FPLassist runs that debate for you, grounded in real, live Premier League data, and not simply an LLM's guess.

## How it works

1. **You pick a transfer.** Search the player you'd sell and the player you'd buy — or optionally enter your public FPL Team ID first, which scopes "Transfer Out" to your actual squad and checks whether you can afford the swap against your bank.
2. **A deterministic model scores both players first**, computed in plain code from live FPL data — split into an attacking score and a defensive score, then summed, so goalkeepers and defenders aren't judged on attacking output alone:

   ```
   Attacking Score  = (xGI per 90) × (Fixture Easiness) × (Minutes Reliability)
   Defensive Score  = (Clean Sheets per 90 + Defensive Contribution Rate + Save Rate)
                       × (Fixture Easiness) × (Minutes Reliability)
   Total Score      = Attacking Score + Defensive Score
   ```

   - **xGI per 90** — expected goal involvements, straight from the FPL API.
   - **Clean Sheets per 90 / Defensive Contribution Rate / Save Rate** — clean sheets, defensive actions (tackles/interceptions/clearances/recoveries — the stat FPL's own defensive-contribution points are based on), and saves, all per 90 minutes, all straight from the FPL API.
   - **Fixture Easiness** — derived from the opponent's overall strength rating over the next N gameweeks (not FPL's own subjective 1–5 FDR — see [Design notes](#design-notes)).
   - **Minutes Reliability** — share of available team minutes actually played, a proxy for rotation/injury risk.

3. **Three agents debate the transfer**, each a separate LLM call, each grounded only in that computed stats JSON (not the model's own possibly-stale knowledge of these players):
   - **Bull** — argues the strongest case *for* the transfer.
   - **Bear** — argues the strongest case *against* it, or for rolling the transfer instead.
   - **Arbiter** — weighs both arguments against the raw stats and hands down a final **BUY / SELL / HOLD** verdict with a risk rating.
4. **You get a verdict card**, not a black box — the formula inputs are shown, not hidden, and the full agent debate is one click away.

## Tech stack

- **Next.js 16** (App Router, TypeScript) — single deployable app, API routes as the backend
- **Tailwind CSS 4** for styling
- **Groq API** (`openai/gpt-oss-120b`) for the three agents — chosen for its free tier and fast inference
- **[Fantasy Premier League's public API](https://fantasy.premierleague.com/api/bootstrap-static/)** — free, unauthenticated, no scraping
- **Premier League CDN** for club badges and player photos

No database is involved. Bootstrap data is fetched and cached in memory per request.

## Getting started

```bash
git clone https://github.com/ashinms/FPLassist.git
cd FPLassist
npm install
```

Create `.env.local` in the project root:

```
GROQ_API_KEY=your_key_here
```

Get a free key at [console.groq.com](https://console.groq.com) — no card required.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Design notes

A few honest disclosures about what this model does and doesn't do:

- **The defensive contribution normalization is a heuristic, not an exact replica of FPL's points rules.** It scales defensive-actions-per-90 against roughly the threshold defenders need to hit for bonus points, but it isn't a precise points simulator.
- **`strength_attack_home/away` and `strength_defence_home/away` are dead fields** in this season's FPL API — they return 0 for every team. Fixture Easiness (used for both attacking and defensive scores) is computed from `strength_overall_home/away` instead, which is still populated.
- **Injury/availability status is surfaced directly from data**, not left to the LLM to mention. Agents are told to treat it as a risk factor, but LLM output isn't reliable enough on its own for a fact this consequential. A visible badge and callout in the UI don't depend on what any given agent generation says.
- **No backtesting.** The formula is a transparent, disclosed heuristic, not a trained or validated predictive model. Treat the score as a reasoning aid and not a guarantee.

## What's not built (yet)

- **Free-transfer / hit-cost tracking is a deliberate cut, not a missing feature.** The FPL API doesn't expose "free transfers banked" as a field — it would have to be reconstructed by walking your full transfer history. More importantly, the Model Score isn't denominated in real FPL points, so it couldn't honestly answer "is this worth a -4 hit" even if free transfers were tracked. That's a calibration problem (see "No backtesting" above), not a data-import problem, and building the tracking without solving calibration first would produce a feature that looks authoritative but isn't. The app's job is judging transfer quality, not your transfer bank — you're better placed to make that call yourself once you see the verdict.
- **Multi-transfer / wildcard planning** — this handles one transfer at a time.
- **Automated tests** — verified manually against live data and a real browser session during development.

## Why build this

Agentic FPL tools already exist. But this wasn't built to fill a gap in the market. It was an exercise in a specific technical problem: grounding a multi-agent LLM debate in real, disclosed, deterministic data rather than letting the models reason freely (and possibly hallucinate) over a domain they have stale or incomplete knowledge of. The interesting part is the pattern of computing the truth first, in code, and using the LLMs only to reason and argue over it.
