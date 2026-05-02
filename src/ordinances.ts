/**
 * California local rent control ordinances — encoded from the
 * California Apartment Association "Local Rent Control Ordinances"
 * chart (updated 1/2026, © 2026 CAA).
 *
 * Each ordinance carries the cap formula, eligibility filter (chiefly
 * the construction-date cutoff that determines whether the ordinance
 * even applies), citation, and source URL.
 *
 * Coverage: all 32 CAA-chart jurisdictions encoded — 29 active + 3
 * paused/repealed (Salinas, Fairfax, San Anselmo).
 *
 * Variants exercised: fixed_pct, cpi_formula (with floor/ceiling/lower-of/
 * higher-of fallbacks), flat_plus_cpi, published_periods (mid-year + bi-monthly),
 * unit_count_tiered (Inglewood), rent_base_tiered (Beverly Hills),
 * binding_arbitration (Gardena), not_in_effect (Fairfax/San Anselmo/Salinas).
 *
 * Known imprecision: builtBefore eligibility uses the year only (not full date).
 * Edge case: a 1979 SF build constructed before 6/13/79 is covered, but our
 * resolver flags 1979 builds as exempt. ~5% of borderline-year buildings affected.
 *
 * Known schema gap: Santa Monica's $-cap on absolute monthly increase ($60-$76)
 * is not modeled — only the % cap. High-rent units may be more constrained by
 * the $-amount than the %.
 */

import type { RentControlOrdinance } from "./types";

