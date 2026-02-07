import type { Htmlparser2TreeAdapterMap } from "parse5-htmlparser2-tree-adapter";

import { adapter } from "parse5-htmlparser2-tree-adapter";

import type { TagAttributeValueComparator } from "../types/comparators";

export function matchComparator(
  cmp: TagAttributeValueComparator,
  value: string,
): boolean {
  // Any
  if (cmp === "*") return true;
  // Callback
  if (typeof cmp === "function") return cmp(value);
  // RegExp
  if (cmp instanceof RegExp) return cmp.test(value);
  // Exact string
  if (typeof cmp === "string") return value === cmp;
  // One of
  if (Array.isArray(cmp)) return cmp.includes(value);
  // Boolean
  if (cmp === true) return value === "";
  // Not boolean
  if (cmp === false) return value !== "";
  // Fallback
  return false;
}

export function parseRecord(
  input: string,
  entrySep: string,
  pairSep: string,
): { key: string; val: string }[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const entries = trimmed
    .split(entrySep)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: { key: string; val: string }[] = [];
  for (const e of entries) {
    const entry = e.split(pairSep);
    if (entry.length !== 2) continue;

    const key = entry[0].trim();
    if (!key) continue;

    const val = entry[1].trim();
    if (!val) continue;

    out.push({ key, val });
  }

  return out;
}

export function parseSet(input: string, delimiter: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  return Array.from(
    new Set(
      trimmed
        .split(delimiter)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

export function unwrapInParent(
  element: Htmlparser2TreeAdapterMap["element"],
): void {
  if (element.children.length === 0) {
    adapter.detachNode(element);
    return;
  }

  const parent = element.parentNode;
  if (!parent) {
    adapter.detachNode(element);
    return;
  }

  const next = element.nextSibling;
  for (const child of element.children) {
    if (next) {
      adapter.insertBefore(parent, child, next);
    } else {
      adapter.appendChild(parent, child);
    }
  }

  adapter.detachNode(element);
}
