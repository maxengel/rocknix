#!/usr/bin/env node
// Purpose: Validate initial and successor notes against exact frozen original bytes.
// Usage: import { parseMemberNote, validateInitialNote, validateSuccessorNote } from this module.
// Pending reread requests grant no dispatch, completion or coverage authority.
import { TextDecoder } from "node:util";
import { canonicalJson, sha256Bytes } from "./council-staged-sources.mjs";

const MAX_NOTE_BYTES = 1024 * 1024;
const MAX_ITEMS = 1024;
const MAX_REREADS = 256;
const MAX_CHILDREN = 32;
const MAX_CHILD_BYTES = 32 * MAX_NOTE_BYTES;
const MAX_TEXT = 65536;
const HASH = /^[a-f0-9]{64}$/;
const KINDS = new Set(["claim", "definition", "counterevidence", "open-question"]);
const ACTIONS = new Set(["retain", "merge", "qualify", "duplicate"]);
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

function need(condition, message) {
  if (!condition) {
    const error = new Error(`invalid_member_note: ${message}`);
    error.code = "invalid_member_note";
    throw error;
  }
}

function integer(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}

function scalarString(value) {
  if (typeof value !== "string") return false;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}

function label(value) {
  return (
    scalarString(value) &&
    value.trim().length > 0 &&
    value.length <= 1024 &&
    !/[\x00-\x1f\x7f]/u.test(value)
  );
}

