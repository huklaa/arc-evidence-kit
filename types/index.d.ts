export type BlockRange = { fromBlock: number; toBlock: number };
export type EvidenceStatus = "complete" | "partial" | "stale";
export type EvidenceEnvelope = Readonly<{
  requested: Readonly<BlockRange>;
  observed: Readonly<BlockRange>;
  sources: readonly string[];
  paginationComplete: boolean;
  headLagBlocks: number;
  status: EvidenceStatus;
  warnings: readonly string[];
}>;

export const ARC_TESTNET: Readonly<{
  id: 5042002;
  name: "Arc Testnet";
  rpcUrl: "https://rpc.testnet.arc.io";
  explorerUrl: "https://testnet.arcscan.app";
  nativeCurrency: Readonly<{ name: "USDC"; symbol: "USDC"; decimals: 18 }>;
  erc20UsdcDecimals: 6;
}>;
export const ARC_USDC_SYSTEM_EMITTER: string;

export function buildEvidenceEnvelope(input: {
  requested: BlockRange;
  observed: BlockRange;
  sources?: string[];
  paginationComplete: boolean;
  headLagBlocks?: number;
  staleAfterBlocks?: number;
  warnings?: string[];
}): EvidenceEnvelope;
export function mergeEvidenceEnvelopes(
  envelopes: EvidenceEnvelope[],
  options?: { staleAfterBlocks?: number },
): EvidenceEnvelope;
export function fetchAllPages<T>(
  fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor?: string | null }>,
  options?: { maxPages?: number },
): Promise<{ records: T[]; pages: number; paginationComplete: boolean; warning: string | null }>;
export function transactionFee(receipt: {
  gasUsed: bigint | number | string;
  effectiveGasPrice: bigint | number | string;
}): bigint;
export function formatNativeUsdc(amount: bigint | number | string, maximumFractionDigits?: number): string;
export function summarizeUsdcActivity(input: {
  address: string;
  transfers: Array<{ from: string; to: string; amount: bigint | number | string }>;
  receipts?: Array<{ gasUsed: bigint | number | string; effectiveGasPrice: bigint | number | string }>;
  coverage: EvidenceEnvelope;
}): Readonly<{
  address: string;
  transferUnits: "erc20-usdc-6-decimals";
  feeUnits: "native-usdc-18-decimals";
  inbound: bigint;
  outbound: bigint;
  netTransfers: bigint;
  executionFees: bigint;
  coverage: EvidenceEnvelope;
}>;
