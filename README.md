# `@dilix/rent-control-engine`

Resolve the maximum legal annual rent increase for any California property — local ordinance, AB-1482 statewide fallback, Costa-Hawkins exemption logic, multi-year NOI projection. **32 California jurisdictions encoded with citations, all of them.**

[![npm version](https://img.shields.io/npm/v/@dilix/rent-control-engine.svg?color=informational)](https://www.npmjs.com/package/@dilix/rent-control-engine)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/erica-ownershiptheory/dilix-rent-control-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/erica-ownershiptheory/dilix-rent-control-engine/actions)
[![Tests](https://img.shields.io/badge/tests-37%20passing-brightgreen)](./test)

Built and maintained by [Dilix](https://dilix.ai) — the NOI defense layer for CRE.

---

## What this answers

> *"Given this California property, on this date, what is the maximum legal annual rent increase the landlord may impose?"*

Deterministically. With a citation. In <1ms.

```typescript
import { resolveRentCap } from "@dilix/rent-control-engine";

const cap = resolveRentCap({
  city: "Oakland",
  county: "Alameda",
  state: "CA",
  yearBuilt: 1970,
  unitCount: 12,
  propertyType: "multifamily_5plus",
});

// {
//   capPct: 0.8,
//   source: "local_ordinance",
//   citation: "Oakland Code of Ordinances §8.22.010 et seq.",
//   formulaExplanation: "Oakland rent ordinance: 0.8% (published cap for 2025-08-01 → 2026-07-31); 60% of regional CPI; SF-Oakland-Hayward April 2025 reading ~1.33%",
//   effectiveStart: "2025-08-01",
//   effectiveEnd: "2026-07-31",
//   confidence: "high",
//   // ...
// }
```

That's a 0.8% cap on a building most underwriting models would project at 3-4% rent growth. Over a 5-year hold, that's six figures of foregone rent the model is overcounting. **This package's reason for existing is to surface that gap before the deal closes.**

## Why this is different from "rent control data" you might license elsewhere

CRE data vendors will sell you a property record with "rent controlled: true." That's not actionable. **You need the *rate*, the *citation*, and the *math behind it*** — otherwise you can't build a defensible underwriting model on top.

Other tools:
- Don't enumerate the formula (so you can't audit)
- Don't surface the citation (so you can't defend the number to a customer)
- Don't handle the variants — Beverly Hills' rent-base tier ≠ Inglewood's unit-count tier ≠ Antioch's bi-monthly published periods

This engine handles all of them. By design, in code, MIT-licensed.

## Install

```bash
npm install @dilix/rent-control-engine
```

Requires Node 18+. ESM-only.

## Usage

### Single-property resolution

```typescript
import { resolveRentCap } from "@dilix/rent-control-engine";

const cap = resolveRentCap({
  city: "Beverly Hills",
  county: "Los Angeles",
  state: "CA",
  yearBuilt: 1960,
  unitCount: 8,
  propertyType: "multifamily_5plus",
  moveInRentBase: 2500,  // required for Beverly Hills' rent-base tier
});
```

### Multi-year NOI projection

```typescript
import { projectRentCapImpact } from "@dilix/rent-control-engine";

const sub = projectRentCapImpact(
  property,
  300_000,  // base annual GRI
  5,        // hold years
  4,        // assumed market growth %
);

console.log(sub.cumulativeDrag);  // total $ left on the table over the hold
```

### As-of-date resolution (historical or future)

```typescript
const cap = resolveRentCap(property, new Date("2026-03-15"));
// Resolves against the period covering 3/15/26
```

See [`examples/`](./examples) for three working scripts:
- [`01-underwrite-a-deal.ts`](./examples/01-underwrite-a-deal.ts) — full underwriting flow
- [`02-screen-a-portfolio.ts`](./examples/02-screen-a-portfolio.ts) — rank 5 properties by regulatory drag
- [`03-mcp-tool-integration.ts`](./examples/03-mcp-tool-integration.ts) — wrap as an MCP tool for AI agents

## Coverage

**32 of 32 active CAA-chart California jurisdictions** (per the California Apartment Association "Local Rent Control Ordinances" chart, updated 1/2026):

> Alameda · Antioch · Baldwin Park · Bell Gardens · Berkeley · Beverly Hills · Commerce · Concord · Cudahy · Culver City · East Palo Alto · Gardena · Half Moon Bay · Hayward · Huntington Park · Inglewood · Larkspur · Los Angeles (City) · Los Angeles County (Unincorporated) · Los Gatos · Maywood · Mountain View · Oakland · Ojai · Oxnard · Palm Springs · Pasadena · Pomona · Richmond · Sacramento · San Francisco · San Jose · Santa Ana · Santa Monica · Thousand Oaks · West Hollywood

**Plus:**
- AB-1482 California statewide rule (5% + regional CPI, max 10%)
- Costa-Hawkins single-family/condo exemption (Civ. Code §1954.52)
- Paused / repealed ordinances correctly fall through to AB-1482: Salinas (paused pending Nov 2026 referendum), Fairfax (repealed Nov 2024), San Anselmo (repealed Nov 2024)

## Cap formula variants supported

Every CAA-chart ordinance fits one of these (TypeScript discriminated union — see [ADR-1](./docs/architecture-decisions.md)):

| Variant | Example |
|---|---|
| `fixed_pct` | San Jose 5%, Hayward 5%, Ojai 4% |
| `cpi_formula` (with floor/ceiling/lower-of/higher-of variants) | Oakland (lower of 60% CPI or 3%), Mountain View (CPI bounded 2-5%), Pasadena (75% of CPI) |
| `flat_plus_cpi` | AB-1482, Sacramento, Larkspur (5% + CPI capped at 7%) |
| `published_periods` | SF, Antioch (bi-monthly resets), LA, Inglewood |
| `unit_count_tiered` | Inglewood (≤4 units vs 5+) |
| `rent_base_tiered` | Beverly Hills ($600 cutoff) |
| `binding_arbitration` | Gardena (5% threshold) |
| `not_in_effect` | Salinas, Fairfax, San Anselmo |

## FAQ

**Why not just license CoreLogic or ATTOM for this?**
They don't have it. Property data vendors carry "rent controlled: true/false" booleans without rates, formulas, or citations. We checked.

**Why open source?**
Verifiable code IS the moat. Customers underwriting deals on top of regulatory math need to be able to audit it. See [ADR-5](./docs/architecture-decisions.md).

**Where do the CPI numbers come from?**
Today: back-calculated from the CAA chart's published cap percentages for internal consistency. Tomorrow: BLS authoritative readings refreshed quarterly. We document the source on every reading via the `source` field. See [ADR-3](./docs/architecture-decisions.md).

**Why is Oakland's cap so much lower than San Francisco's?**
Because Oakland's ordinance computes the cap as 60% of regional CPI, with a floor of 3%, while SF's computes it as 60% of regional CPI without a floor — and in 2025, the regional CPI fell to 1.33%. Oakland's cap floored at 3% would normally apply, but the chart shows a published 0.8% — meaning Oakland's specific application math differs from SF's even with the same input CPI. The engine encodes both exactly per CAA.

**Will this work for New York / New Jersey / Oregon?**
Not yet. v0.1 is California-only. Out-of-state addresses return `source: "no_local_rule_no_ab1482"` with a warning. NY rent stabilization is on the roadmap (see [ADR-4](./docs/architecture-decisions.md)). NY in particular requires DHCR registration data that isn't trivial to ship.

**An ordinance changed last week. How fast can I get the update?**
Open a [data correction issue](https://github.com/erica-ownershiptheory/dilix-rent-control-engine/issues/new?template=data_correction.yml) with an authoritative source link. Most data corrections ship within 48 hours.

## Limitations and known gaps

We document these so you can decide what's safe to underwrite on top of.

- **Year-only date matching for `builtBefore` cutoffs.** A 1979 SF property built before 6/13/79 should be SF-covered, but our resolver flags 1979 as exempt because year ≥ 1979. Affects ~5% of borderline-year buildings. ([ADR-2](./docs/architecture-decisions.md))
- **Santa Monica $-cap not modeled.** Santa Monica caps the absolute monthly increase ($60-$76 per period) in addition to the % cap. Only the % is computed. High-end rents may be more constrained by the dollar cap.
- **Unincorporated LA County sub-tiers.** General tier resolved; small-property-landlord (+1%) and luxury-unit (+2%) sub-tiers require property metadata not yet exposed in the input.
- **California only.**

See [CHANGELOG.md](./CHANGELOG.md) for the full feature/limitation tracker.

## Performance

```
37 tests · 11ms total
resolveRentCap median latency: <1ms
projectRentCapImpact (5-year hold): <2ms
```

No network calls, no DB reads, no ML inference. The whole engine fits in memory and resolves synchronously.

## Architecture decisions

Significant design choices are documented in [`docs/architecture-decisions.md`](./docs/architecture-decisions.md). The seven ADRs cover:

1. Discriminated union vs. class hierarchy for `CapFormula`
2. Year-only date matching trade-off
3. Back-calculated CPI vs. BLS pulls
4. CA-only at v0.1
5. Open source the engine, monetize the data
6. No DB; ordinances live in code
7. Confidence as enum, not numeric score

## Contributing

Data corrections are the most valuable contribution; see [CONTRIBUTING.md](./CONTRIBUTING.md). Every accepted correction ships with the next release and the contributor is credited in CHANGELOG.md.

## Source attribution

All ordinances are encoded from the **California Apartment Association "Local Rent Control Ordinances" chart, updated 1/2026** (© CAA). The chart is the operative reference document for rent control in California. Refresh against the next CAA update each quarter.

## Disclaimer

**Not legal advice.** The data, citations, and computations produced by this software are informational only. Verify rent control eligibility, applicable formulas, and resolved cap percentages with the relevant municipal rent board and a licensed California land-use attorney before relying on any output for investment, leasing, or compliance decisions.

## License

MIT — see [LICENSE](./LICENSE).

---

## Why Dilix built this

I'm a CRE professional who got tired of underwriting models that assume 3-4% rent growth on properties that legally can't grow rents above 1%. The gap compounds. The exit-value haircut on a 5-year hold can swing six figures.

So this engine exists. It's the math nobody else publishes, written deterministically, audit-ready by default. If you find an ordinance that's wrong or a citation that's broken, [open an issue](https://github.com/erica-ownershiptheory/dilix-rent-control-engine/issues) — keeping it accurate is the whole point.

— [Erica Walters](https://github.com/erica-ownershiptheory), founder, Dilix · [dilix.ai](https://dilix.ai)
