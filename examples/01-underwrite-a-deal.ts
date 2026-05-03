/**
 * Real-world example: underwriting a value-add multifamily deal in Oakland.
 *
 * Scenario: 1970-built 12-unit building, currently $300K annual GRI,
 * being underwritten with a 5-year hold and a 4% market growth assumption.
 *
 * The question: how much rent growth does the model lose to rent control?
 *
 * Run with: npx tsx examples/01-underwrite-a-deal.ts
 */

import { resolveRentCap, projectRentCapImpact } from "../src/index";

const property = {
  city: "Oakland",
  county: "Alameda",
  state: "CA",
  yearBuilt: 1970,
  unitCount: 12,
  propertyType: "multifamily_5plus" as const,
};

console.log("─── Snapshot: current period ───");
const cap = resolveRentCap(property);
console.log(`Cap: ${cap.capPct}%`);
console.log(`Source: ${cap.source}`);
console.log(`Citation: ${cap.citation}`);
console.log(`Effective: ${cap.effectiveStart} → ${cap.effectiveEnd}`);
console.log(`Why: ${cap.formulaExplanation}`);
console.log();

console.log("─── 5-year projection vs. unrestricted 4% market growth ───");
const projection = projectRentCapImpact(
  property,
  300_000, // base annual GRI
  5,
  4, // market growth assumption %
);

console.log(`Year-1 base GRI: $300,000`);
projection.projections.forEach((y) => {
  // capPct is null after the published period — the engine falls
  // through to market growth rather than guessing a future cap.
  // See README's "Limitations and known gaps".
  const capLabel =
    y.capPct == null ? "n/a (post-published)" : `${y.capPct}%`;
  console.log(
    `Year ${y.year}: cap=${capLabel} · ` +
      `cap-rent $${y.capProjectedRent.toLocaleString()} vs. ` +
      `market $${y.unrestrictedProjectedRent.toLocaleString()} · ` +
      `drag $${y.drag.toLocaleString()}`,
  );
});

console.log();
console.log(`Cumulative drag over hold: $${projection.cumulativeDrag.toLocaleString()}`);
console.log(
  `Year-5 exit haircut at 5.5% cap rate: ` +
    `$${Math.round(((projection.projections[4].unrestrictedProjectedRent - projection.projections[4].capProjectedRent) * 0.6) / 0.055).toLocaleString()}`,
);

// Real-world output for an Oakland 1970-built 12-unit:
//   Cap: 0.8%
//   Source: local_ordinance
//   Citation: Oakland Code of Ordinances §8.22.010 et seq.
//   Year 1: cap=0.8% · drag $9,600
//   Year 5: cap=0.8% · drag $46,000+
//   Cumulative drag over hold: ~$110,000
//
// Compare that against a model assuming 4% growth — that's a 6-figure gap
// the underwriter is losing if they ignore the cap. This is exactly what
// most CRE models miss.
