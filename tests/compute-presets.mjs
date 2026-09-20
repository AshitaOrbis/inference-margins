// Print the calculator outcome for every (model, perspective) pairing that matters.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

const res = (mid, pid) => {
  const m = E.MODELS.find(x => x.id === mid), p = E.PERSPECTIVES.find(x => x.id === pid);
  const s = E.applyPresetSettings(m, p);
  const wl = E.workload(s);
  return { margin: (wl.margin * 100).toFixed(1), cOut: wl.cOut.toFixed(3), cIn: wl.cIn.toFixed(3), costMix: wl.costMix.toFixed(4), priceMix: wl.priceMix.toFixed(4) };
};

const targets = { gpt: 94, gemini: 95.7, grok: 67, dsv4: 69, glm: 60, kimi: "(cOut≈0.75, §10=81 output-only)", dsr1: 84.5 };
console.log("model      | median  | dive    | target");
for (const mid of ["opus", "sonnet", "haiku", "gpt", "gemini", "grok", "kimi", "dsr1", "dsv4", "glm"]) {
  const med = res(mid, "median"), dive = res(mid, "dive");
  console.log(`${mid.padEnd(10)} | ${med.margin.padStart(6)}% | ${dive.margin.padStart(6)}% | ${targets[mid] ?? "-"}  (dive cOut=$${dive.cOut}, cIn=$${dive.cIn})`);
}
console.log("\ndsr1+deepseek replay:", res("dsr1", "deepseek"));
console.log("opus+deepseek replay (TeorTaxes experiment):", res("opus", "deepseek"));
