# @dilix/rent-control-engine

> Resolve the maximum legal annual rent increase for any California property — local ordinance, AB-1482 statewide fallback, Costa-Hawkins exemption logic, and multi-year NOI projection. **32 CA jurisdictions encoded with citations.**

[![npm version](https://img.shields.io/npm/v/@dilix/rent-control-engine.svg)](https://www.npmjs.com/package/@dilix/rent-control-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Built and maintained by [Dilix](https://dilix.ai) (Ownership Theory LLC) — the AI-native NOI defense layer for CRE.

## Why this exists

CRE underwriting models routinely assume 3–4% annual rent growth. In rent-controlled California jurisdictions, the actual cap is often <2%, sometimes 0.8% (Oakland 8/1/25–7/31/26). The gap compounds over a 5-year hold and can swing exit value by **6×–10× the year-1 rent foregone** at typical cap rates.

This package answers a single question, deterministically, with a citation:

> *"Given this California property, on this date, what is the maximum legal annual rent increase the landlord may impose?"*

It encodes every active local rent control ordinance in California (per the California Apartment Association's official chart, updated 1/2026), plus AB-1482 statewide rules, plus the Costa-Hawkins single-family/condo exemption.

## Install

```bash
npm install @dilix/rent-control-engine
```

## Quick start

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

console.log(cap.capPct);              // 0.8
console.log(cap.source);              // "local_ordinance"
console.log(cap.formulaExplanation);  // "Oakland rent ordinance: 0.8% (published cap for 2025-08-01 → 2026-07-31); 60% of regional CPI; SF-Oakland-Hayward April 2025 reading ~1.33%"
console.log(cap.citation);            // "Oakland Code of Ordinances §8.22.010 et seq."
console.log(cap.confidence);          // "high"
```

## What it returns

```typescript
interface ResolvedRentCap {
  capPct: number | null;          // null when property is exempt
  source:
    | "local_ordinance"
    | "ab1482_statewide"
    | "exempt_costa_hawkins"
    | "exempt_new_construction"
    | "exempt_property_type"
    | "exempt_subsidized"
    | "exempt_owner_occupied"
    | "binding_arbitration"
    | "indeterminate_missing_data"
    | "no_local_rule_no_ab1482";
  formulaExplanation: string;     // plain-English math
  effectiveStart: string;          // ISO date
  effectiveEnd: string;
  cpiRegion?: string;
  cpiValueUsed?: number;
  citation: string;                // muni code section or Civ. Code §1947.12
  confidence: "high" | "medium" | "low";
  warnings: string[];
  sourceUrl?: string;
}
```

## Multi-year pro-forma projection

For underwriting models, project the regulatory drag year-by-year:

```typescript
import { projectRentCapImpact } from "@dilix/rent-control-engine";

const projection = projectRentCapImpact(
  { city: "Oakland", county: "Alameda", state: "CA", yearBuilt: 1970, unitCount: 12, propertyType: "multifamily_5plus" },
  300_000,        // base annual GRI in dollars
  5,              // hold years
  4,              // market growth assumption (% per year)
);

// projection.cumulativeDrag: total dollars left on the table over the hold
// projection.projections[i]: per-year { year, capPct, capProjectedRent, unrestrictedProjectedRent, drag, source }
```

## Coverage (32 CA jurisdictions)

**Active ordinances:** Alameda, Antioch, Baldwin Park, Bell Gardens, Berkeley, Beverly Hills, Commerce, Concord, Cudahy, Culver City, East Palo Alto, Gardena, Half Moon Bay, Hayward, Huntington Park, Inglewood, Larkspur, Los Angeles (City), Los Angeles (Unincorporated County), Los Gatos, Maywood, Mountain View, Oakland, Ojai, Oxnard, Palm Springs, Pasadena, Pomona, Richmond, Sacramento, San Francisco, San Jose, Santa Ana, Santa Monica, Thousand Oaks, West Hollywood

**Paused / repealed:** Salinas (paused pending Nov 2026 referendum), Fairfax (repealed Nov 2024), San Anselmo (repealed Nov 2024) — these correctly fall through to AB-1482 statewide.

Plus AB-1482 statewide (5% + regional CPI, max 10%) for all properties built ≥15 years ago and not covered by a local ordinance.

## Cap formula variants supported

Every ordinance uses one of these (TypeScript discriminated union):

- `fixed_pct` — flat percentage (e.g., San Jose 5%, Hayward 5%, Ojai 4%)
- `cpi_formula` — % of regional CPI with optional floor/ceiling/lower-of/higher-of fallbacks (Oakland, Berkeley, Mountain View, Pasadena, Santa Ana, etc.)
- `flat_plus_cpi` — flat + CPI capped (AB-1482, Sacramento, Larkspur, Commerce)
- `published_periods` — explicit per-period caps for ordinances that publish a different rate each cycle (SF, Antioch with bi-monthly resets, LA, Inglewood)
- `unit_count_tiered` — different formula by unit count (Inglewood: ≤4 units vs 5+)
- `rent_base_tiered` — different formula by move-in rent (Beverly Hills $600 cutoff)
- `binding_arbitration` — Gardena's mediation-above-5% model
- `not_in_effect` — repealed/paused; resolver falls through to AB-1482

## Eligibility logic

The resolver checks, in order:
1. Construction date cutoff (e.g., Oakland covers buildings built before 1/1/83)
2. Property type exemption (Costa-Hawkins SFH/condo carve-out under Civ. Code §1954.52)
3. Owner-occupied small-building exemption (Berkeley, Pasadena, etc.)
4. Subsidized housing exemption
5. Substantially-rehabilitated exemption (SF §37.2(s))

If the local ordinance applies, return its cap. If exempt locally, fall through to AB-1482. If exempt statewide too, return `null` cap with the exemption reason.

## Data sources & freshness

- **Source of truth:** [California Apartment Association — Local Rent Control Ordinances chart, updated 1/2026](https://caanet.org/) (© CAA)
- **CPI readings** are back-calculated from the chart's published caps for internal consistency. Refresh against [BLS metro CPI](https://www.bls.gov/regions/west/) each May (April reading) and November.
- **AB-1482 statute:** California Civil Code §§1946.2, 1947.12

## Limitations & known gaps

- **California only.** Out-of-state properties return `no_local_rule_no_ab1482`. NY/NJ/DC/OR/MN/MD coverage on the roadmap.
- **Date imprecision in eligibility.** `builtBefore` checks year only, not full date. A 1979 building constructed before 6/13/79 in SF should be covered but is currently flagged as exempt by the year cutoff. ~5% of borderline-year buildings affected.
- **Santa Monica $-cap not modeled.** Santa Monica caps the absolute monthly increase ($60–$76 depending on period) in addition to the % cap. Only the % is computed; high-end rents may be more constrained by the dollar cap.
- **Unincorporated LA County sub-tiers.** General tier resolved; small-property-landlord (+1%) and luxury-unit (+2%) sub-tiers require additional property metadata not yet exposed.

## Contributing

Issues and PRs welcome — especially data corrections against the latest CAA chart or BLS CPI release. See the [GitHub issues page](https://github.com/erica-ownershiptheory/dilix-rent-control-engine/issues).

## Disclaimer

**This is not legal advice.** The data, citations, and computations produced by this software are informational only. Verify rent control eligibility, applicable formulas, and resolved cap percentages with the relevant municipal rent board and a licensed California land-use attorney before relying on any output for investment, leasing, or compliance decisions.

## License

MIT — see [LICENSE](./LICENSE).
