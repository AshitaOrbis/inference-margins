/* Worker substrate bridge — the dc-map release, EMBEDDED at build time.

   The Cloudflare Worker has no filesystem, so the Node module this replaces (../src/dcmap/
   substrate.ts) cannot exist here. The alternative it replaces is worse than absent, and this
   repo has already paid for it once: before rec 6 / C-6 (bq-1253) the Worker fetched report
   CONTENT from the live site at call time, so a Worker built at one release served another
   release's prose under the words "archived verbatim" — measured live on 2026-08-21. A calculator
   is the same failure with numbers instead of prose, so the substrate release is baked in by
   scripts/build.mjs, at the release the Worker is built from, and never fetched.

   Everything downstream is identical to the Node path: the same `openRelease` from the same
   vendored U3 layer re-verifies every artifact digest against the manifest AT RUNTIME. Embedding
   is where the bytes come from, not a reason to trust them.

   Exports the exact same interface as ../src/dcmap/substrate.ts. */
import { openRelease, type Release, type ReleaseFailure } from "./economics/release.js";
import { EMBEDDED_RELEASE } from "./release.gen.js";

/** Where the bytes came from, so a response can say it rather than imply it. */
export interface ReleaseBinding {
  kind: "filesystem" | "embedded";
  root: string | null;
  note: string;
}
export type ActiveRelease =
  | { ok: true; release: Release; binding: ReleaseBinding }
  | (ReleaseFailure & { binding: ReleaseBinding });

/* Byte-identical to the Node original — the build's parity gate asserts it. */
export function publicReason(raw: string): string {
  return raw
    .replace(/(^|[\s'"`(])(\/[^\s'"`,)]+)/g, (_m, lead: string, p: string) => `${lead}${p.split("/").filter(Boolean).pop() ?? p}`)
    .slice(0, 300);
}

/** There is no release root in a Worker: the bytes are in the bundle, not on a disk. */
export function releaseRoot(): string | null { return null; }

const BINDING: ReleaseBinding = {
  kind: "embedded",
  root: null,
  note: EMBEDDED_RELEASE.note,
};

let pinned: Promise<ActiveRelease> | null = null;

/** The one active release for this isolate. Repeated calls return the same handle. */
export function openActiveRelease(): Promise<ActiveRelease> {
  if (!pinned) {
    pinned = (async (): Promise<ActiveRelease> => {
      if (EMBEDDED_RELEASE.status !== "ok" || !EMBEDDED_RELEASE.release_id || !EMBEDDED_RELEASE.manifest) {
        return {
          ok: false, status: "release-unavailable",
          sentence: "No datacenter substrate release was published in this build.",
          release_id: EMBEDDED_RELEASE.release_id ?? "",
          reasons: EMBEDDED_RELEASE.reasons.map(publicReason),
          binding: BINDING,
        };
      }
      const opened = await openRelease({
        release_id: EMBEDDED_RELEASE.release_id,
        manifest: EMBEDDED_RELEASE.manifest,
        artifacts: EMBEDDED_RELEASE.artifacts,
        mode: "production",
      });
      return opened.ok
        ? { ...opened, binding: BINDING }
        : { ...opened, reasons: opened.reasons.map(publicReason), binding: BINDING };
    })();
  }
  return pinned;
}

/** Test seam only: drop the pinned handle. */
export function resetActiveRelease(): void { pinned = null; }
