// `--import`-ed before the test entrypoint so the .html loader hook is
// registered before worker.js (which statically imports ../admin.html) is
// itself loaded. See html-loader.mjs for why this is needed under plain Node.
import { register } from "node:module";
register("./html-loader.mjs", import.meta.url);
