/**
 * Rent control resolver — canonical entry point for the entire app.
 *
 * Anywhere a property is "run" — 3D feasibility, pro-forma deal
 * analyzer, entitlement roadmap, portfolio view — call resolveRentCap()
 * to get the maximum legal annual rent increase plus a citation. Never
 * hardcode rent-cap numbers anywhere else.
 *
 * Resolution order:
 *   1. If a local ordinance covers the property + the property passes
 *      eligibility tests, use the local ordinance's cap.
 *   2. Else if AB-1482 covers the property, use AB-1482 (5% + regional
 *      CPI, max 10%).
 *   3. Else the property is exempt — capPct = null, source explains why.
 *
 * "Covers" = ordinance applies to this jurisdiction AND property type
 * AND construction-date filter passes.
 */

import type {
  RentControlPropertyInput,
  ResolvedRentCap,
  RentControlOrdinance,
  CapFormula,
  EligibilityFilter,
  CPIRegion,
} from "./types.js";
import { findOrdinance } from "./ordinances.js";
import {
  AB1482_ORDINANCE,
  AB1482_FLAT_COMPONENT_PCT,
  AB1482_MAX_CAP_PCT,
  ab1482EligibilityAsOf,
} from "./ab1482.js";
import { getCPIReading, getCPIRegionForCounty } from "./cpiRegions.js";

// ─── Public API ──────────────────────────────────────────────────────

