/**
 * Rent control regulation engine — public API.
 *
 * Anywhere in the app where a property is "run" — 3D feasibility,
 * pro-forma, entitlement roadmap, portfolio — import resolveRentCap()
 * (or projectRentCapImpact() for multi-year projections). Never
 * hardcode rent-cap numbers anywhere else.
 */

export type {
  RentControlPropertyInput,
  ResolvedRentCap,
  RentControlOrdinance,
  CapFormula,
  EligibilityFilter,
  CPIRegion,
  CPIReading,
  PropertyType,
  CapSource,
  Confidence,
} from "./types.js";

export {
  resolveRentCap,
  projectRentCapImpact,
  type RentCapProjection,
} from "./resolver.js";

export { ORDINANCES, findOrdinance } from "./ordinances.js";
export { AB1482_ORDINANCE } from "./ab1482.js";
export { CPI_READINGS, getCPIReading, getCPIRegionForCounty } from "./cpiRegions.js";
