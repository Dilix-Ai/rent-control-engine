/**
 * Regional CPI readings used by AB-1482 + local CPI-formula ordinances.
 *
 * Values back-calculated from the CAA 1/2026 chart's published caps to
 * stay internally consistent (e.g., Oakland's 0.8% cap for 8/1/25-7/31/26
 * implies SF-Oakland-Hayward April 2025 CPI = 1.33%, which yields the
 * 6.33% AB-1482 cap Erica cited for San Mateo County).
 *
 * Refresh cadence: pull authoritative BLS readings each May (April CPI
 * release) + November (October CPI release for some ordinances). When
 * refreshing, reconcile against the next CAA chart update.
 */

import type { CPIReading, CPIRegion } from "./types.js";

/** April-to-April CPI readings — the source month AB-1482 references. */
export const CPI_READINGS: CPIReading[] = [
  // ── SF-Oakland-Hayward (used by AB-1482 for SF, Alameda, CC, Marin, San Mateo) ──
  {
    region: "SF-Oakland-Hayward",
    capYear: 2024,
    pctChange: 3.83,
    monthsEnding: "April",
    source: "Back-calculated from Oakland 8/1/24-7/31/25 cap of 2.3% (60% of CPI)",
  },
  {
    region: "SF-Oakland-Hayward",
    capYear: 2025,
    pctChange: 1.33,
    monthsEnding: "April",
    source: "Back-calculated from Oakland 8/1/25-7/31/26 cap of 0.8% (60% of CPI). Yields AB-1482 cap of 6.33% for SF-Oakland-Hayward region — matches San Mateo County reading.",
  },

  // ── SF-Oakland-San-Jose (Santa Clara County — AB-1482 region for San Jose metro) ──
  {
    region: "SF-Oakland-San-Jose",
    capYear: 2024,
    pctChange: 2.4,
    monthsEnding: "April",
    source:
      "Estimate — back-calculated from Mountain View 9/1/24-8/31/25 cap of 2.4% (100% of CPI, bounded 2-5%). Verify against BLS San Jose-Sunnyvale-Santa Clara MSA at next refresh.",
  },
  {
    region: "SF-Oakland-San-Jose",
    capYear: 2025,
    pctChange: 2.7,
    monthsEnding: "April",
    source:
      "Estimate — back-calculated from Mountain View 9/1/25-8/31/26 cap of 2.7%. Verify against BLS San Jose-Sunnyvale-Santa Clara MSA at next refresh.",
  },

  // ── LA-Long Beach-Anaheim (used by AB-1482 for LA County, Orange County) ──
  {
    region: "LA-Long-Beach-Anaheim",
    capYear: 2024,
    pctChange: 3.9,
    monthsEnding: "April",
    source: "Back-calculated from Commerce 8/1/24-7/31/25 cap of 8.9% (5% + CPI). Also matches Inglewood ≤4 units 8.9%.",
  },
  {
    region: "LA-Long-Beach-Anaheim",
    capYear: 2025,
    pctChange: 3.0,
    monthsEnding: "April",
    source: "Back-calculated from Commerce 8/1/25-7/31/26 cap of 8% (5% + CPI). Also matches Inglewood ≤4 units 8%.",
  },

  // ── Riverside-SB-Ontario (Inland Empire, AB-1482 only) ──
  {
    region: "Riverside-SB-Ontario",
    capYear: 2024,
    pctChange: 3.5,
    monthsEnding: "April",
    source: "Estimate — verify against BLS at next refresh",
  },
  {
    region: "Riverside-SB-Ontario",
    capYear: 2025,
    pctChange: 3.0,
    monthsEnding: "April",
    source: "Estimate — verify against BLS at next refresh",
  },

  // ── San Diego-Carlsbad ──
  {
    region: "San-Diego-Carlsbad",
    capYear: 2024,
    pctChange: 3.0,
    monthsEnding: "April",
    source: "Estimate — verify against BLS at next refresh",
  },
  {
    region: "San-Diego-Carlsbad",
    capYear: 2025,
    pctChange: 2.8,
    monthsEnding: "April",
    source: "Estimate — verify against BLS at next refresh",
  },

  // ── LA-Riverside-Orange (older composite — referenced by Beverly Hills) ──
  {
    region: "LA-Riverside-Orange",
    capYear: 2024,
    pctChange: 3.5,
    monthsEnding: "April",
    source: "Estimate — back-calculated from Beverly Hills 3.27% (≤$600 tier = lesser of 8% or CPI). Verify against BLS.",
  },
  {
    region: "LA-Riverside-Orange",
    capYear: 2025,
    pctChange: 3.27,
    monthsEnding: "April",
    source: "Back-calculated from Beverly Hills 3.27% (≤$600 tier = lesser of 8% or CPI; CPI < 8% so CPI is binding).",
  },

  // ── West-Region-A (Salinas — currently paused) ──
  {
    region: "West-Region-A",
    capYear: 2025,
    pctChange: 3.7,
    monthsEnding: "April",
    source: "Estimate — Salinas ordinance paused pending referendum, so unused at present.",
  },

  // ── Sacramento-Roseville-Folsom (Sacramento city ordinance uses California All-Items) ──
  {
    region: "California-All-Items",
    capYear: 2024,
    pctChange: 3.8,
    monthsEnding: "April",
    source: "Back-calculated from Sacramento 7/1/24-6/30/25 cap of 8.8% (5% + cost-of-living, max 10%)",
  },
  {
    region: "California-All-Items",
    capYear: 2025,
    pctChange: 2.7,
    monthsEnding: "April",
    source: "Back-calculated from Sacramento 7/1/25-6/30/26 cap of 7.7% (5% + cost-of-living, max 10%)",
  },
];