export function resolveRentCap(
  property: RentControlPropertyInput,
  asOfDate: Date = new Date(),
): ResolvedRentCap {
  // Defensive: callers may pass partial inputs (loading a saved deal that
  // predates the yearBuilt field, etc.). Coerce to safe defaults so the
  // engine never throws a TypeError mid-render.
  property = {
    ...property,
    state: property.state ?? "CA",
    city: property.city ?? "",
    county: property.county ?? property.city ?? "",
    yearBuilt: Number.isFinite(property.yearBuilt) ? property.yearBuilt : 1970,
    unitCount: Number.isFinite(property.unitCount) ? property.unitCount : 1,
    propertyType: property.propertyType ?? "multifamily_5plus",
  };

  if (property.state.toUpperCase() !== "CA") {
    return {
      capPct: null,
      source: "no_local_rule_no_ab1482",
      formulaExplanation:
        "Engine currently only resolves California properties. Other states pending — check back next quarter.",
      effectiveStart: toISO(asOfDate),
      effectiveEnd: toISO(addYears(asOfDate, 1)),
      citation: "n/a",
      confidence: "low",
      warnings: [
        `Out-of-state resolver not implemented for ${property.state}. Treat as no-cap-data-available.`,
      ],
    };
  }

  // 1. Try local ordinance (city, then county-level)
  const local =
    findOrdinance(property.city) ??
    findOrdinance(`Unincorporated ${property.county}`) ??
    findOrdinance(property.county);

  if (local) {
    const eligibility = checkEligibility(property, local);
    if (eligibility.covered) {
      const computed = computeCapFromFormula(local.capFormula, property, asOfDate);
      if (computed) {
        return {
          capPct: computed.capPct,
          source: "local_ordinance",
          formulaExplanation: `${local.jurisdiction} rent ordinance: ${computed.explanation}`,
          effectiveStart: computed.effectiveStart,
          effectiveEnd: computed.effectiveEnd,
          cpiRegion: computed.cpiRegion,
          cpiValueUsed: computed.cpiValueUsed,
          citation: local.citation,
          confidence: computed.confidence,
          warnings: [...computed.warnings, ...eligibility.warnings],
          sourceUrl: local.sourceUrl,
        };
      }
    } else if (eligibility.exemptionReason) {
      // Local ordinance exists but property is exempt under it. Still try AB-1482 below
      // because the local exemption (e.g., SFH separately alienable, Costa-Hawkins) may
      // also exempt under AB-1482 — but AB-1482 has a slightly different exempt set
      // (e.g., owner-occupied duplex), so we let the AB-1482 check run.
    }
  }

  // 2. Try AB-1482 statewide
  const ab1482Eligibility = checkEligibility(property, {
    ...AB1482_ORDINANCE,
    eligibility: ab1482EligibilityAsOf(asOfDate),
  });

  if (ab1482Eligibility.covered) {
    const cpiRegion = getCPIRegionForCounty(property.county);
    const cpiReading = getCPIReading(cpiRegion, asOfDate);

    if (!cpiReading) {
      return {
        capPct: null,
        source: "indeterminate_missing_data",
        formulaExplanation: `AB-1482 applies but no CPI reading on file for region ${cpiRegion} as of ${toISO(asOfDate)}. Refresh CPI table.`,
        effectiveStart: toISO(ab1482LeaseYearStart(asOfDate)),
        effectiveEnd: toISO(ab1482LeaseYearEnd(asOfDate)),
        citation: AB1482_ORDINANCE.citation,
        confidence: "low",
        warnings: [`Missing CPI data for ${cpiRegion}. Cap cannot be computed.`],
        sourceUrl: AB1482_ORDINANCE.sourceUrl,
      };
    }

    const rawCap = AB1482_FLAT_COMPONENT_PCT + cpiReading.pctChange;
    const cappedAt10 = Math.min(rawCap, AB1482_MAX_CAP_PCT);
    const hitCeiling = rawCap > AB1482_MAX_CAP_PCT;

    return {
      capPct: round1(cappedAt10),
      source: "ab1482_statewide",
      formulaExplanation: `AB-1482: 5% + ${cpiReading.pctChange}% (${cpiRegion} April ${cpiReading.capYear} CPI) = ${round1(rawCap)}%${hitCeiling ? ", capped at 10% statutory ceiling" : ""}`,
      effectiveStart: toISO(ab1482LeaseYearStart(asOfDate)),
      effectiveEnd: toISO(ab1482LeaseYearEnd(asOfDate)),
      cpiRegion,
      cpiValueUsed: cpiReading.pctChange,
      citation: AB1482_ORDINANCE.citation,
      confidence: cpiReading.source?.startsWith("Estimate") ? "medium" : "high",
      warnings: ab1482Eligibility.warnings,
      sourceUrl: AB1482_ORDINANCE.sourceUrl,
    };
  }

  // 3. Property is exempt
  const exemptSource = ab1482Eligibility.exemptionReason ?? "no_local_rule_no_ab1482";
  return {
    capPct: null,
    source: exemptSource,
    formulaExplanation: ab1482Eligibility.explanation ?? "Property is not subject to rent control under any applicable rule.",
    effectiveStart: toISO(asOfDate),
    effectiveEnd: toISO(addYears(asOfDate, 1)),
    citation: AB1482_ORDINANCE.citation,
    confidence: "high",
    warnings: ab1482Eligibility.warnings,
  };
}

// ─── Eligibility ─────────────────────────────────────────────────────

interface EligibilityResult {
  covered: boolean;
  exemptionReason?: ResolvedRentCap["source"];
  explanation?: string;
  warnings: string[];
}

