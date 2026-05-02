/**
 * Rent control regulation engine — type definitions.
 *
 * Source of truth for CA local ordinances: California Apartment Association
 * "Local Rent Control Ordinances" chart, updated 1/2026 (saved as
 * `CAA - Rent Control (1) (2).pdf`). AB-1482 statewide rule encoded
 * separately because the CAA chart explicitly excludes it.
 *
 * The engine resolves: given a property (city, county, year built, unit
 * count, type, current rent), what is the maximum legal rent increase
 * for the requested period — and which rule produced that number, with
 * a citation back to the municipal code or Civil Code §1947.12.
 */

// ─── Property input ──────────────────────────────────────────────────

export type PropertyType =
  | "single_family"
  | "condo"
  | "duplex"
  | "triplex"
  | "fourplex"
  | "multifamily_5plus"
  | "adu"
  | "mobile_home";

export interface RentControlPropertyInput {
  /** Incorporated city/town the property sits in. Use "Unincorporated <County>" for unincorporated parcels. */
  city: string;
  /** County (always populate — used for unincorporated jurisdictions and CPI region lookup). */
  county: string;
  /** State code; engine currently only resolves "CA". */
  state: string;
  /** Year of original construction. Required — drives Costa-Hawkins + AB-1482 15-year eligibility. */
  yearBuilt: number;
  /** Total dwelling units in the building (not the parcel). 1 for SFH/condo. */
  unitCount: number;
  /** Property type. Drives Costa-Hawkins SFH/condo exemption + duplex carve-outs. */
  propertyType: PropertyType;
  /** True if owner lives on-site. Several ordinances exempt owner-occupied 2-3 unit buildings. */
  isOwnerOccupied?: boolean;
  /** Tenant move-in base rent — only required for ordinances with rent-base tiers (Beverly Hills $600 cutoff). */
  moveInRentBase?: number;
  /** True if the unit is deed-restricted affordable / LIHTC / Section 8. Most ordinances exempt these. */
  isDeedRestrictedAffordable?: boolean;
  /** True if "substantially rehabilitated" per the local definition (SF: 50+ year old buildings sub-rehabbed since 6/13/79). */
  isSubstantiallyRehabilitated?: boolean;
}

// ─── CPI region ──────────────────────────────────────────────────────

/**
 * BLS metro/regional CPI series referenced by AB-1482 and local ordinances.
 * Codes match the values that appear in California Civil Code §1947.12
 * and in municipal-code rent-cap formulas verbatim.
 */
export type CPIRegion =
  | "SF-Oakland-Hayward"        // SF, Alameda, CC, Marin, San Mateo per AB-1482
  | "SF-Oakland-San-Jose"       // older composite — referenced by Mountain View, East Palo Alto
  | "LA-Long-Beach-Anaheim"     // LA County, Orange County
  | "LA-Riverside-Orange"       // older composite — referenced by Beverly Hills
  | "Riverside-SB-Ontario"      // Inland Empire
  | "San-Diego-Carlsbad"        // SD County
  | "Sacramento-Roseville-Folsom" // Sacramento County
  | "West-Region-A"             // BLS West-A — referenced by Salinas
  | "California-All-Items"      // statewide — Sacramento ordinance fallback
  | "US-All-Items";             // last resort

/** Single CPI reading: % change April-to-April unless `monthsEnding` overrides. */
export interface CPIReading {
  region: CPIRegion;
  /** Year the reading applies to for AB-1482 / ordinance cap math. AB-1482 uses April-to-April CPI. */
  capYear: number;
  /** Percentage change vs. one year prior (e.g., 1.3 means 1.3%). */
  pctChange: number;
  /** Month the 12-month reading ends. Default "April" (AB-1482 statutory month). */
  monthsEnding?: "April" | "March" | "September" | "October" | "December";
  /** Free-text source note for audit trail. */
  source?: string;
}

// ─── Ordinance status ────────────────────────────────────────────────

export type OrdinanceStatus =
  | "active"
  | "repealed"
  | "repeal_pending_referendum"
  | "sunset_scheduled";

