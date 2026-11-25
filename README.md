# Privacy Budget Board

Review a pure-DP epsilon budget query by query with an exact decimal ledger.

**Status:** browser-local research prototype. The current `main` version is deployed at the link below. This revision has not received manual browser viewport testing.

## Website

Live website: https://royalpuskar.github.io/privacy-budget-board/

## Problem and approach

Each query spends epsilon in input order. An accepted query advances the cumulative total; a rejected query leaves it unchanged. The engine compares parsed JSON numbers using scaled `BigInt` decimal arithmetic, avoiding a fixed floating-point tolerance that could accept a small overrun. Exact-decimal strings accompany numeric compatibility fields in the report. The browser and Node tests run the same engine, and scenario data remains in the page until reload or export.

## Implemented features

- Editable scenario with a synthetic example and reset control.
- Query-by-query cumulative spending view, remaining-budget meter, and accepted/rejected query filters.
- Deterministic report with exact decimal totals, spent-before/after values, and rejected-query overrun amounts.
- JSON report export; each accepted query spends budget once and rejected queries do not consume it.
- Input validation, explicit errors, and invalidation of outdated reports after edits.
- Keyboard-accessible controls, responsive layout, and large-screen CSS.
- Zero runtime dependencies and no external API calls.

## Install and run

Requirements: Python 3 for a static local server, Node.js 22 or later for tests.

```sh
git clone https://github.com/Royalpuskar/privacy-budget-board.git
cd privacy-budget-board
python3 -m http.server 8000
```

Open http://localhost:8000. Do not open index.html through a file URL; ES modules require a server.

```sh
node --test test.mjs
```

## Example and schema

The complete example in `sample.mjs` defines the supported input shape:

```json
{
  "budget": 2,
  "queries": [
    {
      "id": "q1",
      "epsilon": 0.6
    },
    {
      "id": "q2",
      "epsilon": 1
    },
    {
      "id": "q3",
      "epsilon": 0.7
    }
  ]
}
```

Edit one value and select **Recalculate ledger**. **Restore example** resets the fixture. Filter by query or decision to inspect a subset. **Export JSON** downloads the current result; it never publishes it.

Input is capped at 200,000 serialized characters, arrays processed by the engine at 500 elements, and numeric magnitudes at 1e12. Domain constraints are checked inside `engine.mjs`; unsupported structures return an error.

JSON numbers are parsed by JavaScript before accounting. The engine converts each parsed number's canonical decimal form to a scaled integer for comparisons. Inputs whose written precision exceeds JavaScript's representable number precision cannot be recovered from parsed JSON; use ordinary finite numeric values. Exact output strings preserve the accounting result without a display-rounding step.

## Architecture and request flow

`index.html` loads `app.mjs`, which parses scenario JSON and calls `run` from `engine.mjs`. The engine returns totals and ordered query rows. Each row shows requested epsilon, cumulative epsilon after the decision, remaining budget, and any rejected overrun. The UI builds a budget meter and dedicated ledger cards with DOM text nodes; it does not insert user-supplied HTML. Editing invalidates the prior report. Export creates a local Blob download.

There is no application authentication, credential store, session cookie, or token lifecycle. GitHub Pages serves public static files. The app does not collect passwords or API keys, contact third-party APIs, persist inputs, or send scenario data over the network. GitHub hosting can still receive ordinary page request metadata. Reloading discards edits.

## Limitations

This is an educational basic sequential-composition ledger for declared pure-DP epsilon values. It does not add noise, model delta, prove that a query mechanism satisfies differential privacy, or provide a dataset privacy guarantee. The budget and query values are supplied assumptions, not independently verified facts.

The interface uses a budget-meter and query-ledger layout specific to this accounting workflow. No production-readiness or 4K visual-test claim is made. Large-screen CSS is not a substitute for device testing.

## Validation

The earlier `main` version had three local test cases and browser smoke checks on 19 November 2026. This revision adds exact decimal-boundary and tiny-epsilon tests and has been deployed to GitHub Pages. Its responsive layout has not been manually checked in a browser.

`test.mjs` checks sequential decisions, decimal boundaries, tiny positive values, deterministic behavior, input preservation, malformed roots, and size limits. GitHub Actions runs the same suite. Passing tests do not establish that an underlying mechanism provides differential privacy.

## Roadmap

- Add more independently reviewed domain fixtures and explicit schema documentation.
- Add domain-specific form controls alongside the JSON editor.
- Expand accessibility and mobile browser testing.
- Revisit the documented domain limitations before production use.

## Contribution and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE).

© 2026 Puskar (Royalpuskar). All rights reserved except permissions granted by the MIT license. Preserve applicable third-party notices.