function checkEligibility(
  property: RentControlPropertyInput,
  ordinance: RentControlOrdinance,
): EligibilityResult {
  const warnings: string[] = [];
  const e = ordinance.eligibility;

  if (!e) {
    return { covered: ordinance.status === "active", warnings };
  }

  // Construction-date filter (the most common eligibility test)
  if (e.builtBefore) {
    const cutoffYear = parseInt(e.builtBefore.slice(0, 4), 10);
    // builtBefore semantics: property must be built BEFORE this year to be COVERED.
    // E.g., Oakland builtBefore 1983-01-01 means property must be built in 1982 or earlier.
    if (property.yearBuilt >= cutoffYear) {
      return {
        covered: false,
        exemptionReason: "exempt_new_construction",
        explanation: `Built ${property.yearBuilt}; ${ordinance.jurisdiction} only covers buildings built before ${e.builtBefore.slice(0, 4)}.`,
        warnings,
      };
    }
  }

  // Property type exemptions (Costa-Hawkins SFH/condo, etc.)
  if (e.exemptPropertyTypes?.includes(property.propertyType)) {
    // SFH on its own parcel is exempt under Costa-Hawkins. Mark explicitly.
    const isCostaHawkins =
      property.propertyType === "single_family" || property.propertyType === "condo";
    return {
      covered: false,
      exemptionReason: isCostaHawkins ? "exempt_costa_hawkins" : "exempt_property_type",
      explanation: `${property.propertyType.replace(/_/g, " ")} is exempt under ${ordinance.jurisdiction}'s ordinance${isCostaHawkins ? " (Costa-Hawkins §1954.52)" : ""}.`,
      warnings,
    };
  }

  // Subsidized housing exemption (almost always true)
  if (property.isDeedRestrictedAffordable && e.exemptIfSubsidized !== false) {
    return {
      covered: false,
      exemptionReason: "exempt_subsidized",
      explanation: "Deed-restricted affordable / subsidized housing is exempt.",
      warnings,
    };
  }

  // Owner-occupied small-building exemption (Berkeley, Pasadena, EPA, etc.)
  if (
    property.isOwnerOccupied &&
    e.ownerOccupiedExemptUpTo &&
    property.unitCount <= e.ownerOccupiedExemptUpTo
  ) {
    return {
      covered: false,
      exemptionReason: "exempt_owner_occupied",
      explanation: `Owner-occupied buildings with ≤${e.ownerOccupiedExemptUpTo} units are exempt.`,
      warnings,
    };
  }

  // Substantial-rehabilitation exemption (SF §37.2(s) and similar)
  if (property.isSubstantiallyRehabilitated && e.exemptIfSubstantiallyRehabilitated) {
    warnings.push(
      "Property marked substantially rehabilitated — may qualify for exemption. Verify eligibility against local ordinance criteria.",
    );
  }

  return { covered: true, warnings };
}

// ─── Cap formula computation ─────────────────────────────────────────

interface ComputedCap {
  capPct: number;
  explanation: string;
  effectiveStart: string;
  effectiveEnd: string;
  cpiRegion?: CPIRegion;
  cpiValueUsed?: number;
  confidence: ResolvedRentCap["confidence"];
  warnings: string[];
}