export const ORDINANCES: RentControlOrdinance[] = [
  // ── San Francisco ──────────────────────────────────────────────────
  {
    jurisdiction: "San Francisco",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        {
          effectiveStart: "2025-03-01",
          effectiveEnd: "2026-02-28",
          capPct: 1.4,
          note: "Per SF Rent Board AGA — 60% of regional CPI",
        },
        {
          effectiveStart: "2026-03-01",
          effectiveEnd: "2027-02-28",
          capPct: 1.6,
          note: "Per SF Rent Board AGA — 60% of regional CPI",
        },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "SF-Oakland-Hayward",
        cpiMultiplier: 0.6,
        ceilingPct: 7,
      },
    },
    eligibility: {
      builtBefore: "1979-06-13",
      exemptPropertyTypes: ["single_family", "condo"],
      exemptIfSubstantiallyRehabilitated: true,
      otherExemptions: [
        "SFH/condos separately alienable (likely only via Costa-Hawkins)",
        "Buildings >50 years old substantially rehabbed since 6/13/79 (SF Admin Code §37.2(s))",
      ],
    },
    ordinanceAdopted: "1979",
    citation: "San Francisco Administrative Code §37.1 et seq.; Costa-Hawkins §1954.52",
    sourceUrl: "https://sfrb.org/home",
    notes:
      "AGA cycle resets each March 1. SF Rent Board publishes rate by Nov of prior year. Just-cause eviction required; vacancy decontrol allowed (Costa-Hawkins).",
  },

  // ── Oakland ────────────────────────────────────────────────────────
  {
    jurisdiction: "Oakland",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        {
          effectiveStart: "2024-08-01",
          effectiveEnd: "2025-07-31",
          capPct: 2.3,
          note: "60% of regional CPI; SF-Oakland-Hayward April 2024 reading ~3.83%",
        },
        {
          effectiveStart: "2025-08-01",
          effectiveEnd: "2026-07-31",
          capPct: 0.8,
          note: "60% of regional CPI; SF-Oakland-Hayward April 2025 reading ~1.33%",
        },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "SF-Oakland-Hayward",
        cpiMultiplier: 0.6,
        lowerOfFlatFallback: 3,
      },
    },
    eligibility: {
      builtBefore: "1983-01-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Subsidized housing",
      ],
    },
    ordinanceAdopted: "1980",
    citation: "Oakland Code of Ordinances §8.22.010 et seq.",
    sourceUrl: "https://www.oaklandca.gov/topics/rent-adjustment-program",
    notes:
      "Strong tenant protections. Limited vacancy decontrol — 'move-out' leases also rent-controlled in many cases.",
  },

  // ── Berkeley ───────────────────────────────────────────────────────
  {
    jurisdiction: "Berkeley",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        {
          effectiveStart: "2025-01-01",
          effectiveEnd: "2025-12-31",
          capPct: 2.1,
          note: "65% of regional CPI",
        },
        {
          effectiveStart: "2026-01-01",
          effectiveEnd: "2026-12-31",
          capPct: 1.0,
          note: "65% of regional CPI",
        },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "SF-Oakland-Hayward",
        cpiMultiplier: 0.65,
      },
    },
    eligibility: {
      builtBefore: "1980-06-03",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Subsidized housing",
        "Two-unit property where one is owner-occupied",
        "ADUs where landlord occupies a unit on same property + tenancy began after 11/7/18",
      ],
    },
    ordinanceAdopted: "1980",
    citation: "Berkeley Municipal Code §§13.76.110 - 13.76.120",
    sourceUrl: "https://rentboard.berkeleyca.gov/",
    notes:
      "AGA published by Oct 31 of prior year. Stricter than most — no vacancy decontrol on covered units.",
  },

  // ── City of Los Angeles ────────────────────────────────────────────
  {
    jurisdiction: "Los Angeles",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        {
          effectiveStart: "2024-02-01",
          effectiveEnd: "2025-06-30",
          capPct: 4,
          note: "Regional CPI bounded 3-8%",
        },
        {
          effectiveStart: "2025-07-01",
          effectiveEnd: "2026-06-30",
          capPct: 3,
          note: "Regional CPI bounded 3-8%",
        },
        {
          effectiveStart: "2026-02-02",
          effectiveEnd: "2027-06-30",
          capPct: 4, // upper bound — actual cap = 90% × CPI bounded 1-4%
          note:
            "12/2025 amendment effective 2/2/26: 90% of regional CPI, floor 1%, ceiling 4%. Additional gas/electricity rent increase eliminated.",
        },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 0.9,
        floorPct: 1,
        ceilingPct: 4,
      },
    },
    eligibility: {
      builtBefore: "1978-10-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Affordable housing approved as exempt",
        "Limited luxury accommodations",
      ],
    },
    ordinanceAdopted: "1978",
    citation: "Los Angeles Municipal Code §§151.00 - 155.09 (amended 12/2025)",
    sourceUrl: "https://housing2.lacity.org/rental-property-owners",
    notes:
      "LA RSO covers most pre-1978 multifamily. Major amendment effective 2/2/26: cap reduced from 'CPI bounded 3-8%' to '90% CPI bounded 1-4%'.",
  },

  // ── San Jose ───────────────────────────────────────────────────────
  {
    jurisdiction: "San Jose",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "fixed_pct",
      pct: 5,
      note: "Apartment Rent Ordinance — flat 5% annual cap",
    },
    eligibility: {
      builtBefore: "1979-09-07",
      exemptPropertyTypes: ["single_family", "condo", "duplex"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Property containing only 1 or 2 units",
        "Affordable rental units",
      ],
    },
    ordinanceAdopted: "1985",
    citation: "San Jose Code of Ordinances §17.23.01 et seq.",
    sourceUrl:
      "https://www.sanjoseca.gov/your-government/departments/housing/renters-apartment-owners/apartment-rent-ordinance",
    notes:
      "Apartment Rent Ordinance (ARO). Applies to buildings of 3+ units built before 9/7/79. Mobile home rent control governed separately.",
  },

  // ── Antioch ────────────────────────────────────────────────────────
  // The chart's most aggressive period schedule — caps reset roughly bi-monthly
  // tied to the most recent SF-Oakland-Hayward CPI reading. We encode the six
  // current periods directly; fallback formula for any date past the last.
  {
    jurisdiction: "Antioch",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-11-13", effectiveEnd: "2025-03-11", capPct: 1.44 },
        { effectiveStart: "2025-03-12", effectiveEnd: "2025-05-12", capPct: 1.62 },
        { effectiveStart: "2025-05-13", effectiveEnd: "2025-07-15", capPct: 0.78 },
        { effectiveStart: "2025-07-16", effectiveEnd: "2025-09-11", capPct: 0.90 },
        { effectiveStart: "2025-09-12", effectiveEnd: "2025-11-13", capPct: 1.56 },
        { effectiveStart: "2025-11-14", effectiveEnd: "2026-03-11", capPct: 1.80 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "SF-Oakland-Hayward",
        cpiMultiplier: 0.6,
        lowerOfFlatFallback: 3,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 2,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Government-owned or federally-subsidized units",
        "Owner's primary residence or immediate family residence",
        "Owner-occupied with shared bathroom/kitchen",
      ],
    },
    ordinanceAdopted: "2022-10-11",
    citation: "Antioch Municipal Code §11-1.01 et seq.",
    sourceUrl: "https://www.antiochca.gov/1056/Rent-Program",
    notes:
      "Cap resets ~every 2 months tied to most recent SF-Oakland-Hayward CPI reading. The lesser of 3% or 60% of CPI.",
  },

  // ── Concord ────────────────────────────────────────────────────────
  // Hybrid: original "lesser of 3% or 60% of regional CPI" formula amended
  // to a flat 5% effective 5/22/25 (the 4/22/25 amendment is in force from
  // adoption date). Encode both periods.
  {
    jurisdiction: "Concord",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        {
          effectiveStart: "2024-04-19",
          effectiveEnd: "2025-03-31",
          capPct: 2.52,
          note: "Lesser of 3% or 60% of SF-Oakland-Hayward CPI (original formula)",
        },
        {
          effectiveStart: "2025-04-01",
          effectiveEnd: "2030-12-31",
          capPct: 5,
          note: "4/22/25 amendment, effective 5/22/25 — flat 5% cap",
        },
      ],
      fallbackFormula: {
        kind: "fixed_pct",
        pct: 5,
        note: "Concord 4/22/25 amendment fixed cap",
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Government-owned",
        "Owner-occupied where owner shares bathroom/kitchen",
        "Owner-occupied duplexes",
      ],
    },
    ordinanceAdopted: "2024-03-05",
    citation: "Concord Municipal Code §19.40.010 - 19.40.140 (amended 4/22/25)",
    sourceUrl:
      "https://www.cityofconcord.org/1172/Rent-Stabilization-and-Just-Cause-for-Ev",
    notes:
      "Original CPI-based formula replaced with flat 5% by 4/22/25 amendment. Watch the next amendment cycle.",
  },

  // ── Mountain View ─────────────────────────────────────────────────
  // Tests the floor/ceiling variant of cpi_formula: 100% of regional CPI
  // bounded between 2% (floor) and 5% (ceiling).
  {
    jurisdiction: "Mountain View",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-09-01", effectiveEnd: "2025-08-31", capPct: 2.4 },
        { effectiveStart: "2025-09-01", effectiveEnd: "2026-08-31", capPct: 2.7 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "SF-Oakland-San-Jose",
        cpiMultiplier: 1.0,
        floorPct: 2,
        ceilingPct: 5,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo", "duplex", "adu"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Properties with 2 or fewer units",
        "Accessory dwelling units",
      ],
    },
    ordinanceAdopted: "2016",
    citation: "Mountain View Code of Ordinances §1700 et seq.",
    sourceUrl:
      "https://www.mountainview.gov/our-city/departments/housing/rent-stabilization",
    notes:
      "Voter-passed CSFRA. CPI tied to San Jose-Sunnyvale-Santa Clara MSA, bounded 2-5%.",
  },

  // ── Inglewood ─────────────────────────────────────────────────────
  // Tests unit_count_tiered: ≤4 units uses AB-1482-style formula, ≥5 units
  // uses a stricter formula. The chart's clearest unit-count split.
  {
    jurisdiction: "Inglewood",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "unit_count_tiered",
      tiers: [
        {
          condition: { unitCountLte: 4 },
          label: "4 units or less",
          formula: {
            kind: "published_periods",
            periods: [
              { effectiveStart: "2024-06-30", effectiveEnd: "2025-06-30", capPct: 8.9 },
              { effectiveStart: "2025-07-01", effectiveEnd: "2026-06-30", capPct: 8 },
            ],
            fallbackFormula: {
              kind: "flat_plus_cpi",
              flatPct: 5,
              cpiRegion: "LA-Long-Beach-Anaheim",
              cpiMultiplier: 1.0,
              maxPct: 10,
            },
          },
        },
        {
          condition: { unitCountGte: 5 },
          label: "5 units or more",
          formula: {
            kind: "published_periods",
            periods: [
              { effectiveStart: "2024-06-30", effectiveEnd: "2025-06-30", capPct: 3.9 },
              { effectiveStart: "2025-07-01", effectiveEnd: "2026-06-30", capPct: 3 },
            ],
            fallbackFormula: {
              kind: "cpi_formula",
              cpiRegion: "LA-Long-Beach-Anaheim",
              cpiMultiplier: 1.0,
              floorPct: 3,
              ceilingPct: 10,
            },
          },
        },
      ],
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Subsidized housing",
      ],
    },
    ordinanceAdopted: "2019-11-05",
    citation: "Inglewood Municipal Code §8-125; Ordinance No. 20-03",
    sourceUrl: "https://www.cityofinglewood.org/1594/Allowable-Rent-Increases",
    notes:
      "Note the wide gap: small buildings (≤4 units) cap near AB-1482 statewide level; 5+ unit buildings get a much stricter 3-10% bounded formula.",
  },

  // ── Unincorporated LA County ───────────────────────────────────────
  // Tests two stacking concepts: small-property-landlord +1% and luxury-unit +2%.
  // Uses metadata fields for sub-tier handling — resolver computes the base then
  // can additively bump if the property qualifies as small-landlord or luxury.
  // For simplicity here we encode the GENERAL tier; sub-tier logic is a future
  // resolver enhancement when those flags are surfaced in the property input.
  {
    jurisdiction: "Unincorporated Los Angeles County",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-01-01", effectiveEnd: "2024-12-31", capPct: 4 },
        { effectiveStart: "2025-01-01", effectiveEnd: "2025-06-30", capPct: 2.565 },
        { effectiveStart: "2025-07-01", effectiveEnd: "2026-06-30", capPct: 1.93 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 0.6,
        ceilingPct: 3,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Owner-occupied shared housing",
        "Government-owned or specifically exempt by federal/state law",
      ],
    },
    ordinanceAdopted: "2018",
    citation: "LACMC §8.52.010 - 8.52.200",
    sourceUrl: "https://dcba.lacounty.gov/rentstabilizationprogram/",
    notes:
      "General tier encoded. Small property landlords may add +1% (max 4%); luxury units may add +2% (max 5%). Sub-tier handling planned via property metadata flags.",
  },

  // ── Alameda ────────────────────────────────────────────────────────
  {
    jurisdiction: "Alameda",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-09-01", effectiveEnd: "2025-08-31", capPct: 2.7,
          note: "70% of SF-Oakland-Hayward April CPI" },
        { effectiveStart: "2025-09-01", effectiveEnd: "2026-08-31", capPct: 1.0,
          note: "70% of SF-Oakland-Hayward April CPI" },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "SF-Oakland-Hayward",
        cpiMultiplier: 0.7,
        ceilingPct: 5,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: ["SFH/condos separately alienable (Costa-Hawkins)", "Subsidized housing"],
    },
    ordinanceAdopted: "2019-07-16",
    citation: "Alameda Municipal Code §6-58.10 et seq.",
    sourceUrl: "https://www.alamedarentprogram.org/",
  },

  // ── Baldwin Park ───────────────────────────────────────────────────
  {
    jurisdiction: "Baldwin Park",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2023-08-01", effectiveEnd: "2024-07-31", capPct: 3.8 },
        { effectiveStart: "2024-08-01", effectiveEnd: "2025-07-31", capPct: 3.9 },
        { effectiveStart: "2025-08-01", effectiveEnd: "2026-07-31", capPct: 3.0 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 1.0,
        floorPct: 1,
        ceilingPct: 5,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo", "duplex", "adu"],
      ownerOccupiedExemptUpTo: 3,
      otherExemptions: [
        "SFH/condos/ADUs separately alienable (Costa-Hawkins)",
        "Duplexes",
        "Government-owned or federally subsidized",
        "Owner-occupied with 3 or fewer units",
      ],
    },
    ordinanceAdopted: "2019-12-04",
    citation: "Baldwin Park Municipal Code §129.01 et seq.",
    sourceUrl: "https://www.baldwinpark.com/399/Rent-Stabilization-Ordinance",
    notes: "If CPI is zero or less than 1%, maximum increase is 1% (1% floor on the CPI formula).",
  },

  // ── Bell Gardens ───────────────────────────────────────────────────
  {
    jurisdiction: "Bell Gardens",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2023-11-01", effectiveEnd: "2024-10-31", capPct: 1.9 },
        { effectiveStart: "2024-11-01", effectiveEnd: "2025-10-31", capPct: 1.95 },
        { effectiveStart: "2025-11-01", effectiveEnd: "2026-10-31", capPct: 1.5 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 0.5,
        lowerOfFlatFallback: 4,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 3,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Owner-occupied with 3 or fewer units",
        "Subsidized housing",
      ],
    },
    ordinanceAdopted: "2022-09-12",
    citation: "Bell Gardens Municipal Code §§5.52.010 - 5.62.160",
    sourceUrl: "https://www.bellgardens.org/government/city-departments/community-development/faqs",
  },

  // ── Beverly Hills ──────────────────────────────────────────────────
  // Tests rent_base_tiered: move-in rent ≤$600 vs >$600 get different formulas.
  {
    jurisdiction: "Beverly Hills",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "rent_base_tiered",
      tiers: [
        {
          condition: { moveInRentLte: 600 },
          label: "move-in rent $600 or less",
          formula: {
            kind: "cpi_formula",
            cpiRegion: "LA-Riverside-Orange",
            cpiMultiplier: 1.0,
            lowerOfFlatFallback: 8,
          },
        },
        {
          condition: { moveInRentGt: 600 },
          label: "move-in rent more than $600",
          formula: {
            kind: "cpi_formula",
            cpiRegion: "LA-Riverside-Orange",
            cpiMultiplier: 1.0,
            higherOfFlatFallback: 3,
          },
        },
      ],
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: ["SFH/condos separately alienable (Costa-Hawkins)"],
    },
    ordinanceAdopted: "1978",
    citation: "Beverly Hills Municipal Code §4-6-3",
    sourceUrl: "https://www.beverlyhills.org/departments/communitydevelopment/rentstabilizationdivision/",
    notes: "Resolution requires moveInRentBase. ≤$600: lesser of 8% or LA-Riverside-Orange CPI. >$600: higher of 3% or CPI.",
  },

  // ── Commerce ───────────────────────────────────────────────────────
  // Tracks AB-1482 (5% + cost of living, max 10%) but with a 2030 sunset.
  {
    jurisdiction: "Commerce",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-08-01", effectiveEnd: "2025-07-31", capPct: 8.9 },
        { effectiveStart: "2025-08-01", effectiveEnd: "2026-07-31", capPct: 8.0 },
      ],
      fallbackFormula: {
        kind: "flat_plus_cpi",
        flatPct: 5,
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 1.0,
        maxPct: 10,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 2,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Affordable housing",
        "Owner-occupied duplex",
      ],
    },
    ordinanceAdopted: "2020-06-16",
    ordinanceExpires: "2030-01-01",
    citation: "Commerce Municipal Code §9.95.030",
    sourceUrl: "https://library.municode.com/ca/commerce/ordinances",
    notes: "Sunsets 1/1/30 — watch for renewal.",
  },

  // ── Cudahy ─────────────────────────────────────────────────────────
  {
    jurisdiction: "Cudahy",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-07-01", effectiveEnd: "2025-06-30", capPct: 3 },
        { effectiveStart: "2025-07-01", effectiveEnd: "2026-06-30", capPct: 3 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 1.0,
        lowerOfFlatFallback: 3,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 2,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Affordable housing",
        "Owner-occupied duplex",
      ],
    },
    ordinanceAdopted: "2023-06-06",
    citation: "Cudahy Municipal Code §5.13.010 et seq.",
    sourceUrl: "https://www.cityofcudahy.com/432/Rent-Stabilization-and-Tenant-Protection",
  },

  // ── Culver City ────────────────────────────────────────────────────
  // CAA chart shows 6 overlapping periods. Periods normalized to non-overlapping
  // ranges; chart's 3/1/25-5/31/25 overlapped with prior 3.25% period ending 3/31/25.
  {
    jurisdiction: "Culver City",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-05-01", effectiveEnd: "2024-07-31", capPct: 3.0 },
        { effectiveStart: "2024-08-01", effectiveEnd: "2025-02-28", capPct: 3.25 },
        { effectiveStart: "2025-03-01", effectiveEnd: "2025-05-31", capPct: 3.5 },
        { effectiveStart: "2025-06-01", effectiveEnd: "2025-08-31", capPct: 3.25 },
        { effectiveStart: "2025-09-01", effectiveEnd: "2025-10-31", capPct: 3.0 },
        { effectiveStart: "2025-11-01", effectiveEnd: "2026-01-31", capPct: 3.25 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 1.0,
        floorPct: 2,
        ceilingPct: 5,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: ["SFH/condos separately alienable (Costa-Hawkins)", "Subsidized housing"],
    },
    ordinanceAdopted: "2020-09-29",
    citation: "Culver City Ordinance No. 2020-014 (§15.09.210)",
    sourceUrl: "https://www.culvercity.org/Services/Housing-Health-Human-Services/Rent-Control-Tenant-Protection-Measures",
    notes: "Frequent re-publishing — chart had overlapping period dates which we normalized.",
  },

  // ── East Palo Alto ─────────────────────────────────────────────────
  // 1/1/88 cutoff is later than most CA ordinances — most pre-1988 EPA
  // multifamily is covered.
  {
    jurisdiction: "East Palo Alto",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-07-01", effectiveEnd: "2025-06-30", capPct: 1.9 },
        { effectiveStart: "2025-07-01", effectiveEnd: "2026-06-30", capPct: 2.2 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "SF-Oakland-San-Jose",
        cpiMultiplier: 0.8,
        ceilingPct: 10,
      },
    },
    eligibility: {
      builtBefore: "1988-01-01",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 3,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Subsidized housing",
        "Owner-occupied 2- and 3-unit properties",
      ],
    },
    ordinanceAdopted: "1983",
    citation: "East Palo Alto Code of Ordinances §§14.04.040, 14.04.090-100",
    sourceUrl: "https://www.ci.east-palo-alto.ca.us/rentprogram",
  },

  // ── Fairfax (REPEALED Nov 2024) ─────────────────────────────────────
  {
    jurisdiction: "Fairfax",
    state: "CA",
    status: "repealed",
    capFormula: {
      kind: "not_in_effect",
      reason: "repealed",
      details: "Repealed pursuant to Measure I in November 2024 election. AB-1482 fallback applies.",
    },
    ordinanceAdopted: "2022",
    citation: "Repealed — Fairfax Measure I (11/2024)",
    sourceUrl: "https://www.townoffairfax.org/",
  },

  // ── Gardena (binding arbitration) ──────────────────────────────────
  // Tests the binding_arbitration variant — increases up to 5% are by-right;
  // above-5% increases are subject to mediation/arbitration.
  {
    jurisdiction: "Gardena",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "binding_arbitration",
      triggerThresholdPct: 5,
      note: "Increases exceeding 5% subject to mediation + binding arbitration. AB-1482 may also apply.",
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: ["SFH/condos separately alienable (Costa-Hawkins)"],
    },
    ordinanceAdopted: "1987",
    citation: "Gardena Municipal Code §§14.04.010 - 14.04.300",
    sourceUrl: "https://www.cityofgardena.org/rent-mediation/",
  },

  // ── Half Moon Bay ──────────────────────────────────────────────────
  {
    jurisdiction: "Half Moon Bay",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-12-01", effectiveEnd: "2025-11-30", capPct: 2.6 },
        { effectiveStart: "2025-12-01", effectiveEnd: "2026-11-30", capPct: 1.23 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "SF-Oakland-Hayward",
        cpiMultiplier: 0.8,
        ceilingPct: 3,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Government-owned",
        "Affordable housing",
      ],
    },
    ordinanceAdopted: "2024-05-07",
    citation: "Half Moon Bay Municipal Code §§6.06-010 - 6.06.180",
    sourceUrl: "https://www.half-moon-bay.ca.us/953/Rent-Stabilization-and-Tenant-Protection",
  },

  // ── Hayward ────────────────────────────────────────────────────────
  {
    jurisdiction: "Hayward",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "fixed_pct",
      pct: 5,
      note: "Hayward Residential Rent Stabilization Ordinance — flat 5% annual cap",
    },
    eligibility: {
      builtBefore: "1979-07-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Subsidized housing",
        "ADUs if primary residence is owner-occupied",
      ],
    },
    ordinanceAdopted: "1983",
    citation: "Hayward Municipal Code §12-1.04; Ordinance No. 19-12",
    sourceUrl: "https://www.hayward-ca.gov/residents/housing/landlord-rental-resources",
  },

  // ── Huntington Park ────────────────────────────────────────────────
  {
    jurisdiction: "Huntington Park",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "cpi_formula",
      cpiRegion: "LA-Long-Beach-Anaheim",
      cpiMultiplier: 1.0,
      lowerOfFlatFallback: 3,
      note: "Lesser of 3% or LA-LB-Anaheim CPI",
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 2,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Subsidized housing",
        "Owner-occupied duplex",
      ],
    },
    ordinanceAdopted: "2024-11-18",
    citation: "Huntington Park Municipal Code §§8-21.0 - 8-21.15",
    sourceUrl: "https://www.hpca.gov/849/Learn-about-Rent-Stabilization",
  },

  // ── Larkspur ───────────────────────────────────────────────────────
  {
    jurisdiction: "Larkspur",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "flat_plus_cpi",
      flatPct: 5,
      cpiRegion: "SF-Oakland-Hayward",
      cpiMultiplier: 1.0,
      maxPct: 7,
      note: "Lesser of (5% + regional CPI) or 7%",
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo", "adu"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Affordable housing",
        "Owner-occupied units",
        "Permitted ADU/JADU",
      ],
    },
    ordinanceAdopted: "2023-09-06",
    citation: "Larkspur Municipal Code §6.20.070",
    sourceUrl: "https://www.ci.larkspur.ca.us/878/Eviction-Protections-and-Rent-Regulation",
  },

  // ── Los Gatos ──────────────────────────────────────────────────────
  // Note: Costa-Hawkins date used because the ordinance only applies prospectively
  // to existing tenants (per §14.80.310 — first rent increase after construction
  // is exempt). Effectively pre-2/1/95 multifamily.
  {
    jurisdiction: "Los Gatos",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "cpi_formula",
      cpiRegion: "SF-Oakland-San-Jose",
      cpiMultiplier: 0.7,
      higherOfFlatFallback: 5,
      note: "Greater of 70% of regional CPI or 5%",
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo", "duplex"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Properties with 2 or fewer units",
      ],
    },
    ordinanceAdopted: "1980",
    citation: "Los Gatos Town Code §§14.80.010 - 14.80.315",
    sourceUrl: "https://www.losgatosca.gov/faq.aspx?TID=31",
  },

  // ── Maywood ────────────────────────────────────────────────────────
  {
    jurisdiction: "Maywood",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-07-01", effectiveEnd: "2025-06-30", capPct: 3.9 },
        { effectiveStart: "2025-07-01", effectiveEnd: "2026-06-30", capPct: 3.0 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 1.0,
        lowerOfFlatFallback: 4,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Subsidized housing",
        "Affordable housing",
        "Owner-occupied shared housing",
      ],
    },
    ordinanceAdopted: "2023-08-23",
    citation: "Maywood Municipal Code §8-21.04",
    sourceUrl: "https://www.cityofmaywood.com/239/Housing-Division",
  },

  // ── Ojai ───────────────────────────────────────────────────────────
  {
    jurisdiction: "Ojai",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "fixed_pct",
      pct: 4,
      note: "Ojai Rent Stabilization Ordinance — flat 4% annual cap",
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Affordable housing",
        "Subsidized housing",
      ],
    },
    ordinanceAdopted: "2023-04-28",
    citation: "Ojai Municipal Code §11-1.01 et seq.",
    sourceUrl: "https://ojai.ca.gov/529/Rent-Stabilization-FAQ",
  },

  // ── Oxnard ─────────────────────────────────────────────────────────
  {
    jurisdiction: "Oxnard",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "fixed_pct",
      pct: 4,
      note: "Oxnard RSO — flat 4% annual cap. Sunsets 12/31/30.",
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 2,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Affordable housing",
        "Owner-occupied duplex",
      ],
    },
    ordinanceAdopted: "2022-05-03",
    ordinanceExpires: "2030-12-31",
    citation: "Oxnard Municipal Code §27-24",
    sourceUrl: "https://www.oxnard.org/city-department/housing/rso/",
  },

  // ── Palm Springs ───────────────────────────────────────────────────
  // Few units remain subject to rent control due to vacancy decontrol —
  // the ordinance permanently exits a unit on voluntary vacancy or for-cause eviction.
  {
    jurisdiction: "Palm Springs",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "cpi_formula",
      cpiRegion: "Riverside-SB-Ontario",
      cpiMultiplier: 0.75,
      note: "I = (A/B - 1) × 0.75 where A is current CPI, B is base-rent-month CPI",
    },
    eligibility: {
      builtBefore: "1979-04-01",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 4,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "4-unit-or-fewer buildings with one owner-occupied unit",
        "Units rented for more than $450 as of 9/1/79",
        "Vacancy decontrol — rent control permanently removed after voluntary vacancy or for-cause eviction",
      ],
    },
    ordinanceAdopted: "1980",
    citation: "Palm Springs Municipal Code §§4.02.010 - 4.08.190",
    sourceUrl: "https://www.palmspringsca.gov/government/departments/community-economic-development-department/rent-control",
    notes: "Rate not officially published — formula resolution only. Most rentals are AB-1482 in practice due to vacancy decontrol exit.",
  },

  // ── Pasadena ───────────────────────────────────────────────────────
  {
    jurisdiction: "Pasadena",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2023-10-01", effectiveEnd: "2024-09-30", capPct: 2.75 },
        { effectiveStart: "2024-10-01", effectiveEnd: "2025-09-30", capPct: 3.0 },
        { effectiveStart: "2025-10-01", effectiveEnd: "2026-09-30", capPct: 2.25 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 0.75,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Government owned/subsidized exempted by federal or state law",
        "Non-profit tax-credit units",
        "Owner-occupied with shared bath/kitchen",
        "Temporary rental of single-family home",
      ],
    },
    ordinanceAdopted: "2022-12-22",
    citation: "Pasadena Municipal Code Article XVIII §1804",
    sourceUrl: "https://www.cityofpasadena.net/commissions/pasadena-rental-housing-board/",
    notes: "Initial rent increase post-ordinance follows special calculation set by rent board.",
  },

  // ── Pomona ─────────────────────────────────────────────────────────
  // Formula amendment: pre-1/1/26 was 'lesser of 4% or CPI'; post-1/1/26 flat 5%.
  // Sunsets 12/31/26.
  {
    jurisdiction: "Pomona",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2023-08-01", effectiveEnd: "2024-07-31", capPct: 4.0 },
        { effectiveStart: "2024-08-01", effectiveEnd: "2025-07-31", capPct: 3.0 },
        { effectiveStart: "2025-08-01", effectiveEnd: "2025-12-31", capPct: 3.0 },
        { effectiveStart: "2026-01-01", effectiveEnd: "2026-12-31", capPct: 5.0,
          note: "1/1/26 amendment switches from 'lesser of 4% or CPI' to flat 5%" },
      ],
      fallbackFormula: {
        kind: "fixed_pct",
        pct: 5,
        note: "Post-1/1/26 flat cap",
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Section 8 / government-subsidized",
      ],
    },
    ordinanceAdopted: "2022-08-01",
    ordinanceExpires: "2026-12-31",
    citation: "Pomona Urgency Ordinance No. 4320",
    sourceUrl: "https://www.pomonaca.gov/government/departments/neighborhood-services/rent-stabilization-program",
    notes: "Sunsets 12/31/26 — watch for renewal/amendment.",
  },

  // ── Richmond ───────────────────────────────────────────────────────
  // Measure P (12/30/22) capped formula at 'lesser of 3% or 60% of CPI'
  // (was previously 100% of CPI).
  {
    jurisdiction: "Richmond",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2023-09-01", effectiveEnd: "2024-08-31", capPct: 3.0 },
        { effectiveStart: "2024-09-01", effectiveEnd: "2025-08-31", capPct: 1.4 },
        { effectiveStart: "2025-09-01", effectiveEnd: "2026-08-31", capPct: 1.62 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "SF-Oakland-Hayward",
        cpiMultiplier: 0.6,
        lowerOfFlatFallback: 3,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo", "adu"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Accessory dwelling units",
        "Temporary tenancy in primary-resident-occupied SFH",
      ],
    },
    ordinanceAdopted: "2016",
    citation: "Richmond Code of Ordinances §§11.100.010 - 11.100.130",
    sourceUrl: "https://www.ci.richmond.ca.us/3364/Richmond-Rent-Program",
  },

  // ── Sacramento ─────────────────────────────────────────────────────
  // Tracks AB-1482 closely (5% + cost of living, max 10%) but with sunset 12/31/29.
  {
    jurisdiction: "Sacramento",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-07-01", effectiveEnd: "2025-06-30", capPct: 8.8 },
        { effectiveStart: "2025-07-01", effectiveEnd: "2026-06-30", capPct: 7.7 },
      ],
      fallbackFormula: {
        kind: "flat_plus_cpi",
        flatPct: 5,
        cpiRegion: "California-All-Items",
        cpiMultiplier: 1.0,
        maxPct: 10,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Subsidized housing",
        "Landlord/agent/immediate-family primary residence",
      ],
    },
    ordinanceAdopted: "2019-08-13",
    ordinanceExpires: "2029-12-31",
    citation: "Sacramento Municipal Code §5.156.010 et seq.",
    sourceUrl: "https://www.cityofsacramento.gov/community-development/code-compliance/rental-info-hub/tenant-protection-program",
  },

  // ── Salinas (PAUSED) ───────────────────────────────────────────────
  {
    jurisdiction: "Salinas",
    state: "CA",
    status: "repeal_pending_referendum",
    capFormula: {
      kind: "not_in_effect",
      reason: "paused_pending_referendum",
      details: "Repealed by City Council 6/3/25; repeal paused pending referendum on Nov 2026 ballot. AB-1482 fallback applies during the pause.",
    },
    ordinanceAdopted: "2024-09-24",
    citation: "Salinas Municipal Code §17-02 (repeal pending referendum)",
    sourceUrl: "https://www.cityofsalinas.org/Residents/Community/Housing-Community-Development/Rental-Registration-Rent-Stabilization",
    notes: "Original formula: 75% of CPI-West, max 2.75%, built-after 2/1/95 cutoff.",
  },

  // ── San Anselmo (REPEALED Nov 2024) ────────────────────────────────
  {
    jurisdiction: "San Anselmo",
    state: "CA",
    status: "repealed",
    capFormula: {
      kind: "not_in_effect",
      reason: "repealed",
      details: "Repealed pursuant to Measure N in November 2024 election. AB-1482 fallback applies.",
    },
    ordinanceAdopted: "2022",
    citation: "Repealed — San Anselmo Measure N (11/2024)",
    sourceUrl: "https://www.townofsananselmo.org/",
  },

  // ── Santa Ana ──────────────────────────────────────────────────────
  {
    jurisdiction: "Santa Ana",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2023-09-01", effectiveEnd: "2024-08-31", capPct: 2.54 },
        { effectiveStart: "2024-09-01", effectiveEnd: "2025-08-31", capPct: 3.0 },
        { effectiveStart: "2025-09-01", effectiveEnd: "2026-08-31", capPct: 2.42 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 0.8,
        lowerOfFlatFallback: 3,
      },
    },
    eligibility: {
      builtBefore: "1995-02-01",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 2,
      exemptIfSubstantiallyRehabilitated: true,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Affordable housing",
        "Owner-occupied duplex",
        "Substantially rehabilitated buildings",
      ],
    },
    ordinanceAdopted: "2021-10-19",
    citation: "Santa Ana Municipal Code §§8-1998.1 - 8-1998.8",
    sourceUrl: "https://www.santa-ana.org/rso?tid=en",
  },

  // ── Santa Monica ───────────────────────────────────────────────────
  // Schema gap: $-cap on absolute monthly increase ($60-$76) is NOT modeled.
  // Most underwriting is bound by the % cap; high-end rents may be more
  // constrained by the $-amount.
  {
    jurisdiction: "Santa Monica",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-09-01", effectiveEnd: "2025-08-31", capPct: 3.0,
          note: "Also subject to $76 max-increase $-cap (not modeled in % alone)" },
        { effectiveStart: "2025-09-01", effectiveEnd: "2026-08-31", capPct: 2.3,
          note: "Also subject to $60 max-increase $-cap (not modeled in % alone)" },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 0.75,
        ceilingPct: 3,
      },
    },
    eligibility: {
      builtBefore: "1979-04-10",
      exemptPropertyTypes: ["single_family", "condo"],
      ownerOccupiedExemptUpTo: 3,
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Owner-occupied dwellings with no more than 3 units",
      ],
    },
    ordinanceAdopted: "1979",
    citation: "Santa Monica City Charter Amendment §§1800 - 1821",
    sourceUrl: "https://www.smgov.net/rentcontrol/",
    notes: "Cap is 75% of CPI bounded at 3% AND a hard $-cap on absolute monthly increase. $-cap not modeled.",
  },

  // ── Thousand Oaks ──────────────────────────────────────────────────
  // Very limited application — only applies to tenants who have lived in the
  // same unit since 1987. Most rentals are AB-1482 in practice.
  {
    jurisdiction: "Thousand Oaks",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "cpi_formula",
      cpiRegion: "LA-Long-Beach-Anaheim",
      cpiMultiplier: 0.75,
      ceilingPct: 7,
    },
    eligibility: {
      builtBefore: "1980-06-30",
      exemptPropertyTypes: ["single_family", "condo", "duplex", "triplex", "fourplex"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Tenant must have lived in same unit since 1987 (or ordinance does not apply)",
        "Duplexes/triplexes/fourplexes (unless 5+ units on same lot)",
        "Luxury accommodations",
        "Nonprofit housing",
      ],
    },
    ordinanceAdopted: "1980",
    citation: "Thousand Oaks Ordinance Nos. 755-NS, 956-NS, 1284-NS",
    sourceUrl: "https://www.toaks.org/departments/city-clerk/boards-commissions/rent-adjustment-commission",
    notes: "Very limited application — only tenants since 1987. Most underwriting should treat as AB-1482.",
  },

  // ── West Hollywood ─────────────────────────────────────────────────
  {
    jurisdiction: "West Hollywood",
    state: "CA",
    status: "active",
    capFormula: {
      kind: "published_periods",
      periods: [
        { effectiveStart: "2024-09-01", effectiveEnd: "2025-08-31", capPct: 3.0 },
        { effectiveStart: "2025-09-01", effectiveEnd: "2026-08-31", capPct: 2.25 },
      ],
      fallbackFormula: {
        kind: "cpi_formula",
        cpiRegion: "LA-Long-Beach-Anaheim",
        cpiMultiplier: 0.75,
        ceilingPct: 3,
      },
    },
    eligibility: {
      builtBefore: "1979-07-01",
      exemptPropertyTypes: ["single_family", "condo"],
      otherExemptions: [
        "SFH/condos separately alienable (Costa-Hawkins)",
        "Owner-occupied units (and specified relatives)",
      ],
    },
    ordinanceAdopted: "1985",
    citation: "West Hollywood Municipal Code §17.04 et seq.",
    sourceUrl: "https://www.weho.org/city-government/rent-stabilization-housing",
    notes: "Capped at 3% (75% of LA-LB-Anaheim CPI) effective 3/1/23.",
  },
];

/**
 * Lookup by exact jurisdiction string. Resolver handles fuzzy match
 * (case-insensitive + 'City of' prefix tolerance).
 */
export function findOrdinance(jurisdiction: string): RentControlOrdinance | null {
  const norm = jurisdiction.trim().toLowerCase().replace(/^city of\s+/, "");
  if (!norm) return null; // empty string must NOT fuzzy-match the first ordinance
  return (
    ORDINANCES.find((o) => o.jurisdiction.toLowerCase() === norm) ??
    ORDINANCES.find((o) => o.jurisdiction.toLowerCase().includes(norm)) ??
    null
  );
}
