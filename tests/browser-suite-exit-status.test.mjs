/* browser-suite-exit-status — a browser suite that cannot run must FAIL, never pass silently.
 *
 * Mutation control for the im-vet-0919 fold (Astra pack B P1-6). Six CDP suites put their
 * verdict line INSIDE main(), and main() returns early when site/index.html or a chromium
 * binary cannot be found, or when the page never becomes ready. Each of those paths recorded a
 * failure and then returned BEFORE the verdict, so the script printed its failure and exited 0.
 * `PATH=/nonexistent node tests/band-lock-cdp.test.mjs` printed "locate a chromium/chrome
 * binary" and exited 0. `npm run test:browser` is in both CI and the release gate, so on any
 * machine without a browser those suites attested nothing while reading green.
 *
 * This runs every browser suite the gate runs, with PATH scrubbed so no browser can be found,
 * and requires a non-zero exit from each. It needs no browser itself — that is the point.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

/* The list is READ FROM package.json, not transcribed: a suite added to test:browser later is
   covered here the day it is added, without anyone remembering to update this file. */
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const script = pkg.scripts["test:browser"] || "";
const suites = [...script.matchAll(/node\s+(tests\/[A-Za-z0-9._-]+\.mjs)/g)].map((m) => m[1]);

assert("test:browser names at least a dozen suites (the list is not empty or truncated)",
  suites.length >= 12, `${suites.length} found in the script`);

for (const suite of suites) {
  if (!existsSync(new URL("../" + suite, import.meta.url))) {
    assert(`${suite} exists`, false, "named by test:browser but absent");
    continue;
  }
  let status = 0;
  try {
    execFileSync(process.execPath, [suite], {
      cwd: ROOT,
      env: { ...process.env, PATH: "/nonexistent", CHROME_PATH: "/nonexistent/chrome" },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });
  } catch (err) {
    status = err.status ?? (err.signal ? 1 : 0);
  }
  assert(`${suite} exits NON-ZERO when no browser can be found`, status !== 0,
    `exited ${status} — a green tick attesting nothing`);
}

console.log(failures === 0 ? "\nALL BROWSER-SUITE EXIT-STATUS CHECKS PASS"
  : `\n${failures} BROWSER-SUITE EXIT-STATUS FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