function computeCapFromFormula(
  formula: CapFormula,
  property: RentControlPropertyInput,
  asOfDate: Date,
): ComputedCap | null {
  const warnings: string[] = [];

  switch (formula.kind) {
    case "fixed_pct": {
      return {
        capPct: formula.pct,
        explanation: `Flat ${formula.pct}% annual cap${formula.note ? ` (${formula.note})` : ""}`,
        effectiveStart: toISO(asOfDate),
        effectiveEnd: toISO(addYears(asOfDate, 1)),
        confidence: "high",
        warnings,
      };
    }

    case "published_periods": {
      // Find the period whose effectiveStart...effectiveEnd contains asOfDate
      const asOfMs = asOfDate.getTime();
      const period = formula.periods.find((p) => {
        const start = new Date(p.effectiveStart).getTime();
        const end = new Date(p.effectiveEnd).getTime();
        return asOfMs >= start && asOfMs <= end;
      });
      if (period) {
        return {
          capPct: period.capPct,
          explanation: `${period.capPct}% (published cap for ${period.effectiveStart} → ${period.effectiveEnd})${period.note ? `; ${period.note}` : ""}`,
          effectiveStart: period.effectiveStart,
          effectiveEnd: period.effectiveEnd,
          confidence: "high",
          warnings,
        };
      }
      // No matching period — fall through to fallback formula if defined
      if (formula.fallbackFormula) {
        warnings.push(
          `As-of date ${toISO(asOfDate)} is outside published cap periods; falling back to formula computation.`,
        );
        return computeCapFromFormula(formula.fallbackFormula, property, asOfDate);
      }
      return null;
    }

    case "cpi_formula": {
      const reading = getCPIReading(formula.cpiRegion, asOfDate);
      if (!reading) {
        warnings.push(`No CPI reading available for ${formula.cpiRegion}.`);
        return null;
      }
      let cap = reading.pctChange * formula.cpiMultiplier;
      const baseCalc = `${(formula.cpiMultiplier * 100).toFixed(0)}% × ${reading.pctChange}% (${formula.cpiRegion} April ${reading.capYear})`;
      let detail = `${baseCalc} = ${round2(cap)}%`;

      if (formula.lowerOfFlatFallback != null) {
        const lower = Math.min(cap, formula.lowerOfFlatFallback);
        detail = `lower of ${detail} and ${formula.lowerOfFlatFallback}% = ${round2(lower)}%`;
        cap = lower;
      }
      if (formula.higherOfFlatFallback != null) {
        const higher = Math.max(cap, formula.higherOfFlatFallback);
        detail = `higher of ${detail} and ${formula.higherOfFlatFallback}% = ${round2(higher)}%`;
        cap = higher;
      }
      if (formula.floorPct != null && cap < formula.floorPct) {
        detail += `, raised to floor ${formula.floorPct}%`;
        cap = formula.floorPct;
      }
      if (formula.ceilingPct != null && cap > formula.ceilingPct) {
        detail += `, capped at ceiling ${formula.ceilingPct}%`;
        cap = formula.ceilingPct;
      }

      return {
        capPct: round1(cap),
        explanation: detail,
        effectiveStart: toISO(asOfDate),
        effectiveEnd: toISO(addYears(asOfDate, 1)),
        cpiRegion: formula.cpiRegion,
        cpiValueUsed: reading.pctChange,
        confidence: reading.source?.startsWith("Estimate") ? "medium" : "high",
        warnings,
      };
    }

    case "flat_plus_cpi": {
      const reading = getCPIReading(formula.cpiRegion, asOfDate);
      if (!reading) {
        warnings.push(`No CPI reading available for ${formula.cpiRegion}.`);
        return null;
      }
      const mul = formula.cpiMultiplier ?? 1;
      const raw = formula.flatPct + reading.pctChange * mul;
      const cap =
        formula.maxPct != null ? Math.min(raw, formula.maxPct) : raw;
      const hitCeiling = formula.maxPct != null && raw > formula.maxPct;
      return {
        capPct: round1(cap),
        explanation: `${formula.flatPct}% + ${mul === 1 ? "" : `${(mul * 100).toFixed(0)}% × `}${reading.pctChange}% (${formula.cpiRegion} April ${reading.capYear}) = ${round1(raw)}%${hitCeiling ? `, capped at ${formula.maxPct}%` : ""}`,
        effectiveStart: toISO(asOfDate),
        effectiveEnd: toISO(addYears(asOfDate, 1)),
        cpiRegion: formula.cpiRegion,
        cpiValueUsed: reading.pctChange,
        confidence: reading.source?.startsWith("Estimate") ? "medium" : "high",
        warnings,
      };
    }

    case "unit_count_tiered": {
      const tier = formula.tiers.find((t) => {
        const c = t.condition;
        if (c.unitCountLte != null && property.unitCount > c.unitCountLte) return false;
        if (c.unitCountGte != null && property.unitCount < c.unitCountGte) return false;
        return true;
      });
      if (!tier) {
        warnings.push(`No tier matches unit count ${property.unitCount}.`);
        return null;
      }
      const sub = computeCapFromFormula(tier.formula, property, asOfDate);
      return sub ? { ...sub, explanation: `${tier.label}: ${sub.explanation}`, warnings: [...sub.warnings, ...warnings] } : null;
    }

    case "rent_base_tiered": {
      if (property.moveInRentBase == null) {
        warnings.push("Move-in rent base required for this ordinance but not provided.");
        return null;
      }
      const tier = formula.tiers.find((t) => {
        const c = t.condition;
        if (c.moveInRentLte != null && property.moveInRentBase! > c.moveInRentLte) return false;
        if (c.moveInRentGt != null && property.moveInRentBase! <= c.moveInRentGt) return false;
        return true;
      });
      if (!tier) return null;
      const sub = computeCapFromFormula(tier.formula, property, asOfDate);
      return sub ? { ...sub, explanation: `${tier.label}: ${sub.explanation}`, warnings: [...sub.warnings, ...warnings] } : null;
    }

    case "binding_arbitration": {
      return {
        capPct: formula.triggerThresholdPct ?? 0,
        explanation: `Binding arbitration: ${formula.note}`,
        effectiveStart: toISO(asOfDate),
        effectiveEnd: toISO(addYears(asOfDate, 1)),
        confidence: "low",
        warnings: [
          "Cap is not formulaic — increases above threshold are subject to mediation/arbitration. Treat the threshold as a soft ceiling.",
        ],
      };
    }

    case "not_in_effect": {
      return null;
    }
  }
}

