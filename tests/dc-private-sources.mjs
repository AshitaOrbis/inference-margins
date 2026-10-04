/* dc-private-sources.mjs — UNSERVED (scripts/sync-site-tests.mjs does not copy it). The DC registry names each
   unpublished research dive it draws on by a descriptor ("(unpublished) electricity study of 2026-08-23"), never by
   its path: the declared field inventory (scripts/public-fields) admits a pointer only as a public locator or an
   unpublished descriptor. The needle checks still have to open the exact private file, so this module maps each
   sourced object's needle back to it, and it holds that mapping honest: the descriptor a row carries must be the one
   its file earns (the same wording build-dc-ledger.mjs prints in the published ledger), and a descriptor with no
   mapped needle throws rather than passing quietly. */
export const UNPUBLISHED = "(unpublished) ";

const PRIVATE_SOURCE_BY_NEEDLE = new Map([
  [">300 megawatts … over 220,000 NVIDIA GPUs", "research/dives/im-arc/electricity-fable-2026-08-23.md"],
  ["Tennessee industrial average **6.45 ¢ (May 2026)**", "research/dives/im-arc/electricity-fable-2026-08-23.md"],
  ["`cn-coastal` → {0.089, 0.098, 0.110}", "research/dives/im-arc/electricity-fable-2026-08-23.md"],
  ["Oklahoma 6.17¢", "research/dives/im-arc/electricity-gptpro-2026-08-23.md"],
  ["cn-western = { 0.060, 0.071, 0.087 } $/kWh", "research/dives/im-arc/electricity-gptpro-2026-08-23.md"],
  ["Kimi K3 和 Qwen3.8-Max 均已通过该实例对外提供服务", "research/dives/im-arc/electricity-subagent-china-tariffs-2026-08-23.md"],
  ["乌兰察布的电价大约在0.3元/千瓦时", "research/dives/im-arc/electricity-subagent-china-tariffs-2026-08-23.md"],
  ["MLGW is not supplying power to their supercomputer, Colossus 2", "research/dives/im-arc/electricity-subagent-named-facilities-2026-08-23.md"],
  ["110,000 NVIDIA GPUs and $920 million per month", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["226.75 average and 278 peak eight-H800 nodes", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["325,000 NVIDIA GPUs and $1.25 billion per month", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["Anthropic aggregate: more than one million Trn2 in use by April 2026.", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["Ironwood/TPU v7 is directly linked to Gemini training and serving", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["Kimi K2 was trained on H800 nodes with eight GPUs each", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["Rainier: nearly 500,000 Trn2 across multiple data centers.", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["V4 production support on Ascend 950-series supernodes", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["first 400,000 TPUv7 systems are direct purchases", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["operates on servers geographically dispersed across China", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["remaining 600,000 are rented through GCP", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["reported 20,000-chip Alibaba arrangement", "research/dives/im-arc/fleet-composition-gptpro-2026-08-23.md"],
  ["Mixed H100/H200/GB200 `{220,000, 230,000, open}`", "research/dives/im-arc/fleet-composition-synthesis-2026-08-23.md"],
  ["~$1.60 per TPU-hour from GCP", "research/dives/im-arc/rental-rates-fable-2026-08-23.md"],
  ["**{3.00, 3.68, 3.99}**", "research/dives/im-arc/rental-rates-gptpro-2026-08-23.md"],
  ["AWS 72-GPU reservation / Capacity Block, $/GPU-h", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["Alibaba managed public-cloud on-demand, $/accelerator-h", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["Both arms, AWS Capacity Blocks.", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["CoreWeave public four-GPU slice, $/GPU-h", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["Fold disclosed regional span; the present `$5.40` is specifically Iowa.", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["Pro `{1.05,1.24,1.49}` versus Fable `{1.61,1.85,2.16}`", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["provisional tender-candidate quote", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["public CoreWeave/AWS planning band, $/GPU-h", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["the dated `{2.35, 2.40, 3.19}` planning band", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["usable planning span `{0.71, 0.82, 1.02}`", "research/dives/im-arc/rental-rates-synthesis-2026-08-23.md"],
  ["approximately **100,000 H100 processors**", "research/dives/im-arc/tco-inputs-gptpro-2026-08-23.md"],
]);

export function describePrivateSource(path) {
  const date = path.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  const description = path.includes("fleet-composition") ? "fleet-composition study"
    : path.includes("named-facilities") ? "named-facility study"
    : path.includes("china-tariffs") ? "China electricity-tariff study"
    : path.includes("electricity") ? "electricity study" : "research note";
  return `${description}${date ? " of " + date : ""}`;
}

/* The file a sourced object's needle is checked in: its own sourceFile when that is a repository path, or the
   private file behind its unpublished descriptor. */
export function sourceFileOf(file, needle) {
  if (typeof file !== "string" || !file.startsWith(UNPUBLISHED)) return file;
  const path = PRIVATE_SOURCE_BY_NEEDLE.get(needle);
  if (!path) throw new Error("dc-private-sources: an unpublished descriptor whose needle maps to no private file");
  if (UNPUBLISHED + describePrivateSource(path) !== file)
    throw new Error("dc-private-sources: a descriptor that does not match the private file its needle maps to");
  return path;
}

export const PRIVATE_SOURCE_FILES = new Set(PRIVATE_SOURCE_BY_NEEDLE.values());