function prose(value, empty = false) {
  return (
    scalarString(value) &&
    (empty || value.trim().length > 0) &&
    value.length <= MAX_TEXT &&
    !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(value)
  );
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

function labels(value, minimum, maximum, context) {
  list(value, minimum, maximum, context);
  need(
    value.every(label) && new Set(value).size === value.length,
    `${context} has invalid or duplicate labels`
  );
}

function rangeShape(range, keys = ["source_id", "start", "end", "sha256"]) {
  exact(range, keys, "original range");
  need(label(range.source_id), "original range has an invalid source ID");
  need(
    integer(range.start) && integer(range.end) && range.start <= range.end,
    "original range has invalid bounds"
  );
  need(
    typeof range.sha256 === "string" && HASH.test(range.sha256),
    "original range has an invalid hash"
  );
}

function bodyShape(body, kind = "initial") {
  exact(body, ["items", "dispositions", "reread_requests"], "member note");
  list(body.items, 1, MAX_ITEMS, "items");
  list(
    body.dispositions,
    kind === "initial" ? 0 : 1,
    kind === "initial" ? 0 : MAX_ITEMS,
    `${kind} dispositions`
  );
  list(body.reread_requests, 0, MAX_REREADS, "reread requests");
  for (const item of body.items) {
    exact(
      item,
      ["id", "text", "kinds", "question_ids", "dependency_ids", "uncertainty", "evidence"],
      `${kind} item`
    );
    need(label(item.id) && prose(item.text), "item has an invalid ID or text");
    labels(item.kinds, 1, KINDS.size, "item kinds");
    need(
      item.kinds.every((kind) => KINDS.has(kind)),
      "item has an unknown kind"
    );
    labels(item.question_ids, 1, MAX_ITEMS, "item questions");
    labels(item.dependency_ids, 0, MAX_ITEMS, "item dependencies");
    need(prose(item.uncertainty, true), "item uncertainty is invalid");
    need(
      !item.kinds.includes("open-question") || prose(item.uncertainty),
      "open question erased its uncertainty"
    );
    list(item.evidence, 1, MAX_ITEMS, "item evidence");
    for (const evidence of item.evidence) {
      if (kind === "successor" && evidence?.basis === "carried-note") {
        exact(evidence, ["basis", "child_node_id", "item_id", "range"], "carried evidence");
        need(label(evidence.child_node_id) && label(evidence.item_id), "invalid carried ancestry");
      } else {
        exact(evidence, ["basis", "range"], `${kind} evidence`);
        need(evidence.basis === "current-original", `${kind} evidence must use current originals`);
      }
      rangeShape(evidence.range);
    }
  }
  for (const disposition of body.dispositions) {
    exact(
      disposition,
      ["child_node_id", "item_id", "action", "result_item_id", "reason"],
      "child disposition"
    );
    need(
      label(disposition.child_node_id) && label(disposition.item_id) &&
        label(disposition.result_item_id) && prose(disposition.reason),
      "disposition has an invalid child, item, target or reason"
    );
    need(ACTIONS.has(disposition.action), "unknown disposition action");
  }
  for (const request of body.reread_requests) {
    exact(request, ["id", "source_id", "start", "end", "item_ids", "reason"], "reread request");
    need(
      label(request.id) && label(request.source_id) && prose(request.reason),
      "reread request has an invalid ID, source or reason"
    );
    need(
      integer(request.start) && integer(request.end) && request.start < request.end,
      "reread request has invalid or empty bounds"
    );
    labels(request.item_ids, 1, MAX_ITEMS, "reread item references");
  }
}

function parseNoteJson(bytes, maxBytes) {
  need(integer(maxBytes, 1, MAX_NOTE_BYTES), "invalid note byte limit");
  need(
    Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= maxBytes,
    "note byte exhaustion or missing bytes"
  );
  let body;
  try {
    const text = decoder.decode(bytes);
    body = JSON.parse(text);
    let index = 0;
    const whitespace = () => {
      while (index < text.length && /[\x20\t\r\n]/u.test(text[index])) index++;
    };
    function string() {
      const start = index++;
      while (index < text.length) {
        if (text[index] === "\\") {
          index += 2;
          continue;
        }
        if (text[index++] === '"') {
          const value = JSON.parse(text.slice(start, index));
          need(scalarString(value), "unpaired Unicode surrogate");
          return value;
        }
      }
      need(false, "unterminated JSON string");
    }
    function value(depth = 0) {
      need(depth <= 64, "JSON nesting exceeds the note bound");
      whitespace();
      if (text[index] === '"') {
        string();
        return;
      }
      if (text[index] === "{" || text[index] === "[") {
        const object = text[index++] === "{";
        const end = object ? "}" : "]";
        const keys = new Set();
        whitespace();
        if (text[index] === end) {
          index++;
          return;
        }
        for (;;) {
          if (object) {
            whitespace();
            const key = string();
            need(!keys.has(key), "duplicate JSON key");
            keys.add(key);
            whitespace();
            index++; // The successful JSON.parse already validated the colon.
          }
          value(depth + 1);
          whitespace();
          if (text[index++] === end) return;
        }
      }
      while (index < text.length && !/[\x20\t\r\n,}\]]/u.test(text[index])) index++;
    }
    value();
    canonicalJson(body); // Includes finite-number, plain-record and depth checks.
  } catch (error) {
    if (error.code === "invalid_member_note") throw error;
    need(false, "invalid UTF-8 or JSON value");
  }
  return body;
}

/** Parse strict UTF-8 JSON while preserving the caller's raw-byte hash authority. */
export function parseMemberNote(bytes, { maxBytes = MAX_NOTE_BYTES, kind = "initial" } = {}) {
  need(kind === "initial" || kind === "successor", "unknown member note kind");
  const body = parseNoteJson(bytes, maxBytes);
  bodyShape(body, kind);
  return body;
}

function sourceIndex(sources) {
  list(sources, 1, MAX_ITEMS, "frozen sources");
  const result = new Map();
  for (const source of sources) {
    exact(source, ["id", "sha256", "bytes"], "frozen source");
    need(label(source.id) && !result.has(source.id), "invalid or duplicate frozen source ID");
    need(
      Buffer.isBuffer(source.bytes) &&
        typeof source.sha256 === "string" &&
        HASH.test(source.sha256),
      "invalid frozen source bytes or hash"
    );
    need(sha256Bytes(source.bytes) === source.sha256, "frozen source hash mismatch");
    try {
      decoder.decode(source.bytes);
    } catch {
      need(false, "frozen source is not valid UTF-8");
    }
    result.set(source.id, source);
  }
  return result;
}

