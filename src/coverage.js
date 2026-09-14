export function buildEvidenceEnvelope(input) {
  const warnings = [...(input.warnings ?? [])];
  const requested = normalizeRange(input.requested, "requested");
  const observed = normalizeRange(input.observed, "observed");
  const headLagBlocks = nonNegativeInteger(input.headLagBlocks ?? 0, "headLagBlocks");
  const staleAfterBlocks = nonNegativeInteger(input.staleAfterBlocks ?? 20, "staleAfterBlocks");
  const paginationComplete = input.paginationComplete === true;

  if (!paginationComplete) warnings.push("pagination-incomplete");
  if (observed.fromBlock > requested.fromBlock || observed.toBlock < requested.toBlock) {
    warnings.push("requested-range-not-fully-observed");
  }
  if (headLagBlocks > staleAfterBlocks) warnings.push("source-behind-chain-head");

  const completeRange = observed.fromBlock <= requested.fromBlock && observed.toBlock >= requested.toBlock;
  const status = headLagBlocks > staleAfterBlocks
    ? "stale"
    : paginationComplete && completeRange
      ? "complete"
      : "partial";

  return Object.freeze({
    requested,
    observed,
    sources: Object.freeze(uniqueStrings(input.sources ?? [])),
    paginationComplete,
    headLagBlocks,
    status,
    warnings: Object.freeze([...new Set(warnings)]),
  });
}

export function mergeEvidenceEnvelopes(envelopes, options = {}) {
  if (!Array.isArray(envelopes) || envelopes.length === 0) {
    throw new TypeError("at least one evidence envelope is required");
  }

  const requested = {
    fromBlock: Math.max(...envelopes.map((part) => part.requested.fromBlock)),
    toBlock: Math.min(...envelopes.map((part) => part.requested.toBlock)),
  };
  const observed = {
    fromBlock: Math.max(...envelopes.map((part) => part.observed.fromBlock)),
    toBlock: Math.min(...envelopes.map((part) => part.observed.toBlock)),
  };

  if (requested.fromBlock > requested.toBlock) throw new RangeError("requested ranges do not overlap");
  if (observed.fromBlock > observed.toBlock) throw new RangeError("observed ranges do not overlap");

  return buildEvidenceEnvelope({
    requested,
    observed,
    sources: envelopes.flatMap((part) => part.sources),
    paginationComplete: envelopes.every((part) => part.paginationComplete),
    headLagBlocks: Math.max(...envelopes.map((part) => part.headLagBlocks)),
    staleAfterBlocks: options.staleAfterBlocks,
    warnings: envelopes.flatMap((part) => part.warnings),
  });
}

export async function fetchAllPages(fetchPage, options = {}) {
  if (typeof fetchPage !== "function") throw new TypeError("fetchPage must be a function");
  const maxPages = nonNegativeInteger(options.maxPages ?? 100, "maxPages");
  if (maxPages === 0) throw new RangeError("maxPages must be greater than zero");

  const records = [];
  let cursor = null;
  let pages = 0;

  try {
    do {
      if (pages >= maxPages) throw new Error("page-limit-reached");
      const page = await fetchPage(cursor);
      if (!page || !Array.isArray(page.items)) throw new TypeError("page.items must be an array");
      records.push(...page.items);
      cursor = page.nextCursor ?? null;
      pages += 1;
    } while (cursor !== null);
    return { records, pages, paginationComplete: true, warning: null };
  } catch (error) {
    return {
      records,
      pages,
      paginationComplete: false,
      warning: error instanceof Error ? error.message : "unknown-fetch-error",
    };
  }
}

function normalizeRange(range, name) {
  if (!range) throw new TypeError(`${name} range is required`);
  const fromBlock = nonNegativeInteger(range.fromBlock, `${name}.fromBlock`);
  const toBlock = nonNegativeInteger(range.toBlock, `${name}.toBlock`);
  if (fromBlock > toBlock) throw new RangeError(`${name} range is reversed`);
  return Object.freeze({ fromBlock, toBlock });
}

function nonNegativeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${name} must be a non-negative safe integer`);
  return value;
}

function uniqueStrings(values) {
  if (!values.every((value) => typeof value === "string" && value.length > 0)) {
    throw new TypeError("sources must contain non-empty strings");
  }
  return [...new Set(values)];
}
