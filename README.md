# Blockchain-Based Supply Chain Transparency and Tracking System

Blockchain-Based Supply Chain Transparency and Tracking System

See CLAUDE.md for the plan, stack, and milestones. Status: planning complete, implementation not started.

## Local quick start
```bash
npm install
npx hardhat node            # terminal 1
npm run deploy:local && npm run seed:local   # terminal 2
cd frontend && npm install && cp .env.example .env.local && npm run dev
```
Import a Hardhat account into MetaMask (network `http://127.0.0.1:8545`, chain id 31337). Account #0 is admin, #1 manufacturer, #2 distributor, #3 retailer, #4 customer (as used by `seed.ts`).
After changing the contract, regenerate the ABI: `npx hardhat compile` then copy `abi` from `artifacts/contracts/SupplyChain.sol/SupplyChain.json` to `frontend/src/abi/SupplyChain.json`.

## Commands
| Command | Purpose |
|---|---|
| `npm test` | Run contract tests |
| `npm run coverage` | solidity-coverage report |
| `npx hardhat run scripts/deploy.ts --network sepolia` | Deploy to Sepolia (needs `.env`) |

## Docs
- [Security & quality review](docs/security.md)
- [Demo walkthrough](docs/demo.md)