/**
 * California county → AB-1482 CPI region. Drives statewide-fallback math
 * for jurisdictions outside the 39 CAA-chart cities.
 *
 * Source: BLS metro definitions + Civil Code §1947.12(h)(1) regional
 * reference language.
 */
export const CA_COUNTY_TO_CPI_REGION: Record<string, CPIRegion> = {
  // Bay Area
  "San Francisco": "SF-Oakland-Hayward",
  "Alameda": "SF-Oakland-Hayward",
  "Contra Costa": "SF-Oakland-Hayward",
  "Marin": "SF-Oakland-Hayward",
  "San Mateo": "SF-Oakland-Hayward",
  "Santa Clara": "SF-Oakland-San-Jose",
  "Solano": "SF-Oakland-Hayward",
  "Sonoma": "SF-Oakland-Hayward",
  "Napa": "SF-Oakland-Hayward",

  // LA / Orange
  "Los Angeles": "LA-Long-Beach-Anaheim",
  "Orange": "LA-Long-Beach-Anaheim",

  // Inland Empire
  "Riverside": "Riverside-SB-Ontario",
  "San Bernardino": "Riverside-SB-Ontario",

  // San Diego
  "San Diego": "San-Diego-Carlsbad",

  // Central + everything else falls back to CA all-items
  "Sacramento": "California-All-Items",
  "Placer": "California-All-Items",
  "El Dorado": "California-All-Items",
  "Yolo": "California-All-Items",
  "Fresno": "California-All-Items",
  "Kern": "California-All-Items",
  "Tulare": "California-All-Items",
  "Stanislaus": "California-All-Items",
  "San Joaquin": "California-All-Items",
  "Monterey": "California-All-Items",
  "Santa Cruz": "California-All-Items",
  "Santa Barbara": "California-All-Items",
  "Ventura": "California-All-Items",
};

/**
 * Look up the most recent CPI reading for a region as of the given date.
 * AB-1482 lease year for a property runs Aug 1 → Jul 31; the operative
 * CPI is the April reading PRIOR to the lease year start.
 *   - For Aug 1, 2024 lease year → April 2024 reading
 *   - For Aug 1, 2025 lease year → April 2025 reading
 */
export function getCPIReading(region: CPIRegion, asOfDate: Date): CPIReading | null {
  const year = asOfDate.getFullYear();
  const month = asOfDate.getMonth(); // 0-indexed
  // AB-1482 lease year flips on Aug 1; before Aug 1, use prior year's April reading.
  const capYear = month >= 7 ? year : year - 1;

  return (
    CPI_READINGS.find((r) => r.region === region && r.capYear === capYear) ??
    CPI_READINGS.find((r) => r.region === region && r.capYear === capYear - 1) ?? // fallback to prior year if newest not yet published
    null
  );
}

export function getCPIRegionForCounty(county: string): CPIRegion {
  return CA_COUNTY_TO_CPI_REGION[county] ?? "California-All-Items";
}
