import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEvidenceEnvelope,
  formatNativeUsdc,
  summarizeUsdcActivity,
  transactionFee,
} from "../src/index.js";

const wallet = "0x1111111111111111111111111111111111111111";
const other = "0x2222222222222222222222222222222222222222";

test("USDC transfers and USDC execution fees stay in separate ledgers", () => {
  const coverage = buildEvidenceEnvelope({
    requested: { fromBlock: 1, toBlock: 10 },
    observed: { fromBlock: 1, toBlock: 10 },
    sources: ["logs", "receipts"], paginationComplete: true,
  });
  const result = summarizeUsdcActivity({
    address: wallet,
    transfers: [
      { from: other, to: wallet, amount: 10_000_000n },
      { from: wallet, to: other, amount: 2_500_000n },
    ],
    receipts: [{ gasUsed: 21_000n, effectiveGasPrice: 20_000_000_000n }],
    coverage,
  });
  assert.equal(result.inbound, 10_000_000n);
  assert.equal(result.outbound, 2_500_000n);
  assert.equal(result.netTransfers, 7_500_000n);
  assert.equal(result.executionFees, 420_000_000_000_000n);
});

test("transaction fees use Arc native 18-decimal accounting", () => {
  const fee = transactionFee({ gasUsed: "21000", effectiveGasPrice: "20000000000" });
  assert.equal(formatNativeUsdc(fee), "0.00042");
});
