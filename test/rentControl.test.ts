import { describe, it, expect } from "vitest";
import { resolveRentCap, projectRentCapImpact } from "../src/index";
import type { RentControlPropertyInput } from "../src/index";

const asOf = new Date("2025-10-15"); // mid lease year, current period

function prop(overrides: Partial<RentControlPropertyInput>): RentControlPropertyInput {
  return {
    city: "Oakland",
    county: "Alameda",
    state: "CA",
    yearBuilt: 1970,
    unitCount: 12,
    propertyType: "multifamily_5plus",
    ...overrides,
  };
}

describe("Oakland rent control", () => {
  it("1970 12-unit building is covered → 0.8% cap (current published period)", () => {
    const r = resolveRentCap(prop({ city: "Oakland", yearBuilt: 1970 }), asOf);
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(0.8);
    expect(r.formulaExplanation).toContain("0.8%");
    expect(r.citation).toContain("Oakland");
  });

  it("1985 12-unit building is exempt from local (built >= 1983) → falls through to AB-1482", () => {
    const r = resolveRentCap(prop({ city: "Oakland", yearBuilt: 1985 }), asOf);
    expect(r.source).toBe("ab1482_statewide");
    expect(r.capPct).toBe(6.3); // 5% + 1.33% SF-Oakland-Hayward = 6.33% → rounds to 6.3
  });

  it("2015 building is exempt under AB-1482 too (< 15 years old)", () => {
    const r = resolveRentCap(prop({ city: "Oakland", yearBuilt: 2015 }), asOf);
    expect(r.capPct).toBeNull();
    expect(r.source).toBe("exempt_new_construction");
  });

  it("SFH in Oakland is exempt under Costa-Hawkins regardless of year", () => {
    const r = resolveRentCap(
      prop({ city: "Oakland", propertyType: "single_family", unitCount: 1, yearBuilt: 1920 }),
      asOf,
    );
    expect(r.capPct).toBeNull();
    expect(r.source).toBe("exempt_costa_hawkins");
  });
});

