import "server-only";

import {
  type ActiveUsersData,
  type AdminStatsDashboard,
  assembleAdminStatsDashboard,
  buildActiveUsersStatsPath,
  buildFunnelStatsPath,
  buildGithubStarsStatsPath,
  buildNpsStatsPath,
  buildTotalUsersStatsPath,
  type FunnelPeriod,
  type GithubStarsData,
  type NpsData,
  type TotalUsersData,
} from "@/lib/api/resources/stats";
import { type ServerApiFetchOptions, serverApiJson, serverApiJsonOrNull } from "@/lib/api/server";

type ReadOptions = Pick<ServerApiFetchOptions, "cache" | "next" | "transportPolicy">;

const DEFAULT_OPTIONS: ServerApiFetchOptions = {
  next: { revalidate: 300 },
};

export async function getAdminStatsDashboardServer(
  options: ReadOptions = {},
): Promise<AdminStatsDashboard> {
  const cacheOpts = { ...DEFAULT_OPTIONS, ...options };
  const [activeUsers, funnel, nps, totalUsers, githubStars] = await Promise.all([
    serverApiJson<ActiveUsersData>(buildActiveUsersStatsPath(), undefined, cacheOpts),
    serverApiJson<{ periods: FunnelPeriod[] }>(buildFunnelStatsPath(), undefined, cacheOpts),
    serverApiJson<NpsData>(buildNpsStatsPath(), undefined, cacheOpts),
    serverApiJson<TotalUsersData>(buildTotalUsersStatsPath(), undefined, cacheOpts),
    serverApiJsonOrNull<GithubStarsData>(buildGithubStarsStatsPath(), undefined, cacheOpts),
  ]);

  return assembleAdminStatsDashboard({
    activeUsers,
    funnel,
    githubStars,
    nps,
    totalUsers,
  });
}

export type { AdminStatsDashboard };
