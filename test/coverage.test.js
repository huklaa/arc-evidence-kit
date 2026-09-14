import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEvidenceEnvelope,
  fetchAllPages,
  mergeEvidenceEnvelopes,
} from "../src/index.js";

test("complete coverage requires the full range and complete pagination", () => {
  const result = buildEvidenceEnvelope({
    requested: { fromBlock: 100, toBlock: 200 },
    observed: { fromBlock: 100, toBlock: 200 },
    sources: ["logs"],
    paginationComplete: true,
    headLagBlocks: 2,
  });
  assert.equal(result.status, "complete");
  assert.deepEqual(result.warnings, []);
});

test("partial coverage cannot masquerade as complete", () => {
  const result = buildEvidenceEnvelope({
    requested: { fromBlock: 100, toBlock: 200 },
    observed: { fromBlock: 120, toBlock: 190 },
    sources: ["logs"],
    paginationComplete: false,
  });
  assert.equal(result.status, "partial");
  assert(result.warnings.includes("pagination-incomplete"));
  assert(result.warnings.includes("requested-range-not-fully-observed"));
});

test("stale sources remain stale even when pagination completed", () => {
  const result = buildEvidenceEnvelope({
    requested: { fromBlock: 1, toBlock: 10 },
    observed: { fromBlock: 1, toBlock: 10 },
    paginationComplete: true,
    headLagBlocks: 21,
    staleAfterBlocks: 20,
  });
  assert.equal(result.status, "stale");
});

test("merged coverage uses the intersection, not the broadest range", () => {
  const first = buildEvidenceEnvelope({
    requested: { fromBlock: 100, toBlock: 200 },
    observed: { fromBlock: 100, toBlock: 195 },
    sources: ["logs"], paginationComplete: true,
  });
  const second = buildEvidenceEnvelope({
    requested: { fromBlock: 100, toBlock: 200 },
    observed: { fromBlock: 110, toBlock: 200 },
    sources: ["receipts"], paginationComplete: true,
  });
  const merged = mergeEvidenceEnvelopes([first, second]);
  assert.deepEqual(merged.observed, { fromBlock: 110, toBlock: 195 });
  assert.equal(merged.status, "partial");
});

test("fetchAllPages returns usable records and an explicit failure", async () => {
  const result = await fetchAllPages(async (cursor) => {
    if (cursor === null) return { items: [1, 2], nextCursor: "next" };
    throw new Error("rate-limited");
  });
  assert.deepEqual(result.records, [1, 2]);
  assert.equal(result.paginationComplete, false);
  assert.equal(result.warning, "rate-limited");
});