describe("San Francisco rent control", () => {
  it("1960 10-unit SF apartment building → 1.4% (current SF period 3/1/25-2/28/26)", () => {
    const r = resolveRentCap(
      prop({ city: "San Francisco", county: "San Francisco", yearBuilt: 1960, unitCount: 10 }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(1.4);
    expect(r.citation).toContain("San Francisco");
  });

  it("Same building in March 2026 → 1.6% (next SF period)", () => {
    const future = new Date("2026-03-15");
    const r = resolveRentCap(
      prop({ city: "San Francisco", county: "San Francisco", yearBuilt: 1960, unitCount: 10 }),
      future,
    );
    expect(r.capPct).toBe(1.6);
  });

  it("1985 SF building → AB-1482 fallback (6.3%)", () => {
    const r = resolveRentCap(
      prop({ city: "San Francisco", county: "San Francisco", yearBuilt: 1985, unitCount: 8 }),
      asOf,
    );
    expect(r.source).toBe("ab1482_statewide");
    expect(r.capPct).toBe(6.3);
  });
});

describe("San Mateo County (no local ordinance)", () => {
  it("1990 8-unit San Mateo building → AB-1482 6.3% (Erica's reference number)", () => {
    const r = resolveRentCap(
      prop({
        city: "Foster City",
        county: "San Mateo",
        yearBuilt: 1990,
        unitCount: 8,
      }),
      asOf,
    );
    expect(r.source).toBe("ab1482_statewide");
    expect(r.capPct).toBe(6.3);
    expect(r.cpiRegion).toBe("SF-Oakland-Hayward");
    expect(r.cpiValueUsed).toBeCloseTo(1.33, 1);
  });
});

describe("Los Angeles RSO", () => {
  it("1965 30-unit LA building → 3% (current LA RSO period 7/1/25-6/30/26)", () => {
    const r = resolveRentCap(
      prop({ city: "Los Angeles", county: "Los Angeles", yearBuilt: 1965, unitCount: 30 }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(3);
  });

  it("1980 LA building → AB-1482 (LA-LB-Anaheim region) = 8% (5% + 3% CPI)", () => {
    const r = resolveRentCap(
      prop({ city: "Los Angeles", county: "Los Angeles", yearBuilt: 1980, unitCount: 12 }),
      asOf,
    );
    expect(r.source).toBe("ab1482_statewide");
    expect(r.capPct).toBe(8);
  });
});

describe("San Jose ARO", () => {
  it("1970 5-unit San Jose building → flat 5% cap", () => {
    const r = resolveRentCap(
      prop({ city: "San Jose", county: "Santa Clara", yearBuilt: 1970, unitCount: 5 }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(5);
  });

  it("San Jose duplex is exempt → AB-1482 fallback", () => {
    const r = resolveRentCap(
      prop({
        city: "San Jose",
        county: "Santa Clara",
        yearBuilt: 1970,
        unitCount: 2,
        propertyType: "duplex",
      }),
      asOf,
    );
    // Duplex is in San Jose's exempt list → AB-1482
    expect(r.source).toBe("ab1482_statewide");
  });
});

describe("Antioch (mid-year period schedule)", () => {
  it("1980 6-unit Antioch building queried 2025-04-01 → 1.62% (period 3)", () => {
    const r = resolveRentCap(
      prop({ city: "Antioch", county: "Contra Costa", yearBuilt: 1980, unitCount: 6 }),
      new Date("2025-04-01"),
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(1.62);
  });

  it("Same building queried 2025-12-15 → 1.80% (final period)", () => {
    const r = resolveRentCap(
      prop({ city: "Antioch", county: "Contra Costa", yearBuilt: 1980, unitCount: 6 }),
      new Date("2025-12-15"),
    );
    expect(r.capPct).toBe(1.80);
  });
});

describe("Concord (formula amendment)", () => {
  it("Pre-amendment query (2025-02-01) → 2.52% (original CPI formula period)", () => {
    const r = resolveRentCap(
      prop({ city: "Concord", county: "Contra Costa", yearBuilt: 1990, unitCount: 8 }),
      new Date("2025-02-01"),
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(2.52);
  });

  it("Post-amendment query (2025-08-01) → flat 5%", () => {
    const r = resolveRentCap(
      prop({ city: "Concord", county: "Contra Costa", yearBuilt: 1990, unitCount: 8 }),
      new Date("2025-08-01"),
    );
    expect(r.capPct).toBe(5);
  });
});

describe("Mountain View (CPI bounded floor/ceiling)", () => {
  it("1985 6-unit Mountain View building → 2.4% (period through 8/31/25)", () => {
    const r = resolveRentCap(
      prop({ city: "Mountain View", county: "Santa Clara", yearBuilt: 1985, unitCount: 6 }),
      new Date("2025-03-01"),
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(2.4);
  });

  it("Same building post-Sept 2025 reset → 2.7%", () => {
    const r = resolveRentCap(
      prop({ city: "Mountain View", county: "Santa Clara", yearBuilt: 1985, unitCount: 6 }),
      new Date("2025-12-01"),
    );
    expect(r.capPct).toBe(2.7);
  });
});

describe("Inglewood (unit-count tiered)", () => {
  it("1980 4-unit Inglewood building (small tier) → 8% (current period)", () => {
    const r = resolveRentCap(
      prop({ city: "Inglewood", county: "Los Angeles", yearBuilt: 1980, unitCount: 4 }),
      new Date("2025-10-01"),
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(8);
  });

  it("1980 12-unit Inglewood building (large tier) → 3% (current period)", () => {
    const r = resolveRentCap(
      prop({ city: "Inglewood", county: "Los Angeles", yearBuilt: 1980, unitCount: 12 }),
      new Date("2025-10-01"),
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(3);
  });
});

describe("Unincorporated LA County", () => {
  it("1985 8-unit unincorporated LA building → 1.93% (current period)", () => {
    const r = resolveRentCap(
      prop({
        city: "Unincorporated Los Angeles County",
        county: "Los Angeles",
        yearBuilt: 1985,
        unitCount: 8,
      }),
      new Date("2025-10-01"),
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(1.93);
  });
});

describe("Hayward / Larkspur / Ojai / Oxnard (flat caps)", () => {
  it("Hayward 1970 8-unit → flat 5%", () => {
    const r = resolveRentCap(prop({ city: "Hayward", county: "Alameda", yearBuilt: 1970, unitCount: 8 }), asOf);
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(5);
  });

  it("Ojai 1980 6-unit → flat 4%", () => {
    const r = resolveRentCap(prop({ city: "Ojai", county: "Ventura", yearBuilt: 1980, unitCount: 6 }), asOf);
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(4);
  });

  it("Larkspur 1970 5-unit → flat_plus_cpi (5% + 1.33% SF-Oakland-Hayward = 6.3%, below 7% cap)", () => {
    const r = resolveRentCap(prop({ city: "Larkspur", county: "Marin", yearBuilt: 1970, unitCount: 5 }), asOf);
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(6.3);
  });
});

describe("Beverly Hills (rent_base_tiered)", () => {
  it("Beverly Hills 1970 8-unit, base rent $500 → ≤$600 tier (lesser of 8% or CPI)", () => {
    const r = resolveRentCap(
      prop({
        city: "Beverly Hills",
        county: "Los Angeles",
        yearBuilt: 1970,
        unitCount: 8,
        moveInRentBase: 500,
      }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    // CPI < 8%, so CPI is the binding number
    expect(r.capPct).toBe(3.3);
    expect(r.formulaExplanation).toContain("$600 or less");
  });

  it("Beverly Hills 1970 8-unit, base rent $2500 → >$600 tier (higher of 3% or CPI)", () => {
    const r = resolveRentCap(
      prop({
        city: "Beverly Hills",
        county: "Los Angeles",
        yearBuilt: 1970,
        unitCount: 8,
        moveInRentBase: 2500,
      }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    // CPI > 3%, so CPI is the binding number
    expect(r.capPct).toBe(3.3);
  });
});

describe("Sacramento (5% + CPI tracking AB-1482)", () => {
  it("1970 12-unit Sacramento → 7.7% (current period)", () => {
    const r = resolveRentCap(
      prop({ city: "Sacramento", county: "Sacramento", yearBuilt: 1970, unitCount: 12 }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(7.7);
  });
});

describe("Pasadena / Richmond / West Hollywood (75%/60% of CPI)", () => {
  it("Pasadena 1970 10-unit → 2.25% (current period)", () => {
    const r = resolveRentCap(
      prop({ city: "Pasadena", county: "Los Angeles", yearBuilt: 1970, unitCount: 10 }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(2.25);
  });

  it("Richmond 1980 6-unit → 1.62% (current period)", () => {
    const r = resolveRentCap(
      prop({ city: "Richmond", county: "Contra Costa", yearBuilt: 1980, unitCount: 6 }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(1.62);
  });

  it("West Hollywood 1970 12-unit → 2.25% (current period)", () => {
    const r = resolveRentCap(
      prop({ city: "West Hollywood", county: "Los Angeles", yearBuilt: 1970, unitCount: 12 }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(2.25);
  });
});

describe("Pomona (formula amendment 1/1/26)", () => {
  it("Pre-amendment query (2025-10-01) → 3% (period 3)", () => {
    const r = resolveRentCap(
      prop({ city: "Pomona", county: "Los Angeles", yearBuilt: 1980, unitCount: 8 }),
      new Date("2025-10-01"),
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(3);
  });

  it("Post-amendment query (2026-03-15) → 5% (flat)", () => {
    const r = resolveRentCap(
      prop({ city: "Pomona", county: "Los Angeles", yearBuilt: 1980, unitCount: 8 }),
      new Date("2026-03-15"),
    );
    expect(r.capPct).toBe(5);
  });
});

describe("Salinas (paused) / Fairfax (repealed) → AB-1482 fallback", () => {
  it("Salinas 1970 6-unit → AB-1482 fallback (paused locally)", () => {
    const r = resolveRentCap(
      prop({ city: "Salinas", county: "Monterey", yearBuilt: 1970, unitCount: 6 }),
      asOf,
    );
    // Salinas's local capFormula is not_in_effect → resolver should fall through to AB-1482.
    // CPI region for Monterey = California-All-Items → 7.7%
    expect(r.source).toBe("ab1482_statewide");
  });

  it("Fairfax 1970 6-unit → AB-1482 fallback (repealed locally)", () => {
    const r = resolveRentCap(
      prop({ city: "Fairfax", county: "Marin", yearBuilt: 1970, unitCount: 6 }),
      asOf,
    );
    expect(r.source).toBe("ab1482_statewide");
  });
});

describe("Gardena (binding arbitration variant)", () => {
  it("Gardena 1970 10-unit → binding_arbitration with 5% threshold", () => {
    const r = resolveRentCap(
      prop({ city: "Gardena", county: "Los Angeles", yearBuilt: 1970, unitCount: 10 }),
      asOf,
    );
    expect(r.source).toBe("local_ordinance");
    expect(r.capPct).toBe(5);
    expect(r.warnings.some((w) => w.toLowerCase().includes("arbitration"))).toBe(true);
  });
});

describe("multi-year pro-forma projection", () => {
  it("Oakland 1970 12-unit, $300k base GRI, 5-year hold — drag accumulates", () => {
    const sub = projectRentCapImpact(
      prop({ city: "Oakland", yearBuilt: 1970, unitCount: 12 }),
      300_000,
      5,
      4, // 4% market growth assumption
      asOf,
    );
    expect(sub.projections).toHaveLength(5);
    expect(sub.projections[0].capPct).toBe(0.8); // year 1 still in current period
    expect(sub.cumulativeDrag).toBeGreaterThan(0);
    expect(sub.projections[0].capProjectedRent).toBeLessThan(
      sub.projections[0].unrestrictedProjectedRent,
    );
  });

  it("New construction (exempt) — no drag", () => {
    const sub = projectRentCapImpact(
      prop({ city: "Oakland", yearBuilt: 2015, unitCount: 50 }),
      1_000_000,
      5,
      4,
      asOf,
    );
    expect(sub.initialResolution.capPct).toBeNull();
    expect(sub.cumulativeDrag).toBe(0);
  });
});
