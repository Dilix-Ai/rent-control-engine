# Architecture Decision Records

Short notes on the design choices that shape this package, why they were made, and what the alternatives would have cost.

These exist because rent control software gets bought (or not bought) on questions like *"why did you pick this data structure?"* The answers are durable; the implementation isn't.

## ADR-1 — Discriminated union for `CapFormula` instead of class hierarchy

**Decision:** Cap formulas are modeled as a TypeScript discriminated union (`{ kind: "fixed_pct"; pct: number } | { kind: "cpi_formula"; ... } | ...`) rather than a class hierarchy with an abstract `compute()` method.

**Why:**
- The CAA chart enumerates ~8 formula shapes. New variants are rare events (one or two per year at the state level). The "open for extension" benefit of inheritance doesn't pay back here.
- Discriminated unions force exhaustiveness checking in the resolver. When a new variant is added (e.g., the binding-arbitration shape), TypeScript fails the build until every consumer handles it. With classes, missing cases silently default to a base implementation.
- Serialization is trivial — the data is already JSON-shaped. Class instances would need custom serializers for the storage / cross-edge-function boundary.

**Trade-off:** Each new variant requires adding a case to the resolver `switch`. We accept that — it's a feature, not a bug. The compiler tells us where.

## ADR-2 — Year-only matching for `builtBefore` cutoffs

**Decision:** When checking construction-date eligibility, the resolver compares `property.yearBuilt >= parseInt(cutoff.slice(0, 4))`, ignoring the month and day of the ordinance's actual effective date.

**Why:**
- Property data sources (ATTOM, county assessors) overwhelmingly report year-built only — month and day are unreliable.
- Forcing full-date matching would require throwing away ~95% of cases where we have a year but no month, which is the wrong default.

**Trade-off:** A 1979 SF property built before 6/13/79 is technically covered by the SF rent ordinance, but our resolver flags it as exempt because 1979 ≥ 1979. This affects roughly 5% of borderline-year buildings. We surface this in the `warnings` array of any resolution where `yearBuilt === cutoffYear`, and document it prominently in the README.

When the data layer can resolve full construction dates with confidence, we'll switch to full-date matching. Today, year-based is the honest default.

## ADR-3 — CPI readings back-calculated from the CAA chart, not pulled from BLS

**Decision:** Regional CPI percentages used by AB-1482 and CPI-formula ordinances are derived from the published cap percentages in the CAA chart (e.g., Oakland's 0.8% cap for 8/1/25–7/31/26 implies SF-Oakland-Hayward April 2025 CPI ≈ 1.33%).

**Why:**
- The CAA chart is the operative reference document for the actual industry. Internal consistency with the chart is more useful than authoritative-but-divergent numbers.
- BLS publishes regional CPI on a delayed schedule that doesn't always align with rent-cap effective windows.
- Back-calculation lets us satisfy customer-facing reference points without an external dependency on the BLS series timing.

**Trade-off:** Our CPI numbers are derived, not authoritative. We document this on every reading via the `source` field. When BLS publishes a new April reading, we re-derive and reconcile.

This is acceptable for an MVP that needs to match the CAA chart exactly. Long-term, the package will hit BLS directly for primary readings and use back-calculation only as a sanity check.

## ADR-4 — California-only at v0.1; 50-state expansion later

**Decision:** v0.1 covers only California. Out-of-state addresses return `source: "no_local_rule_no_ab1482"` with a warning.

**Why:**
- California has the most well-defined, citation-backed local rent control regime in the US (32 jurisdictions in the CAA chart, plus AB-1482 statewide).
- Other major states (NY rent stabilization, NJ at the municipal level, OR statewide cap, MD/DC) have very different structures. NY in particular requires DHCR registration data, which is a multi-month build on its own.
- Shipping CA-only forces us to confront the hard problem (deterministic resolution + citations) on a complete dataset before generalizing.

**Trade-off:** Half of our potential users are non-CA. They get an explicit "out of scope" return rather than wrong data. We treat that as the right default.

## ADR-5 — Open source the engine, monetize the data

**Decision:** The resolver, types, and ordinance encodings are MIT-licensed open source. Live data feeds (real-time BLS CPI, permit-driven amendments, dynamic property classification) live in the closed Dilix product.

**Why:**
- Verifiable code IS the moat. Customers underwriting deals on top of regulatory math need to be able to audit it. Opaque APIs lose to readable code in this market.
- Maintainership velocity is the actual operational moat. Open source the artifact; charge for keeping it current.
- Competitors who fork the engine still need to maintain it — which they won't, because they don't have the customer pull.

**Trade-off:** Anyone can technically run their own rent control resolver locally. Most won't, because hosting + keeping it current is more work than calling the Dilix API.

## ADR-6 — No DB; ordinances live in code

**Decision:** All 32 ordinances are encoded as TypeScript literals in `src/ordinances.ts`. No SQL, no JSON file, no CMS.

**Why:**
- Code is reviewable, version-controlled, and testable. A SQL row isn't.
- Type checking catches errors at compile time. A SQL row gets validated at runtime, possibly never.
- Ordinance changes are infrequent (~5–10 per year nationally). The Git workflow is the right cadence.
- Open-source contributors can correct ordinance data via PR. They can't easily PR a database.

**Trade-off:** Updating an ordinance requires a release. We accept this for now; the cadence justifies it. If/when ordinance changes accelerate (post-50-state expansion), we may move to a hybrid: code for the schema and resolver, JSON files for the ordinance data, with a build step that validates one against the other.

## ADR-7 — Confidence as enum (`high | medium | low`), not numeric score

**Decision:** Resolver returns `confidence: "high" | "medium" | "low"`, not `confidence: 0.83`.

**Why:**
- Numeric scores invite false precision. The difference between 0.83 and 0.85 is meaningless to a downstream consumer; both should be presented as "high."
- Three-bucket enums map cleanly to UI badges and to LLM reasoning chains. AI agents reason better with discrete confidence levels.
- A scoring system would require calibration (what makes a 0.7 different from a 0.6?). Discrete buckets force us to define meaningful rules.

**Rules used today:**
- `high` — local ordinance with a published period covering the queried date, or AB-1482 with a published BLS reading.
- `medium` — formula computation using estimated CPI, or fallback rules outside published periods.
- `low` — missing data, indeterminate eligibility, or out-of-scope state.
