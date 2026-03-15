/**
 * Module-level in-memory campaign store.
 * Persists across requests within the same server process (single session).
 * For production, replace with a real database.
 */
import type { Campaign } from "@/types/campaign";

export const campaignStore = new Map<string, Campaign>();
