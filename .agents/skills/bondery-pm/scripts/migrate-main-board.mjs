#!/usr/bin/env node
/**
 * Bulk-migrate MAIN Plane work items to bondery-pm conventions.
 * Run via Cursor agent with Plane MCP — this script documents migration logic.
 *
 * Usage (agent): paginate list_work_items, apply migrateItem() per row, update_work_item.
 */

const PROJECT_ID = "5ab1d2fc-fe39-4adf-af3c-bad0165e151f";
const DEFAULT_OWNER = "fe2bd70b-7756-40cf-b771-c767fc2c3559";

const STATES = {
  backlog: "9a91a8c3-76a3-48ea-9613-bbd9a54dd575",
  betNext: "fcbaa781-5998-404b-b212-4d7e2cc30cb6",
  blocked: "e056ac17-2981-41d2-bb8d-67d0c23793e8",
  building: "e4b710f8-c9d0-410a-82e6-08223d5c2d5e",
  icebox: "dfe776d8-97de-4fdd-8d47-380db2c407a7",
  released: "33044163-08ad-40da-b032-691ce60e02a6",
  releaseQueue: "446b1f35-c481-486d-8c2f-eb76fdd42ad9",
  todo: "455c18d8-ea08-4ff5-98c2-1f7bfd73d8bd",
  wontDo: "76b82d71-b89e-4b4c-b8c5-9abcf3bea31b",
};

const LABELS = {
  legacyBigFeatures: "21ebcb4f-8965-4bb2-a536-6ea735aa6b7a",
  legacyBugs: "97c0e882-6828-4bd1-b63c-f60dee75a0e2",
  legacyBusiness: "af82972f-2deb-4581-9214-f4f02207d01d",
  legacyFunding: "6e5a2164-154c-4073-923e-36c3d5e4d449",
  sourceFounder: "4a81add8-d169-4f90-8759-eabdcb29481c",
  sourceUsers: "566adc26-175e-4539-a7a3-15814fa5a7de",
  surfaceApi: "d2ea6a28-97e4-4e52-9092-85a2554c0560",
  surfaceDocs: "071084c0-f850-4e70-bd97-55a989f4b9b1",
  surfaceExtension: "8122d619-2131-4ef0-bf7f-4cdf7218be3a",
  surfaceInfra: "f6e6fcff-5266-4eed-b3fb-3e628ee53713",
  surfaceMobile: "f50f8778-0427-435f-b49c-84b3e100bf2d",
  surfaceWebapp: "1e7f2400-14a6-49a4-8dc2-5c88a49e0ed4",
};

const TITLE_PREFIX_RE = /^\[(Bug|Chore|Feature|Research|Business Ops)\]\s+/;
const ROADMAP_RE = /ROADMAP-(\d+)/i;

const STATE_MAP = {
  [STATES.backlog]: STATES.icebox,
  [STATES.todo]: STATES.betNext,
  [STATES.building]: STATES.building,
  [STATES.blocked]: STATES.blocked,
  [STATES.releaseQueue]: STATES.releaseQueue,
  [STATES.released]: STATES.released,
  [STATES.wontDo]: STATES.wontDo,
};

export function mapState(currentStateId) {
  return STATE_MAP[currentStateId] ?? currentStateId;
}

export function inferTypePrefix(item, labelIds) {
  const name = item.name ?? "";
  const desc = item.description_stripped ?? item.description_html ?? "";
  const labels = new Set(labelIds);

  if (labels.has(LABELS.legacyBugs) || /\b(bug|fix|broken)\b/i.test(name)) {
    return "Bug";
  }
  if (labels.has(LABELS.legacyBigFeatures) || ROADMAP_RE.test(desc)) {
    return "Feature";
  }
  if (labels.has(LABELS.legacyBusiness) || /\b(ISO|SOC|tax|legal|GDPR)\b/i.test(name)) {
    return "Business Ops";
  }
  if (/\b(spike|evaluate|research|ADR)\b/i.test(name + desc)) {
    return "Research";
  }
  return "Chore";
}

export function formatTitle(item, typePrefix) {
  const raw = (item.name ?? "").trim();
  if (TITLE_PREFIX_RE.test(raw)) {
    return raw;
  }
  return `[${typePrefix}] ${raw}`;
}

export function inferLabels(item, labelIds) {
  const desc = item.description_stripped ?? item.description_html ?? "";
  const name = item.name ?? "";
  const labels = new Set(labelIds);

  let source = LABELS.sourceFounder;
  if (labels.has(LABELS.legacyBugs)) {
    source = LABELS.sourceUsers;
  }

  let surface = LABELS.surfaceInfra;
  if (/docs\/|\.md|documentation/i.test(desc)) {
    surface = LABELS.surfaceDocs;
  } else if (/apps\/mobile|Mobile:/i.test(desc + name)) {
    surface = LABELS.surfaceMobile;
  } else if (/apps\/webapp|webapp/i.test(desc + name)) {
    surface = LABELS.surfaceWebapp;
  } else if (/chrome|extension/i.test(desc + name)) {
    surface = LABELS.surfaceExtension;
  } else if (/apps\/api|\/api\//i.test(desc + name)) {
    surface = LABELS.surfaceApi;
  }

  return [source, surface];
}

export function buildDescription(item) {
  const existing = item.description_stripped?.trim() ?? "";
  const roadmap = existing.match(ROADMAP_RE);
  const hasSanity = existing.includes("## Sanity check");
  const hasLegacy = existing.includes("Legacy migration");

  if (hasSanity) {
    return item.description_html ?? `<p>${existing}</p>`;
  }

  const outcome = existing.split("\n")[0] || item.name;
  let html = `<h2>Outcome</h2><p>${escapeHtml(outcome)}</p>`;
  html += `<h2>Sanity check</h2><ul>`;
  html += `<li><strong>Who is the user?</strong> operator/founder</li>`;
  html += `<li><strong>What pain or opportunity?</strong> See outcome — pending review</li>`;
  html += `<li><strong>How do we know?</strong> founder</li>`;
  html += `<li><strong>Smallest shippable slice:</strong> not this week</li>`;
  html += `<li><strong>How will we know it worked?</strong> pending review</li>`;
  html += `</ul>`;

  if (roadmap) {
    html += `<h2>Roadmap</h2><p>ROADMAP-${roadmap[1]} — see public roadmap.</p>`;
  }

  if (!hasLegacy) {
    html += `<blockquote><p>Legacy migration — sanity check pending review</p></blockquote>`;
  }

  if (existing && !existing.startsWith("##")) {
    html += `<h2>Notes</h2><p>${escapeHtml(existing)}</p>`;
  }

  return html;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function migrateItem(item) {
  const labelIds = item.labels ?? [];
  const typePrefix = inferTypePrefix(item, labelIds);
  const newState = mapState(item.state);
  const [source, surface] = inferLabels(item, labelIds);
  const assigneeIds = (item.assignees ?? [])
    .map((a) => (typeof a === "string" ? a : a?.id))
    .filter(Boolean);

  return {
    assignees: assigneeIds.length ? assigneeIds : [DEFAULT_OWNER],
    description_html: buildDescription(item),
    labels: [source, surface],
    name: formatTitle(item, typePrefix),
    priority: "none",
    project_id: PROJECT_ID,
    roadmapMatch: (item.description_stripped ?? "").match(ROADMAP_RE),
    state: newState,
    work_item_id: item.id,
  };
}

if (process.argv[1]?.endsWith("migrate-main-board.mjs")) {
  console.log(JSON.stringify({ LABELS, PROJECT_ID, STATES }, null, 2));
}
