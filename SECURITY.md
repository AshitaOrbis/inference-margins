# Security policy

This project ships several public-facing surfaces worth scrutiny:

- the **URL scenario codec** (`?s=` permalinks — a crafted-input state decoder with
  fail-closed identity rules; see `site/engine.js` `decodeScenario` and the browser suite's
  forged-permalink replays),
- the **read-only MCP endpoint** at `margins-mcp.ashitaorbis.com/mcp`,
- the **feedback ingress** (Cloudflare Worker, Turnstile-gated POST, Durable-Object rate
  limiting), and its Access-protected `/admin` surface.

## Reporting

Please report vulnerabilities **privately** via GitHub's private vulnerability reporting on
this repository ("Report a vulnerability" under the Security tab) rather than a public issue.
If you can't use that, submit a note through the site's feedback form saying only that you
have a security report and how to reach you — don't put the details in the form.

What warrants a private report: anything that corrupts or misattributes rendered numbers via
crafted input (permalink identity spoofing), bypasses the feedback rate limits or Turnstile
binding, reaches `/admin` without Access, or makes the MCP server return mislabeled results.

Ordinary correctness issues (a wrong number, a stale price, a broken citation) are welcome as
public issues — see CONTRIBUTING.md.
