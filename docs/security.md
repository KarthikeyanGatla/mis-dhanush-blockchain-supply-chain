# Security & Quality Review

## Test coverage (`npm run coverage`)
| Metric | Result |
|---|---|
| Statements | 100% |
| Functions | 100% |
| Lines | 100% |
| Branches | 95.45% |

20 tests, including revert cases for every external function.

## Slither (v latest, solc 0.8.24, `node_modules` filtered)
2 informational results, both false positives:
1. `incorrect-equality` in `notRecalled`: strict equality on an enum value, intended and safe.
2. `timestamp` in `isAuthentic`: no `block.timestamp` is used in the comparison; the detector is a heuristic false positive.

## Design notes
- Access control via OpenZeppelin `AccessControl`; only the admin grants roles.
- Custom errors instead of revert strings (cheaper gas).
- Handoff graph is enforced on-chain: manufacturer -> distributor -> retailer -> consumer; skipped or unknown handoffs revert (counterfeit/invalid handoff rejection).
- Recalled products are frozen: no transfers or status updates.
- No external calls or ether handling, so no reentrancy surface.
- `block.timestamp` is used only for record keeping (uint64).

## Known limitations
- Role holders can be added by the admin only; a compromised admin key can grant roles. Use a multisig for production.
- `VITE_PINATA_JWT` is exposed in the client bundle; use an upload-only scoped key for demos, or proxy via a backend.
- Event indexing is done by reading on-chain history (`getHistory`); a subgraph would scale better.
- Sepolia deployment pending a funded key (`.env`).