function verifyRange(range, sources, allowEmpty = true) {
  const source = sources.get(range.source_id);
  need(
    source &&
      integer(range.start) &&
      integer(range.end) &&
      range.start <= range.end &&
      range.end <= source.bytes.length,
    "range is outside its frozen source"
  );
  need(
    range.end > range.start || (allowEmpty && source.bytes.length === 0),
    "empty range in a nonempty source or reread"
  );
  const boundary = (offset) =>
    offset === 0 || offset === source.bytes.length || (source.bytes[offset] & 0xc0) !== 0x80;
  need(boundary(range.start) && boundary(range.end), "range splits a UTF-8 character");
  const hash = sha256Bytes(source.bytes.subarray(range.start, range.end));
  if (Object.hasOwn(range, "sha256")) need(range.sha256 === hash, "original range hash mismatch");
  return hash;
}

function dependencies(items) {
  const known = new Map(items.map((item) => [item.id, item]));
  need(known.size === items.length, "duplicate item ID");
  const remaining = new Map();
  const dependents = new Map(items.map((item) => [item.id, []]));
  for (const item of items) {
    remaining.set(item.id, item.dependency_ids.length);
    for (const id of item.dependency_ids) {
      need(id !== item.id && known.has(id), "missing or self-referential item dependency");
      dependents.get(id).push(item.id);
    }
  }
  const ready = items.filter((item) => item.dependency_ids.length === 0).map((item) => item.id);
  for (let cursor = 0; cursor < ready.length; cursor++) {
    for (const id of dependents.get(ready[cursor])) {
      const left = remaining.get(id) - 1;
      remaining.set(id, left);
      if (left === 0) ready.push(id);
    }
  }
  need(ready.length === items.length, "cyclic item dependencies");
  return known;
}

function noteLimits(limits) {
  exact(
    limits,
    ["max_note_bytes", "max_items", "max_reread_requests", "max_reread_bytes"],
    "note limits"
  );
  need(
    integer(limits.max_note_bytes, 1, MAX_NOTE_BYTES) &&
      integer(limits.max_items, 1, MAX_ITEMS) &&
      integer(limits.max_reread_requests, 0, MAX_REREADS) &&
      integer(limits.max_reread_bytes),
    "invalid note limits"
  );
}

function pendingRequests(body, items, frozen, limits) {
  const requests = new Set();
  let rereadBytes = 0;
  const rereads = body.reread_requests.map((request) => {
    need(!requests.has(request.id), "duplicate reread ID");
    requests.add(request.id);
    need(
      request.item_ids.every((id) => items.has(id)),
      "reread names an unknown item"
    );
    const hash = verifyRange(request, frozen, false);
    const size = request.end - request.start;
    need(size <= limits.max_reread_bytes - rereadBytes, "reread byte exhaustion");
    rereadBytes += size;
    need(integer(rereadBytes), "unsafe reread byte total");
    return { ...request, sha256: hash, item_ids: [...request.item_ids] };
  });
  return { rereads, reread_bytes: rereadBytes };
}

/** Validate one initial leaf, returning only detached data and pending requests. */
export function validateInitialNote({ bytes, sources, deliveredRanges, questionIds, limits }) {
  noteLimits(limits);
  const body = parseMemberNote(bytes, { maxBytes: limits.max_note_bytes });
  need(
    body.items.length <= limits.max_items &&
      body.reread_requests.length <= limits.max_reread_requests,
    "item or reread count exhausted"
  );
  const frozen = sourceIndex(sources);
  labels(questionIds, 1, MAX_ITEMS, "frozen questions");
  const questions = new Set(questionIds);
  list(deliveredRanges, 1, MAX_ITEMS, "delivered primary ranges");
  const delivered = new Set();
  for (const range of deliveredRanges) {
    rangeShape(range, ["source_id", "start", "end", "sha256", "purpose"]);
    need(range.purpose === "primary", "initial delivery must be a primary range");
    verifyRange(range, frozen);
    const key = canonicalJson(range);
    need(!delivered.has(key), "duplicate delivered range");
    delivered.add(key);
  }
  const items = dependencies(body.items);
  for (const item of body.items) {
    need(
      item.question_ids.every((id) => questions.has(id)),
      "item names an unplanned question"
    );
    const evidenceRanges = new Set();
    for (const evidence of item.evidence) {
      const range = evidence.range;
      verifyRange(range, frozen);
      need(
        deliveredRanges.some(
          (outer) =>
            outer.source_id === range.source_id &&
            outer.start <= range.start &&
            outer.end >= range.end
        ),
        "original evidence was not wholly delivered"
      );
      const key = canonicalJson(range);
      need(!evidenceRanges.has(key), "duplicate original evidence");
      evidenceRanges.add(key);
    }
  }
  return { body, note_sha256: sha256Bytes(bytes), ...pendingRequests(body, items, frozen, limits) };
}

