# Launch posts — `@dilix/rent-control-engine`

Drafts for the v0.1.0 public launch. **Tone**: founder voice (first
person, direct), not corporate. Don't sound like a press release.

> Status: drafts. Edit pass before posting. The Oakland 0.8% example is
> the hook in every variant — it's the most concrete demonstration of
> why this engine matters.

---

## Show HN

**Title**: `Show HN: An MIT-licensed engine that resolves California rent control caps with citations`

**Body**:

```
Hey HN — I built this because most CRE underwriting models assume 3-4% rent growth on properties that legally can't grow rents above 1%, and the gap compounds.

`@dilix/rent-control-engine` resolves the maximum legal annual rent increase for any California property — local ordinance, AB-1482 statewide fallback, Costa-Hawkins exemption logic, multi-year NOI projection. 32 California jurisdictions encoded with citations.

The headline:

  resolveRentCap({ city: "Oakland", county: "Alameda", state: "CA", yearBuilt: 1970, unitCount: 12, propertyType: "multifamily_5plus" })
  → { capPct: 0.8, source: "local_ordinance", citation: "Oakland Code of Ordinances §8.22.010 et seq.", ... }

That's a 0.8% cap on a building most underwriting models would project at 4% growth. Over a 5-year hold, six figures of foregone rent the model overcounts.

Why open source: customers underwriting on top of regulatory math need to *audit* it. CoreLogic / ATTOM / Cherre carry "rent controlled: true/false" booleans without rates, formulas, or citations. We checked.

Variants supported (TypeScript discriminated union):
- fixed_pct (San Jose 5%)
- cpi_formula with floor/ceiling/lower-of variants (Oakland, Mountain View)
- flat_plus_cpi (AB-1482, Sacramento)
- published_periods (SF, Antioch bi-monthly, LA, Inglewood)
- unit_count_tiered (Inglewood ≤4 units vs 5+)
- rent_base_tiered (Beverly Hills $600 cutoff)
- binding_arbitration (Gardena 5% threshold)
- not_in_effect (Salinas/Fairfax/San Anselmo paused/repealed)

37 tests, <1ms median resolution, no network calls, no DB reads.

7 ADRs document the design choices (discriminated union vs class hierarchy, year-only date matching trade-off, back-calculated CPI, CA-only at v0.1, why open source the engine).

Roadmap: NY rent stabilization next (DHCR registration data is the hard part). Then code violations and Builder's Remedy resolution.

GitHub: https://github.com/<org>/dilix-rent-control-engine
npm:    https://www.npmjs.com/package/@dilix/rent-control-engine

Happy to take corrections — most accepted within 48h ship in the next release.
```

---

## LinkedIn (Erica founder voice)

```
I underwrote a 12-unit Oakland deal once where the assumed rent growth was 4%/year. Cap rate looked fine, DSCR was fine, exit value penciled.

Oakland's published rent cap for 2025-2026 is 0.8%.

That gap — 320 bps a year — compounds across a 5-year hold to roughly $52K of foregone rent and >$120K of exit-value haircut on a sub-$3M deal. The underwriting was wrong before the broker hit send.

CoreLogic and ATTOM sell you "rent controlled: true/false." That's not actionable. You need the rate, the citation, and the math behind it, otherwise you can't defend the number to your investors.

So I built it. MIT licensed. 32 California jurisdictions, every cap formula variant in the CAA chart, citations on every output.

This is the first open-source piece of the Dilix stack. The engine is what customers can audit; the data dossiers and AI-agent envelope are what they pay for.

If you find an ordinance that's wrong → open an issue. Most accepted corrections ship in 48 hours.

→ https://github.com/<org>/dilix-rent-control-engine
```

---

## Twitter/X thread

```
1/ Most CRE underwriting models assume 3-4% rent growth on properties that legally can't grow rents above 1%.

That gap compounds. A 5-year hold can swing six figures.

I built an open-source engine that surfaces it.

@dilix/rent-control-engine — MIT licensed.

2/ Example: a 1970-built 12-unit in Oakland.

The published rent cap for 2025-2026 is 0.8%.

If the model assumed 4%, that's a 320 bps annual gap. Cumulative drag over 5 years: ~$52K of foregone rent. Exit value haircut: ~$120K.

The deal was wrong before the broker sent it.

3/ CoreLogic and ATTOM will sell you a property record with "rent_controlled: true/false."

Not actionable. You need the rate, the citation, and the formula behind it — otherwise you can't audit, can't defend, can't underwrite.

This package handles all of that.

4/ Coverage: 32 of 32 active CA jurisdictions per the CAA chart.

Plus AB-1482 statewide fallback. Plus Costa-Hawkins exemption logic. Plus 8 cap-formula variants encoded as a TypeScript discriminated union — fixed_pct, cpi_formula, flat_plus_cpi, published_periods, etc.

Resolved in <1ms. No network call.

5/ Why open source the engine?

Because verifiable math is the moat for institutional CRE. Customers can read the code, audit the citations, contribute corrections. The data dossiers and AI-agent integrations are what people pay for.

→ https://github.com/<org>/dilix-rent-control-engine
```

---

## Substack briefing (long-form)

> See `~/.claude/projects/.../project_dilix_thesis.md` for the full
> thesis on why this engine exists. Substack draft uses founder voice
> from the brand voice doc + Oakland example as the lede + open-source
> rationale as the close.

Three sections suggested:
1. **The 320 bps everyone misses.** Open with Oakland 12-plex story.
2. **Why "rent controlled: true" isn't enough.** Compare to vendor data.
3. **Why open source the engine.** ADR-5 rationale, the audit-trail moat.

---

## Reddit

**r/realestateinvesting** (subreddit rules permitting; if not, just answer questions in active threads with the GitHub link):

```
Built an open-source TypeScript package that resolves the max legal rent increase for any California property — 32 jurisdictions encoded with citations, sub-1ms.

If you've ever underwritten a deal in CA at 4% rent growth assumption and it turned out the cap was 0.8%, this is for you.

GitHub: <link>
npm: @dilix/rent-control-engine
```

**r/CommercialRealEstate** — same body, more underwriting-focused framing.

---

## Email blast

(To Dilix briefing subscribers.)

```
Subject: I just open-sourced the rent control engine

I've been writing about regulatory drag in CRE for months. Today I open-sourced the tool that surfaces it.

@dilix/rent-control-engine resolves the maximum legal annual rent increase for any California property — local ordinance, AB-1482 fallback, Costa-Hawkins exemption logic, multi-year NOI projection. 32 California jurisdictions encoded, citations on every output, MIT licensed.

Why open source: institutional CRE needs to audit the math. Vendors carry "rent controlled: true/false" booleans without rates or citations. This fills that gap.

If you have an ordinance that's wrong, open an issue: <link>
If you want to use it in your underwriting workflow, npm install: @dilix/rent-control-engine

— Erica
```
