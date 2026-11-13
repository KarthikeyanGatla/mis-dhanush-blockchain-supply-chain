# Dhanush — Blockchain-Based Supply Chain Transparency and Tracking System

Isolated project. Do not import from or reference `../karthik` or `../hemanth`. Run all commands from this directory.

## Goal
A DApp that records every handoff of a product (manufacturer → distributor → retailer → customer) on an Ethereum-compatible blockchain, so anyone can verify a product's provenance and status tamper-proof.

## Tech Stack (planned)
- Smart contracts: Solidity ^0.8.x, Hardhat, OpenZeppelin (AccessControl)
- Chain: Hardhat local network for dev; Sepolia testnet for demo
- Frontend: React + Vite + TypeScript, ethers.js v6, MetaMask wallet connect
- Off-chain: IPFS (Pinata) for product docs/images; hash stored on-chain
- Optional QR codes per product linking to the verification page
- Testing: Hardhat + Chai tests, solidity-coverage

## Planned Structure
```
Dhanush/
  contracts/        # SupplyChain.sol, Roles.sol
  test/
  scripts/          # deploy, seed
  frontend/src/
  docs/
  hardhat.config.ts  CLAUDE.md  README.md  .gitignore
```

## Core Features
1. Role-based participants: Manufacturer, Distributor, Retailer, Consumer, Admin
2. Register product batch (id, name, origin, timestamp, IPFS hash)
3. Transfer custody with on-chain event per handoff
4. Status updates (manufactured, shipped, in-transit, delivered, recalled)
5. Public verification page: full history timeline by product ID / QR scan
6. Event indexing for fast history queries
7. Recall flagging and counterfeit detection (unknown / invalid handoff rejected)

## Milestones
- M1: Hardhat scaffold, contract design (data model + events)
- M2: SupplyChain contract with roles + tests
- M3: Deploy/seed scripts, local network flow
- M4: React frontend with wallet connect, register/transfer/verify
- M5: IPFS integration + QR codes
- M6: Sepolia deployment, gas review, security checks (Slither)
- M7: Docs, demo walkthrough, final report

## Conventions
- Never commit private keys or mnemonics; use `.env` (git-ignored) + `.env.example`
- Every contract function has tests including revert cases
- Conventional commit messages