// ─── Pro-forma helpers ───────────────────────────────────────────────

/**
 * Multi-year NOI projection helper. Given a base GRI and a property,
 * returns year-by-year projected gross rental income under the
 * applicable rent cap vs. unrestricted (market) growth.
 *
 * Used by the deal analyzer + 3D feasibility HUD to surface "regulatory
 * drag on NOI" — the dollar amount the cap costs over a hold period.
 */
export interface RentCapProjection {
  year: number;
  capPct: number | null;
  capProjectedRent: number;
  unrestrictedProjectedRent: number;
  drag: number; // dollars left on the table that year
  source: ResolvedRentCap["source"];
}

export function projectRentCapImpact(
  property: RentControlPropertyInput,
  baseAnnualRent: number,
  holdYears: number,
  marketGrowthPct: number = 4,
  asOfDate: Date = new Date(),
): {
  projections: RentCapProjection[];
  cumulativeDrag: number;
  initialResolution: ResolvedRentCap;
} {
  const initial = resolveRentCap(property, asOfDate);
  const projections: RentCapProjection[] = [];
  let capRent = baseAnnualRent;
  let unrestrictedRent = baseAnnualRent;
  let cumulativeDrag = 0;

  for (let yr = 1; yr <= holdYears; yr++) {
    const futureDate = addYears(asOfDate, yr);
    const yrResolution = resolveRentCap(property, futureDate);
    const cap = yrResolution.capPct;
    if (cap != null) {
      capRent = capRent * (1 + cap / 100);
    } else {
      // Exempt — use market growth
      capRent = capRent * (1 + marketGrowthPct / 100);
    }
    unrestrictedRent = unrestrictedRent * (1 + marketGrowthPct / 100);
    const drag = unrestrictedRent - capRent;
    cumulativeDrag += drag;
    projections.push({
      year: yr,
      capPct: cap,
      capProjectedRent: round0(capRent),
      unrestrictedProjectedRent: round0(unrestrictedRent),
      drag: round0(drag),
      source: yrResolution.source,
    });
  }

  return { projections, cumulativeDrag: round0(cumulativeDrag), initialResolution: initial };
}

// ─── Date utils ──────────────────────────────────────────────────────

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addYears(d: Date, n: number): Date {
  const out = new Date(d);
  out.setFullYear(out.getFullYear() + n);
  return out;
}

function ab1482LeaseYearStart(asOfDate: Date): Date {
  const yr = asOfDate.getMonth() >= 7 ? asOfDate.getFullYear() : asOfDate.getFullYear() - 1;
  return new Date(yr, 7, 1); // Aug 1
}

function ab1482LeaseYearEnd(asOfDate: Date): Date {
  const yr = asOfDate.getMonth() >= 7 ? asOfDate.getFullYear() + 1 : asOfDate.getFullYear();
  return new Date(yr, 6, 31); // Jul 31
}

function round0(n: number): number {
  return Math.round(n);
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
