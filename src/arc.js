export const ARC_TESTNET = Object.freeze({
  id: 5_042_002,
  name: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.io",
  explorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: Object.freeze({ name: "USDC", symbol: "USDC", decimals: 18 }),
  erc20UsdcDecimals: 6,
});

export const ARC_USDC_SYSTEM_EMITTER =
  "0xfffffffffffFFFFfFFfFffffFFFFfFfFfffffFE".toLowerCase();

export function transactionFee(receipt) {
  if (receipt == null) throw new TypeError("receipt is required");
  const gasUsed = toBigInt(receipt.gasUsed, "gasUsed");
  const gasPrice = toBigInt(receipt.effectiveGasPrice, "effectiveGasPrice");
  return gasUsed * gasPrice;
}

export function formatNativeUsdc(amount, maximumFractionDigits = 6) {
  const value = toBigInt(amount, "amount");
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const base = 10n ** 18n;
  const whole = absolute / base;
  const fraction = (absolute % base)
    .toString()
    .padStart(18, "0")
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function toBigInt(value, name) {
  try {
    return BigInt(value);
  } catch {
    throw new TypeError(`${name} must be bigint-compatible`);
  }
}
