/* `globalThis.crypto` for the Worker type program.

   @cloudflare/workers-types declares `declare const crypto: Crypto`, which types the BARE
   identifier but not the property on `typeof globalThis` — TypeScript synthesises that type from
   global `var` declarations only, never from `const` ones. The vendored U3 release module reaches
   for `globalThis.crypto.subtle.digest` precisely because it must run unchanged in a browser, in
   Node and in workerd, and cannot assume any one of them puts `crypto` in scope as a bare name.

   workerd does provide it — Web Crypto is part of the runtime's global scope — so this is a gap in
   the type declarations, not in the runtime. It is declared here rather than in the copied source
   because dc-map/economics is read-only for U5 and its runtime-agnostic reach is correct.

   This file is deliberately NOT a module: a `declare var` in a global script declaration file is
   what joins `typeof globalThis`; the same declaration inside `declare global { … }` of a module
   merges into the existing `const` symbol and does not. */
declare var crypto: Crypto;
