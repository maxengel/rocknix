#!/usr/bin/env node
/**
 * Purpose: Select exact frozen original bytes for one bounded reread packet.
 * Usage: planRereadDelivery({ sources, requests, limits }).
 * Selection is not dispatch, accepted reading, quota authority or fulfillment.
 * The coordinator must retain the original request and every split mapping.
 */
import { sha256Bytes } from "./council-staged-sources.mjs";

const MAX_BYTES = 32 * 1024 * 1024;
const MAX_SOURCES = 1024;
const MAX_REQUESTS = 256;
const MAX_ITEM_IDS = 1024;
const HASH = /^[a-f0-9]{64}$/;
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

function need(value, message, code = "invalid_reread_request") {
  if (!value) throw Object.assign(new Error(`${code}: ${message}`), { code });
}
function integer(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
function exact(value, keys, context) {
  need(
    value !== null &&
      typeof value === "object" &&
      Object.getPrototypeOf(value) === Object.prototype &&
      Reflect.ownKeys(value).length === keys.length &&
      keys.every((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        return descriptor && Object.hasOwn(descriptor, "value") && descriptor.enumerable;
      }),
    `${context} has missing, unknown or non-data fields`
  );
}
function list(value, minimum, maximum, context) {
  need(
    Array.isArray(value) &&
      Object.getPrototypeOf(value) === Array.prototype &&
      value.length >= minimum &&
      value.length <= maximum &&
      Reflect.ownKeys(value).length === value.length + 1 &&
      Array.from({ length: value.length }, (_, index) =>
        Object.hasOwn(Object.getOwnPropertyDescriptor(value, index) ?? {}, "value")
      ).every(Boolean),
    `${context} has an invalid array shape or count`
  );
}
function label(value) {
  return (
    typeof value === "string" &&
    value.isWellFormed() &&
    value.trim().length > 0 &&
    value.length <= 1024 &&
    !/[\x00-\x1f\x7f]/u.test(value)
  );
}
function boundary(bytes, offset) {
  return offset === 0 || offset === bytes.length || (bytes[offset] & 0xc0) !== 0x80;
}
function range(source, start, end) {
  return {
    source_id: source.id,
    start,
    end,
    sha256: sha256Bytes(source.bytes.subarray(start, end)),
  };
}

/** Validate the complete input before selecting a deterministic, detached prefix. */
export function planRereadDelivery({ sources, requests, limits }) {
  exact(limits, ["max_bytes", "max_parts", "max_requests"], "reread limits");
  need(
    integer(limits.max_bytes, 1, MAX_BYTES) &&
      integer(limits.max_parts, 1, MAX_REQUESTS) &&
      integer(limits.max_requests, 1, MAX_REQUESTS),
    "limits require finite positive values within the hard caps"
  );
  list(sources, 1, MAX_SOURCES, "frozen sources");
  list(requests, 0, limits.max_requests, "reread requests");
  const frozen = new Map();
  for (const supplied of sources) {
    exact(supplied, ["id", "sha256", "bytes"], "frozen source");
    need(label(supplied.id) && !frozen.has(supplied.id), "invalid or duplicate source ID");
    need(
      Buffer.isBuffer(supplied.bytes) && typeof supplied.sha256 === "string" && HASH.test(supplied.sha256),
      "invalid source bytes or hash"
    );
    // Copy before inspecting; returned parts never alias caller-owned originals.
    const bytes = Buffer.from(supplied.bytes);
    need(sha256Bytes(bytes) === supplied.sha256, "frozen source hash mismatch");
    try {
      decoder.decode(bytes);
    } catch {
      need(false, "frozen source is not valid UTF-8");
    }
    frozen.set(supplied.id, { id: supplied.id, bytes });
  }
  const ids = new Set();
  const pending = requests.map((request) => {
    exact(
      request,
      ["id", "source_id", "start", "end", "sha256", "item_ids", "reason"],
      "reread request"
    );
    need(label(request.id) && !ids.has(request.id), "invalid or duplicate request ID");
    ids.add(request.id);
    need(label(request.source_id), "invalid source ID");
    const source = frozen.get(request.source_id);
    need(
      source &&
        integer(request.start) &&
        integer(request.end) &&
        request.start < request.end &&
        request.end <= source.bytes.length,
      "reread interval is empty or outside its frozen source"
    );
    need(
      boundary(source.bytes, request.start) && boundary(source.bytes, request.end),
      "reread interval splits a UTF-8 character"
    );
    need(
      typeof request.sha256 === "string" && HASH.test(request.sha256) &&
        range(source, request.start, request.end).sha256 === request.sha256,
      "reread interval hash mismatch"
    );
    list(request.item_ids, 1, MAX_ITEM_IDS, "reread item references");
    need(
      request.item_ids.every(label) && new Set(request.item_ids).size === request.item_ids.length,
      "invalid or duplicate item reference"
    );
    need(
      typeof request.reason === "string" &&
        request.reason.isWellFormed() &&
        request.reason.trim().length > 0 &&
        request.reason.length <= 65536 &&
        !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(request.reason),
      "invalid reread reason"
    );
    return { ...request, item_ids: [...request.item_ids] };
  });
  // Never depend on host locale, collation libraries or the caller's array order.
  pending.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const deliveries = [], remaining = [];
  let deliveredBytes = 0;
  let stopped = false;
  for (const request of pending) {
    if (stopped || deliveries.length === limits.max_parts || deliveredBytes === limits.max_bytes) {
      stopped = true;
      remaining.push(request);
      continue;
    }
    const source = frozen.get(request.source_id);
    let end = Math.min(request.end, request.start + limits.max_bytes - deliveredBytes);
    while (end > request.start && !boundary(source.bytes, end)) end--;
    if (end === request.start) {
      need(deliveredBytes > 0, "the first requested code point exceeds the packet byte limit", "reread_no_progress");
      stopped = true;
      remaining.push(request);
      continue;
    }
    const selected = range(source, request.start, end);
    deliveries.push({
      request_id: request.id,
      range: selected,
      bytes: Buffer.from(source.bytes.subarray(request.start, end)),
    });
    deliveredBytes += end - request.start;
    if (end < request.end) {
      remaining.push({ ...request, ...range(source, end, request.end) });
      stopped = true;
    }
  }
  return { deliveries, remaining, delivered_bytes: deliveredBytes };
}
