/**
 * AB-1482 — California Tenant Protection Act of 2019.
 * Civil Code §1947.12.
 *
 * Statewide rent cap that applies when no stricter local ordinance covers
 * the property. The CAA chart explicitly excludes AB-1482, so we encode
 * it separately as the fallback rule.
 *
 * Formula: lower of
 *   (a) 5% + percentage change in regional CPI (April-to-April), OR
 *   (b) 10%
 *
 * Eligibility: residential rental, 2+ units OR ADU on parcel with rented
 * primary, NOT exempt SFH/condo per Costa-Hawkins, built ≥15 years ago
 * (rolling), NOT deed-restricted affordable, NOT subject to stricter
 * local ordinance.
 */

import type { RentControlOrdinance, EligibilityFilter } from "./types";

export const AB1482_MAX_CAP_PCT = 10;
export const AB1482_FLAT_COMPONENT_PCT = 5;
export const AB1482_BUILT_BEFORE_YEARS_AGO = 15;

/**
 * AB-1482 eligibility — subtractive logic. A property is COVERED if and
 * only if all of these are true:
 *   1. yearBuilt is at least 15 years ago (rolling)
 *   2. unitCount >= 2 (or unit is an ADU on a multi-unit parcel)
 *   3. propertyType is NOT exempt SFH or condo (Costa-Hawkins)
 *   4. NOT deed-restricted affordable
 *   5. NOT a mobile home
 *
 * `localOrdinanceCoversIt = true` does NOT disqualify — we still want
 * the AB-1482 number for comparison, but the resolver returns the
 * stricter one.
 */
export function ab1482EligibilityAsOf(asOfDate: Date): EligibilityFilter {
  const cutoffYear = asOfDate.getFullYear() - AB1482_BUILT_BEFORE_YEARS_AGO;
  return {
    builtBefore: `${cutoffYear}-01-01`,
    exemptPropertyTypes: ["single_family", "condo", "mobile_home"],
    exemptIfSubsidized: true,
    otherExemptions: [
      "Single-family rentals separately alienable from any other dwelling unit (Costa-Hawkins)",
      "Condominiums separately alienable from any other dwelling unit (Costa-Hawkins)",
      "Buildings less than 15 years old (rolling)",
      "Deed-restricted affordable / LIHTC / Section 8",
      "Dormitories operated by higher education institutions",
      "Owner-occupied duplex where owner lives in one unit",
    ],
  };
}

/**
 * AB-1482 ordinance record. Exposed as a fallback "ordinance" so the
 * resolver can pass it through the same code path as local rules.
 */
export const AB1482_ORDINANCE: RentControlOrdinance = {
  jurisdiction: "California (statewide)",
  state: "CA",
  status: "active",
  capFormula: {
    kind: "flat_plus_cpi",
    flatPct: AB1482_FLAT_COMPONENT_PCT,
    cpiRegion: "SF-Oakland-Hayward", // resolver overrides per-property based on county
    cpiMultiplier: 1.0,
    maxPct: AB1482_MAX_CAP_PCT,
    note:
      "AB-1482 (Civil Code §1947.12) — 5% + percentage change in regional CPI (April-to-April), max 10%. Region varies by property county.",
  },
  // eligibility intentionally omitted at the literal level — computed per-asOfDate via ab1482EligibilityAsOf().
  ordinanceAdopted: "2019-10-08",
  ordinanceExpires: "2030-01-01", // sunset — Civil Code §1947.12(j)
  citation: "Cal. Civ. Code §1947.12",
  sourceUrl:
    "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1947.12",
  notes:
    "Statewide tenant protection. Sunsets 1/1/2030 unless re-authorized. Lease year starts 8/1; cap uses preceding April CPI reading.",
};