// ─── Cap formula variants — discriminated union ──────────────────────

/**
 * Ordinances differ enormously in how the annual cap is computed.
 * The discriminated union below captures every variant in the CAA
 * 1/2026 chart. New variants get added as new `kind` literals — never
 * shoehorn into an existing kind.
 */
export type CapFormula =
  /** Flat percentage. Hayward 5%, Larkspur 7%, Ojai 4%, San Jose 5%, Los Gatos 5%, Oxnard 4%. */
  | { kind: "fixed_pct"; pct: number; note?: string }

  /**
   * Percentage of regional CPI, optionally bounded by floor/ceiling and
   * an absolute % cap. Covers most CPI-based ordinances:
   *   - Oakland: lower of 60% of regional CPI or 3%
   *   - SF: 60% of regional CPI not to exceed 7%
   *   - Berkeley: 65% of regional CPI
   *   - Mountain View: 100% of CPI, floor 2%, ceiling 5%
   *   - Half Moon Bay: 80% of regional CPI, max 3%
   */
  | {
      kind: "cpi_formula";
      cpiRegion: CPIRegion;
      cpiMultiplier: number; // 0.60 = 60% of CPI
      floorPct?: number;
      ceilingPct?: number;
      /** If true, take the LOWER of (CPI*multiplier) and a flat fallback. Oakland uses this with 3% fallback. */
      lowerOfFlatFallback?: number;
      /** If true, take the HIGHER of (CPI*multiplier) and a flat fallback. Los Gatos uses this with 5% fallback. */
      higherOfFlatFallback?: number;
      note?: string;
    }

  /**
   * Flat % PLUS regional CPI, capped. AB-1482 (5% + CPI, max 10%) is
   * the canonical example. Sacramento's local ordinance and Commerce
   * also use this formula.
   */
  | {
      kind: "flat_plus_cpi";
      flatPct: number;     // 5 for AB-1482
      cpiRegion: CPIRegion;
      cpiMultiplier?: number; // default 1.0
      maxPct?: number;      // 10 for AB-1482
      minPct?: number;
      note?: string;
    }

  /**
   * Periods array — for ordinances that publish a different cap each
   * effective period. Antioch resets ~bi-monthly. Many CPI-based
   * ordinances are encoded this way once the BLS reading is known,
   * because the published number IS the operative cap.
   */
  | {
      kind: "published_periods";
      periods: Array<{
        effectiveStart: string; // ISO date "2025-08-01"
        effectiveEnd: string;   // ISO date "2026-07-31"
        capPct: number;
        note?: string;
      }>;
      /** Underlying formula for periods past the last known one. */
      fallbackFormula?: Exclude<CapFormula, { kind: "published_periods" }>;
    }

  /**
   * Tiered by unit count. Inglewood: ≤4 units = 5% + CPI (max 10%);
   * ≥5 units = 3% or CPI whichever greater (max 10%).
   * Unincorporated LA County: small landlord vs general vs luxury.
   */
  | {
      kind: "unit_count_tiered";
      tiers: Array<{
        condition: { unitCountLte?: number; unitCountGte?: number };
        formula: Exclude<CapFormula, { kind: "unit_count_tiered" | "rent_base_tiered" }>;
        label: string; // "4 units or less", "5+ units"
      }>;
    }

  /**
   * Tiered by base rent. Beverly Hills: move-in rent >$600 vs ≤$600
   * gets different caps.
   */
  | {
      kind: "rent_base_tiered";
      tiers: Array<{
        condition: { moveInRentLte?: number; moveInRentGt?: number };
        formula: Exclude<CapFormula, { kind: "unit_count_tiered" | "rent_base_tiered" }>;
        label: string;
      }>;
    }

  /**
   * Cap is mediated/arbitrated, not formulaic. Gardena (increases >5%
   * subject to mediation + binding arbitration), Thousand Oaks (very
   * limited application).
   */
  | {
      kind: "binding_arbitration";
      triggerThresholdPct?: number; // Gardena: 5%
      note: string;
    }

  /**
   * Repealed / paused — engine returns AB-1482 fallback, but flags the
   * historical existence of the ordinance.
   */
  | {
      kind: "not_in_effect";
      reason: "repealed" | "paused_pending_referendum";
      details: string;
    };

