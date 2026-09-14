import { transactionFee } from "./arc.js";

export function summarizeUsdcActivity({ address, transfers, receipts = [], coverage }) {
  const normalized = normalizeAddress(address);
  if (!Array.isArray(transfers)) throw new TypeError("transfers must be an array");
  if (!coverage) throw new TypeError("coverage is required");

  let inbound = 0n;
  let outbound = 0n;
  for (const transfer of transfers) {
    const amount = BigInt(transfer.amount);
    if (amount < 0n) throw new RangeError("transfer amount cannot be negative");
    if (normalizeAddress(transfer.to) === normalized) inbound += amount;
    if (normalizeAddress(transfer.from) === normalized) outbound += amount;
  }

  const executionFees = receipts.reduce((total, receipt) => total + transactionFee(receipt), 0n);
  return Object.freeze({
    address: normalized,
    transferUnits: "erc20-usdc-6-decimals",
    feeUnits: "native-usdc-18-decimals",
    inbound,
    outbound,
    netTransfers: inbound - outbound,
    executionFees,
    coverage,
  });
}

function normalizeAddress(value) {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new TypeError("address must be a 20-byte hex EVM address");
  }
  return value.toLowerCase();
}
