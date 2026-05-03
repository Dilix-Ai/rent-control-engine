/**
 * Real-world example: screening a small portfolio for rent control exposure.
 *
 * Scenario: a buyer is evaluating a 5-property portfolio across the Bay Area
 * + LA County. Quick first pass to see which properties have the most
 * regulatory drag.
 *
 * Run with: npx tsx examples/02-screen-a-portfolio.ts
 */

import { resolveRentCap } from "../src/index";

const portfolio = [
  { name: "Mission St 4-plex (SF)", city: "San Francisco", county: "San Francisco", state: "CA", yearBuilt: 1925, unitCount: 4, propertyType: "fourplex" as const },
  { name: "Lakeshore 12-plex (Oakland)", city: "Oakland", county: "Alameda", state: "CA", yearBuilt: 1965, unitCount: 12, propertyType: "multifamily_5plus" as const },
  { name: "Burlingame duplex", city: "Burlingame", county: "San Mateo", state: "CA", yearBuilt: 1960, unitCount: 2, propertyType: "duplex" as const },
  { name: "Crenshaw 8-unit (LA)", city: "Los Angeles", county: "Los Angeles", state: "CA", yearBuilt: 1972, unitCount: 8, propertyType: "multifamily_5plus" as const },
  { name: "Foster City 10-plex", city: "Foster City", county: "San Mateo", state: "CA", yearBuilt: 1985, unitCount: 10, propertyType: "multifamily_5plus" as const },
];

console.log("─── Portfolio rent control screen ───");
console.log();

const screened = portfolio.map((p) => {
  const cap = resolveRentCap(p);
  return { name: p.name, capPct: cap.capPct, source: cap.source, citation: cap.citation };
});

screened
  .sort((a, b) => (a.capPct ?? 99) - (b.capPct ?? 99))
  .forEach((row) => {
    const capStr = row.capPct == null ? "EXEMPT" : `${row.capPct}%`.padStart(6);
    console.log(`${capStr}  ${row.name}`);
    console.log(`        ${row.source} · ${row.citation}`);
    console.log();
  });

// Output (current periods):
//
//   0.8%   Lakeshore 12-plex (Oakland)
//          local_ordinance · Oakland Code of Ordinances §8.22.010 et seq.
//
//   1.4%   Mission St 4-plex (SF)
//          local_ordinance · San Francisco Administrative Code §37.1
//
//   3.0%   Crenshaw 8-unit (LA)
//          local_ordinance · LA Municipal Code §§151.00 - 155.09
//
//   6.3%   Foster City 10-plex
//          ab1482_statewide · Civ. Code §1947.12
//
//   EXEMPT Burlingame duplex
//          exempt_costa_hawkins · Civ. Code §1954.52
//
// The top of the list is where the underwriter's growth assumptions
// will be most wrong. The Oakland building's 0.8% cap vs. a 4% market
// assumption is a 320-bps annual gap — over a 5-year hold, that's
// six figures of foregone rent the model overcounts.