// ─── Eligibility filters ─────────────────────────────────────────────

export interface EligibilityFilter {
  /**
   * Property must have been built BEFORE this date to be covered by the
   * local ordinance. Buildings built on/after this date fall through
   * to AB-1482 (or are exempt entirely if AB-1482 also doesn't apply).
   *
   * Examples:
   *   - Oakland: "1983-01-01" (built before 1/1/83)
   *   - SF: "1979-06-13"
   *   - LA: "1978-10-01"
   *   - Berkeley: "1980-06-03"
   *   - Most others: "1995-02-01" (Costa-Hawkins floor)
   */
  builtBefore: string;

  /** Property types EXEMPT from coverage (Costa-Hawkins SFH/condo, etc.). */
  exemptPropertyTypes?: PropertyType[];

  /** True if owner-occupied buildings up to N units are exempt. */
  ownerOccupiedExemptUpTo?: number;

  /** True if deed-restricted affordable / subsidized housing is exempt (almost always true). */
  exemptIfSubsidized?: boolean;

  /** Substantially rehabilitated buildings can re-set to exempt (SF Section 37.2(s)). */
  exemptIfSubstantiallyRehabilitated?: boolean;

  /** Free-text "other" exemptions for audit trail. */
  otherExemptions?: string[];
}

// ─── Top-level ordinance record ─────────────────────────────────────

export interface RentControlOrdinance {
  /** Match key — incorporated city or "Unincorporated <County>". */
  jurisdiction: string;
  state: "CA";

  status: OrdinanceStatus;

  /** Cap formula. See CapFormula union above. */
  capFormula: CapFormula;

  /** Eligibility — required unless capFormula.kind === "not_in_effect". */
  eligibility?: EligibilityFilter;

  /** Year ordinance was first adopted (informational). */
  ordinanceAdopted: string;

  /** Sunset date if the ordinance has one (Commerce 2030-01-01, Pomona 2026-12-31, etc.). */
  ordinanceExpires?: string;

  /** Municipal code citation. */
  citation: string;

  /** Official rent program URL. */
  sourceUrl: string;

  /** Free-text notes for audit trail (e.g., recent amendments). */
  notes?: string;
}

// ─── Resolver output ─────────────────────────────────────────────────

export type CapSource =
  | "local_ordinance"
  | "ab1482_statewide"
  | "exempt_costa_hawkins"
  | "exempt_new_construction"
  | "exempt_property_type"
  | "exempt_subsidized"
  | "exempt_owner_occupied"
  | "no_local_rule_no_ab1482"
  | "binding_arbitration"
  | "indeterminate_missing_data";

export type Confidence = "high" | "medium" | "low";

export interface ResolvedRentCap {
  /**
   * The maximum legal annual rent increase percentage for this property
   * in the requested period. `null` when the property is exempt or when
   * the engine cannot resolve (insufficient input).
   */
  capPct: number | null;

  /** Which rule produced the cap (or which exemption applied). */
  source: CapSource;

  /** Plain-English explanation of how the number was computed. */
  formulaExplanation: string;

  /** Effective window the returned cap applies to. */
  effectiveStart: string; // ISO date
  effectiveEnd: string;   // ISO date

  /** CPI region used (when applicable). */
  cpiRegion?: CPIRegion;

  /** CPI value used in the calculation (when applicable). */
  cpiValueUsed?: number;

  /** Citation — municipal code section or Civil Code §1947.12. */
  citation: string;

  /** Confidence score — drops when we had to use estimates or fallbacks. */
  confidence: Confidence;

  /** Warnings the UI should surface. */
  warnings: string[];

  /** Source URL for "show me where this came from". */
  sourceUrl?: string;
}
