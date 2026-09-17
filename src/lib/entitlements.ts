/**
 * Service-tier entitlements.
 *
 * Source of truth: `coach_client_relationships.service_tier` + `.status`.
 * Never hardcode tier behaviour in components — derive it from these helpers.
 */

export type ServiceTier = "tier_1" | "tier_2";
export type RelationshipStatus = "active" | "archived" | "pending";

export interface Entitlement {
  /** Active coaching relationship tier, if any */
  tier: ServiceTier | null;
  status: RelationshipStatus | null;
  coachId: string | null;
  /** This user coaches at least one client (or is an admin) */
  isCoach: boolean;
}

export const TIER_LABEL: Record<ServiceTier, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
};

export const TIER_DESCRIPTION: Record<ServiceTier, string> = {
  tier_1: "Individualised coaching",
  tier_2: "Curated programs",
};

/** Tier 1 (active): Andy programs for them individually. */
export function hasIndividualProgramming(e: Entitlement): boolean {
  return e.status === "active" && e.tier === "tier_1";
}

/** Tier 1 (active): ongoing private coach conversation. */
export function hasLiveCoaching(e: Entitlement): boolean {
  return hasIndividualProgramming(e);
}

/** Tier 1 (active): coach reviews nutrition and sets targets. */
export function hasNutritionReview(e: Entitlement): boolean {
  return hasIndividualProgramming(e);
}

/** Tier 2 (active): choose from the curated program allow-list. */
export function hasCuratedPrograms(e: Entitlement): boolean {
  return e.status === "active" && e.tier === "tier_2";
}

/** Tier 2 (active): paid coaching call is the way to get Andy's time. */
export function showsPaidCallCta(e: Entitlement): boolean {
  return hasCuratedPrograms(e);
}

export const EMPTY_ENTITLEMENT: Entitlement = {
  tier: null,
  status: null,
  coachId: null,
  isCoach: false,
};