const childKey = (nodeId, itemId) => canonicalJson([nodeId, itemId]);
const originalRanges = (item) => new Set(item.evidence.map(({ range }) => canonicalJson(range)));

function retainedPayload(item, ranges, dependencyIds = []) {
  return canonicalJson({
    text: item.text,
    kinds: [...item.kinds].sort(),
    question_ids: [...item.question_ids].sort(),
    uncertainty: item.uncertainty,
    ranges: [...ranges].sort(),
    dependency_ids: [...dependencyIds].sort(),
  });
}

function localItems(body, frozen, questions, initial = false) {
  const items = dependencies(body.items);
  for (const item of body.items) {
    need(item.question_ids.every((id) => questions.has(id)), "item names an unplanned question");
    const evidenceKeys = new Set();
    for (const evidence of item.evidence) {
      verifyRange(evidence.range, frozen);
      const key = canonicalJson(initial ? evidence.range : evidence);
      need(!evidenceKeys.has(key), "duplicate original evidence");
      evidenceKeys.add(key);
    }
  }
  return items;
}

/** Validate direct-child transformations; stored acceptance and global ancestry stay with the caller. */
export function validateSuccessorNote({ bytes, sources, deliveredRanges, questionIds, limits, children }) {
  noteLimits(limits);
  const body = parseMemberNote(bytes, { maxBytes: limits.max_note_bytes, kind: "successor" });
  need(
    body.items.length <= limits.max_items && body.reread_requests.length <= limits.max_reread_requests,
    "item or reread count exhausted"
  );
  const frozen = sourceIndex(sources);
  labels(questionIds, 1, MAX_ITEMS, "frozen questions");
  const questions = new Set(questionIds);
  list(deliveredRanges, 0, MAX_ITEMS, "delivered reread ranges");
  const delivered = new Set();
  for (const range of deliveredRanges) {
    rangeShape(range, ["source_id", "start", "end", "sha256", "purpose"]);
    need(range.purpose === "reread", "successor delivery must be a reread range");
    verifyRange(range, frozen); // An empty frozen source retains its exact empty-file marker.
    const key = canonicalJson(range);
    need(!delivered.has(key), "duplicate delivered range");
    delivered.add(key);
  }
  list(children, 1, MAX_CHILDREN, "consumed children");
  const nodes = new Set();
  let childBytes = 0;
  for (const child of children) {
    exact(child, ["node_id", "bytes"], "consumed child");
    need(label(child.node_id) && !nodes.has(child.node_id), "invalid or duplicate child node ID");
    nodes.add(child.node_id);
    need(
      Buffer.isBuffer(child.bytes) && child.bytes.length > 0 && child.bytes.length <= MAX_NOTE_BYTES,
      "child note byte exhaustion or missing bytes"
    );
    childBytes += child.bytes.length;
    need(childBytes <= MAX_CHILD_BYTES, "aggregate child note byte exhaustion");
  }
  const consumed = new Map();
  for (const child of children) {
    const childBody = parseNoteJson(child.bytes, MAX_NOTE_BYTES);
    // The structured disposition array distinguishes the formats; prose never selects a kind.
    const initial = Array.isArray(childBody?.dispositions) && childBody.dispositions.length === 0;
    bodyShape(childBody, initial ? "initial" : "successor");
    need(consumed.size + childBody.items.length <= MAX_ITEMS, "consumed child item exhaustion");
    const childItems = localItems(childBody, frozen, questions, initial);
    pendingRequests(childBody, childItems, frozen, { max_reread_bytes: Number.MAX_SAFE_INTEGER });
    for (const item of childBody.items) {
      consumed.set(childKey(child.node_id, item.id), {
        nodeId: child.node_id,
        item,
        ranges: originalRanges(item),
      });
    }
  }
  const items = localItems(body, frozen, questions);
  const resultRanges = new Map(body.items.map((item) => [item.id, originalRanges(item)]));
  const resultPayloads = new Map(body.items.map((item) =>
    [item.id, retainedPayload(item, resultRanges.get(item.id), item.dependency_ids)]
  ));
  const dispositions = new Map();
  const byResult = new Map(body.items.map((item) => [item.id, []]));
  const nonduplicateSignatures = new Map(body.items.map((item) => [item.id, new Set()]));
  for (const disposition of body.dispositions) {
    const key = childKey(disposition.child_node_id, disposition.item_id);
    need(consumed.has(key), "disposition names an unknown child item");
    need(!dispositions.has(key), "duplicate child disposition");
    need(items.has(disposition.result_item_id), "disposition names an unknown result item");
    dispositions.set(key, disposition);
    byResult.get(disposition.result_item_id).push(consumed.get(key));
  }
  need(dispositions.size === consumed.size, "missing child disposition");

  for (const item of body.items) {
    let currentOriginal = false;
    for (const evidence of item.evidence) {
      const range = evidence.range;
      if (evidence.basis === "current-original") {
        need(
          deliveredRanges.some((outer) =>
            outer.source_id === range.source_id && outer.start <= range.start && outer.end >= range.end
          ),
          "original evidence was not wholly delivered"
        );
        currentOriginal = true;
      } else {
        const key = childKey(evidence.child_node_id, evidence.item_id);
        need(consumed.has(key), "carried evidence names an unknown child item");
        need(
          dispositions.get(key).result_item_id === item.id,
          "carried ancestry belongs to another result item"
        );
        need(consumed.get(key).ranges.has(canonicalJson(range)), "invented carried original range");
      }
    }
    need(byResult.get(item.id).length > 0 || currentOriginal, "new item needs current-original evidence");
  }

  for (const [key, entry] of consumed) {
    const disposition = dispositions.get(key);
    const target = items.get(disposition.result_item_id);
    const mapped = new Set();
    for (const id of entry.item.dependency_ids) {
      const dependency = dispositions.get(childKey(entry.nodeId, id));
      if (dependency.result_item_id === target.id) {
        need(
          disposition.action === "merge" && dependency.action === "merge",
          "only merge dispositions at both endpoints may collapse a child dependency"
        );
      } else mapped.add(dependency.result_item_id);
    }
    need([...mapped].every((id) => target.dependency_ids.includes(id)), "lost mapped child dependency");
    entry.signature = retainedPayload(entry.item, entry.ranges, mapped);
    const targetRanges = resultRanges.get(target.id);
    if (disposition.action === "retain") {
      need(
        entry.signature === resultPayloads.get(target.id),
        "retained child payload changed"
      );
    }
    need([...entry.ranges].every((range) => targetRanges.has(range)), "lost child original evidence");
    need(
      entry.item.question_ids.every((id) => target.question_ids.includes(id)),
      "lost child question"
    );
    need(
      entry.item.kinds.filter((kind) => kind === "counterevidence" || kind === "open-question")
        .every((kind) => target.kinds.includes(kind)),
      "lost child counterevidence or open-question tag"
    );
    need(!entry.item.uncertainty.trim() || prose(target.uncertainty), "erased child uncertainty");
    if (disposition.action !== "duplicate") nonduplicateSignatures.get(target.id).add(entry.signature);
  }
  for (const [key, entry] of consumed) {
    const disposition = dispositions.get(key);
    if (disposition.action !== "duplicate") continue;
    need(
      nonduplicateSignatures.get(disposition.result_item_id).has(entry.signature),
      "duplicate lacks a structurally equivalent nonduplicate child at the same result"
    );
    need(
      resultPayloads.get(disposition.result_item_id) === entry.signature,
      "duplicate result payload is not retained equivalent"
    );
  }
  return { body, note_sha256: sha256Bytes(bytes), ...pendingRequests(body, items, frozen, limits) };
}
