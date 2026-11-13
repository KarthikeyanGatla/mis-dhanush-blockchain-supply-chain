# Demo Walkthrough

1. Start the chain: `npx hardhat node`.
2. Deploy and seed: `npm run deploy:local && npm run seed:local` (creates product #1 with a full lifecycle).
3. Start the UI: `cd frontend && npm run dev`, open http://localhost:5173.
4. **Verify:** enter product ID `1` — see the Authentic badge, details, QR code and 5-step timeline.
5. **Counterfeit check:** enter `999` — shown as not found / possible counterfeit.
6. **Manage:** connect MetaMask with Hardhat account #1 (manufacturer) and register a new batch (optionally upload a file to IPFS).
7. Transfer to account #2 (distributor), then #3 (retailer), then #4 (customer); try skipping a step to see the rejection.
8. Recall the product as account #0 (admin) or the manufacturer; the Verify page now shows RECALLED and further handoffs revert.
