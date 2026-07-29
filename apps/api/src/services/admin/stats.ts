/**
 * Admin stats service — schemas and data-fetching for the internal dashboard.
 */

import { prisma } from "@bondery/db";
import { GITHUB_REPO_URL } from "@bondery/helpers/globals/paths";
import {
  EXAMPLE_ACTIVE_USERS_RESPONSE,
  EXAMPLE_FUNNEL_RESPONSE,
  EXAMPLE_GITHUB_STARS_RESPONSE,
  EXAMPLE_NPS_RESPONSE,
  EXAMPLE_TOTAL_USERS_RESPONSE,
} from "@bondery/schemas/openapi/fixtures/responses";
import { z } from "zod";
import { internal } from "../../lib/platform/errors/http-errors.js";
import { getActiveUsersTimeline, getNpsResults } from "../../services/admin/posthog.js";

export const activeUsersTimelinePointSchema = z.object({
  date: z.string(),
  dau: z.number(),
  mau: z.number(),
  wau: z.number(),
});

export const activeUsersResponseSchema = z
  .object({
    timeline: z.array(activeUsersTimelinePointSchema),
  })
  .meta({ example: EXAMPLE_ACTIVE_USERS_RESPONSE });

export const activeUsersQuerySchema = z.object({
  days: z.coerce.number().int().min(30).max(180).optional().default(90),
});

export const funnelPeriodSchema = z.object({
  contacts: z.number(),
  contactsToInteractionsPct: z.number(),
  interactions: z.number(),
  periodKey: z.string(),
  periodLabel: z.string(),
  signups: z.number(),
  signupsToContactsPct: z.number(),
});

export const funnelResponseSchema = z
  .object({
    periods: z.array(funnelPeriodSchema),
  })
  .meta({ example: EXAMPLE_FUNNEL_RESPONSE });

export const npsResponseSchema = z
  .object({
    detractors: z.number(),
    passives: z.number(),
    promoters: z.number(),
    responses: z.number(),
    score: z.number().nullable(),
  })
  .meta({ example: EXAMPLE_NPS_RESPONSE });

export const totalUsersPointSchema = z.object({
  date: z.string(),
  total: z.number(),
});

export const totalUsersResponseSchema = z
  .object({
    timeline: z.array(totalUsersPointSchema),
  })
  .meta({ example: EXAMPLE_TOTAL_USERS_RESPONSE });

export const githubStarsResponseSchema = z
  .object({
    repo: z.string(),
    stars: z.number(),
  })
  .meta({ example: EXAMPLE_GITHUB_STARS_RESPONSE });

type FunnelPeriodRow = {
  period_key: string;
  period_label: string;
  signups: bigint | number;
  contacts: bigint | number;
  interactions: bigint | number;
  signups_to_contacts_pct: number;
  contacts_to_interactions_pct: number;
};

type TotalUsersGrowthRow = {
  date: Date;
  total: bigint | number;
};

export async function fetchActiveUsersTimeline(
  posthogApiSecret: string,
  posthogProjectId: string,
  days: number,
) {
  const timeline = await getActiveUsersTimeline(posthogApiSecret, posthogProjectId, days);
  return { timeline };
}

export async function fetchFunnelPeriods() {
  try {
    const data = await prisma.$queryRaw<FunnelPeriodRow[]>`SELECT * FROM get_funnel_periods()`;

    const periods = data.map((item) => ({
      contacts: Number(item.contacts) || 0,
      contactsToInteractionsPct: Number(item.contacts_to_interactions_pct) || 0,
      interactions: Number(item.interactions) || 0,
      periodKey: item.period_key,
      periodLabel: item.period_label,
      signups: Number(item.signups) || 0,
      signupsToContactsPct: Number(item.signups_to_contacts_pct) || 0,
    }));

    return { periods };
  } catch (error) {
    throw internal("failed_to_fetch_funnel_stats", error);
  }
}

export async function fetchNpsResults(posthogApiSecret: string, posthogProjectId: string) {
  return getNpsResults(posthogApiSecret, posthogProjectId);
}

export async function fetchTotalUsersGrowth() {
  try {
    const data = await prisma.$queryRaw<
      TotalUsersGrowthRow[]
    >`SELECT * FROM get_total_users_growth()`;

    const timeline = data.map((item) => ({
      date: item.date instanceof Date ? item.date.toISOString().slice(0, 10) : String(item.date),
      total: Number(item.total) || 0,
    }));

    return { timeline };
  } catch (error) {
    throw internal("failed_to_fetch_total_users_growth", error);
  }
}

export async function fetchGithubStars() {
  const res = await fetch(GITHUB_REPO_URL, {
    headers: { "User-Agent": "bondery-stats-api" },
  });

  if (!res.ok) {
    throw internal("bad_gateway");
  }

  const payload = (await res.json()) as { stargazers_count?: number };
  return {
    repo: GITHUB_REPO_URL.replace("https://api.github.com/repos/", ""),
    stars: payload.stargazers_count ?? 0,
  };
}
