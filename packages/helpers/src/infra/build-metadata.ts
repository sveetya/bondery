export type BuildMetadata = {
  gitSha?: string;
  version?: string;
};

/** Reads optional build metadata baked into container env at image build time. */
export function readBuildMetadata(): BuildMetadata {
  const version = process.env.BONDERY_INFRA_VERSION?.trim();
  const gitSha = process.env.BONDERY_INFRA_GIT_SHA?.trim();
  return {
    ...(version ? { version } : {}),
    ...(gitSha ? { gitSha } : {}),
  };
}

function withBuildMetadata<T extends Record<string, unknown>>(body: T): T & BuildMetadata {
  const { gitSha, version } = readBuildMetadata();
  return {
    ...body,
    ...(gitSha ? { gitSha } : {}),
    ...(version ? { version } : {}),
  };
}

/** Shared liveness payload for api, webapp, and website container probes. */
export function buildLivenessStatus() {
  return withBuildMetadata({
    status: "ok" as const,
    timestamp: new Date().toISOString(),
  });
}

/** Shared readiness payload for webapp and website container probes. */
export function buildReadinessStatus(ok: boolean, error?: string) {
  const timestamp = new Date().toISOString();
  if (ok) {
    return withBuildMetadata({
      status: "ok" as const,
      timestamp,
    });
  }
  return withBuildMetadata({
    error: error ?? "unhealthy",
    status: "unhealthy" as const,
    timestamp,
  });
}
