/* The dc-map substrate release, resolved ONCE per process (DESIGN §1.7 E9).

   Exact-release pinning is the rule this module exists to keep: a request, a pagination cursor
   and a calculation receipt all resolve against ONE immutable release id, every artifact is
   digest-verified against that release's manifest, and a release that cannot be served returns a
   typed `release-unavailable` / `release-mismatch` — never a silent fall-back to "latest". So
   CURRENT is read at most once and the resulting handle is retained for the life of the process;
   activating a new release does not move a running server onto it.

   The Worker replaces this module with worker/overrides/dcmap-substrate.ts, which resolves the
   SAME bytes out of the build-time embedded archive. Both paths hand those bytes to the same
   `openRelease` from the vendored U3 layer, so digest verification is one implementation. */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRelease } from "./economics-node/loader.js";
import type { Release, ReleaseFailure } from "./economics/release.js";

/** Where the bytes came from, so a response can say it rather than imply it.
 *  No absolute path is published: this connector's public error surface deliberately keeps server
 *  filesystem detail off the wire (see PUBLIC_ERROR_TEXT in ../server.ts). */
export interface ReleaseBinding {
  kind: "filesystem" | "embedded";
  root: string | null;
  note: string;
}

/* A refusal reason a caller can act on, with no server paths in it. A digest mismatch or a missing
   artifact name is genuinely useful; the directory it lives in is not, and an ENOENT message
   carries the whole tree. ABSOLUTE paths — and only those, which is why the leading delimiter is
   part of the match — are cut to their basename, and the reason is capped. A repository-relative
   name like `dc-map/releases/CURRENT` is not a server path and stays whole. */
export function publicReason(raw: string): string {
  return raw
    .replace(/(^|[\s'"`(])(\/[^\s'"`,)]+)/g, (_m, lead: string, p: string) => `${lead}${p.split("/").filter(Boolean).pop() ?? p}`)
    .slice(0, 300);
}
export type ActiveRelease =
  | { ok: true; release: Release; binding: ReleaseBinding }
  | (ReleaseFailure & { binding: ReleaseBinding });

/* Compiled location is mcp-server/dist/dcmap/substrate.js, so the repository root is three up.
   DCMAP_RELEASES is the same override the producer's own release tool reads (dc-map/build/release.py). */
export function releaseRoot(): string {
  return process.env.DCMAP_RELEASES ?? resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../dc-map/releases");
}

const BINDING: ReleaseBinding = {
  kind: "filesystem",
  root: "dc-map/releases",
  note: "Resolved from the substrate release directory once per process; CURRENT is read at most once and never re-resolved. Server paths are not published.",
};

let pinned: Promise<ActiveRelease> | null = null;

/** The one active release for this process. Repeated calls return the same handle. */
export function openActiveRelease(): Promise<ActiveRelease> {
  if (!pinned) {
    pinned = loadRelease(releaseRoot(), process.env.DCMAP_RELEASE_ID).then(
      (result) => (result.ok
        ? { ...result, binding: BINDING }
        : { ...result, reasons: result.reasons.map(publicReason), binding: BINDING }) as ActiveRelease,
      (error: unknown) => ({
        ok: false as const, status: "release-unavailable" as const,
        sentence: "The active datacenter substrate release is unavailable.",
        release_id: "", reasons: [publicReason(error instanceof Error ? error.message : "release read failure")],
        binding: BINDING,
      }),
    );
  }
  return pinned;
}

/** Test seam only: forget the pinned handle so a suite can point DCMAP_RELEASES elsewhere. */
export function resetActiveRelease(): void { pinned = null; }
