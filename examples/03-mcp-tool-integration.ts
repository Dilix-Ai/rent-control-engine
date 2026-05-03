/**
 * Real-world example: wrapping the resolver as an MCP tool for AI agents.
 *
 * Scenario: an agent (Claude, Cursor, custom) needs to answer rent
 * control questions while underwriting. The MCP tool wrapper below
 * follows the agent-friendly response envelope from
 * docs/AGENT-NATIVE-DATA-STRATEGY.md (in the main Dilix repo).
 *
 * Key shape: every response carries `_reasoning` (a plain-English
 * explanation the agent can quote verbatim) and `_sources` (citations
 * the agent can surface as verifiable links).
 *
 * Run with: npx tsx examples/03-mcp-tool-integration.ts
 */

import {
  resolveRentCap,
  type RentControlPropertyInput,
  type ResolvedRentCap,
} from "../src/index";

interface McpResponse<T> {
  data: T;
  _reasoning: string;
  _sources: Array<{
    provider: string;
    citation: string;
    url?: string;
    fetchedAt: string;
  }>;
  _caveats?: string[];
  _schemaVersion: string;
}

/** MCP tool: resolve_rent_cap — agent-callable wrapper around resolveRentCap. */
function resolveRentCapTool(
  input: RentControlPropertyInput,
): McpResponse<ResolvedRentCap> {
  const resolution = resolveRentCap(input);

  // Plain-English narrative the agent can quote to the user without
  // inventing anything. This is the single most important field for
  // hallucination prevention.
  const reasoning =
    resolution.capPct == null
      ? `${input.city} property at year ${input.yearBuilt} is ${describeExemption(resolution.source)}. ` +
        `${resolution.formulaExplanation}`
      : `Maximum legal rent increase: ${resolution.capPct}% annually for the period ` +
        `${resolution.effectiveStart} to ${resolution.effectiveEnd}. ` +
        `${resolution.formulaExplanation}`;

  return {
    data: resolution,
    _reasoning: reasoning,
    _sources: [
      {
        provider: resolution.source === "local_ordinance" ? "municipal_code" : "civil_code",
        citation: resolution.citation,
        url: resolution.sourceUrl,
        fetchedAt: new Date().toISOString(),
      },
    ],
    _caveats: resolution.warnings.length > 0 ? resolution.warnings : undefined,
    _schemaVersion: "rent-control-engine@0.1",
  };
}

function describeExemption(source: ResolvedRentCap["source"]): string {
  switch (source) {
    case "exempt_costa_hawkins":
      return "exempt from rent control under Costa-Hawkins (single-family/condo separately alienable)";
    case "exempt_new_construction":
      return "exempt as new construction (built after the ordinance's coverage cutoff)";
    case "exempt_owner_occupied":
      return "exempt as owner-occupied small property";
    case "exempt_subsidized":
      return "exempt as deed-restricted affordable / subsidized housing";
    default:
      return `not subject to rent control (${source})`;
  }
}

// Example agent call:
const response = resolveRentCapTool({
  city: "Oakland",
  county: "Alameda",
  state: "CA",
  yearBuilt: 1970,
  unitCount: 12,
  propertyType: "multifamily_5plus",
});

console.log("─── Agent-facing response ───");
console.log(JSON.stringify(response, null, 2));

// The agent receives:
//
// {
//   "data": {
//     "capPct": 0.8,
//     "source": "local_ordinance",
//     "formulaExplanation": "Oakland rent ordinance: 0.8% (published cap...)",
//     "effectiveStart": "2025-08-01",
//     "effectiveEnd": "2026-07-31",
//     "citation": "Oakland Code of Ordinances §8.22.010 et seq.",
//     "confidence": "high",
//     ...
//   },
//   "_reasoning": "Maximum legal rent increase: 0.8% annually for the period 2025-08-01 to 2026-07-31. Oakland rent ordinance: 0.8% (published cap for 2025-08-01 → 2026-07-31)...",
//   "_sources": [
//     {
//       "provider": "municipal_code",
//       "citation": "Oakland Code of Ordinances §8.22.010 et seq.",
//       "url": "https://www.oaklandca.gov/topics/rent-adjustment-program",
//       "fetchedAt": "2026-05-03T..."
//     }
//   ],
//   "_schemaVersion": "rent-control-engine@0.1"
// }
//
// The agent can now respond to a user with:
// "The maximum rent increase Oakland allows on this 1970-built 12-unit
//  is 0.8% per year through July 2026 (Oakland Code §8.22.010 — see
//  https://www.oaklandca.gov/topics/rent-adjustment-program). That's
//  significantly below typical market growth assumptions; you'll want
//  to model regulatory drag explicitly."
//
// Without the _reasoning + _sources fields, the agent might invent a
// rate or cite the wrong code section. Grounding wins.
