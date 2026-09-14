# Arc Evidence Kit

Evidence-aware USDC activity primitives for Arc applications.

Arc Evidence Kit helps wallets, dashboards, agents, and reconciliation tools avoid presenting partial onchain data as complete. It keeps Arc's USDC transfers and USDC execution fees in separate ledgers and attaches an explicit coverage envelope to every derived result.

> Arc is currently testnet-only. This project performs read-only calculations and does not connect wallets, sign messages, or submit transactions.

## Why this exists

An RPC or indexer can return a successful response even when pagination stopped early, sources cover different block ranges, or the indexed head is stale. Exact-looking totals are unsafe unless callers can see the evidence behind them.

Arc also uses USDC as its native gas token. Native gas accounting uses 18 decimals, while the USDC ERC-20 interface uses 6 decimals. They share one underlying balance and must not be displayed as two assets. This kit preserves the unit boundary so transfer values and execution costs are not accidentally mixed.

## Features

- `buildEvidenceEnvelope` classifies results as `complete`, `partial`, or `stale`.
- `mergeEvidenceEnvelopes` conservatively intersects source ranges.
- `fetchAllPages` returns partial records with an explicit failure instead of hiding them.
- `transactionFee` calculates USDC execution cost from an Arc receipt.
- `summarizeUsdcActivity` keeps 6-decimal ERC-20 transfer units separate from 18-decimal native fee units.
- Zero runtime dependencies.

## Example

```js
import {
  buildEvidenceEnvelope,
  formatNativeUsdc,
  summarizeUsdcActivity,
} from "arc-evidence-kit";

const coverage = buildEvidenceEnvelope({
  requested: { fromBlock: 1_284_000, toBlock: 1_319_000 },
  observed: { fromBlock: 1_284_000, toBlock: 1_318_427 },
  sources: ["logs", "receipts"],
  paginationComplete: false,
  headLagBlocks: 573,
});

const summary = summarizeUsdcActivity({
  address: "0x1111111111111111111111111111111111111111",
  transfers: [],
  receipts: [{ gasUsed: 21_000n, effectiveGasPrice: 20_000_000_000n }],
  coverage,
});

console.log(coverage.status); // "stale"
console.log(formatNativeUsdc(summary.executionFees)); // "0.00042"
```

## Safety policy for consumers

Exploratory interfaces may display a partial result alongside its warnings. Accounting, settlement, and compliance-sensitive callers should reject any required input whose coverage is not `complete`.

## Arc assumptions

The constants and unit behavior are based on the current Arc Testnet documentation:

- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.io`
- Native gas token: USDC, 18-decimal gas accounting
- USDC ERC-20 application interface: 6 decimals
- EIP-1559 fee calculation

Current testnet parameters can change before mainnet. Consumers should pin a package version and verify network configuration against the official documentation.

## Development

```bash
npm test
npm run check
```

## Documentation

- [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc)
- [Gas and fees](https://docs.arc.io/arc/references/gas-and-fees)
- [Arc EVM differences](https://docs.arc.io/arc/references/evm-differences)

## Status

Early developer preview. The initial API focuses on evidence propagation and unit-safe summaries; it is not a full indexer.

## License

MIT
