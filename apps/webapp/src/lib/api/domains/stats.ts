import { clientApiJson, clientApiJsonOrNull } from "@/lib/api/client";
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

export type { AdminStatsDashboard };

export async function getAdminStatsDashboard(): Promise<AdminStatsDashboard> {
  const [activeUsers, funnel, nps, totalUsers, githubStars] = await Promise.all([
    clientApiJson<ActiveUsersData>(buildActiveUsersStatsPath()),
    clientApiJson<{ periods: FunnelPeriod[] }>(buildFunnelStatsPath()),
    clientApiJson<NpsData>(buildNpsStatsPath()),
    clientApiJson<TotalUsersData>(buildTotalUsersStatsPath()),
    clientApiJsonOrNull<GithubStarsData>(buildGithubStarsStatsPath()),
  ]);

  return assembleAdminStatsDashboard({
    activeUsers,
    funnel,
    githubStars,
    nps,
    totalUsers,
  });
}
