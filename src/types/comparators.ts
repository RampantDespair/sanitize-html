import type { ReadonlyDeep, Simplify } from "type-fest";

/**
 * A comparator for tag attribute collection values that can handle either record or set formats.
 *
 * This is a union type that simplifies the choice between {@link TagAttributeRecordValueComparator}
 * and {@link TagAttributeSetValueComparator} for validating attribute collections.
 */
export type TagAttributeCollectionValueComparator = Simplify<
  TagAttributeRecordValueComparator | TagAttributeSetValueComparator
>;

/**
 * A comparator for tag attribute values in record format (key-value pairs).
 *
 * Used for attributes like `data-*` or custom attributes that follow a structured format.
 *
 * @example
 * ```typescript
 * const comparator: TagAttributeRecordValueComparator = {
 *   mode: "record",
 *   entrySeparator: ";",
 *   keyValueSeparator: ":",
 *   maxEntries: 5,
 *   values: {
 *     "id": "exact-match",
 *     "class": ["class1", "class2"],
 *     "data-*": /^data-[a-z-]+$/
 *   }
 * };
 * ```
 */
export type TagAttributeRecordValueComparator = ReadonlyDeep<{
  /** Character that separates different key-value pairs in the attribute value */
  entrySeparator: string;
  /** Character that separates keys from values in each pair */
  keyValueSeparator: string;
  /** Maximum number of entries allowed in the record (optional) */
  maxEntries?: number;
  /** Always "record" to indicate this comparator handles record format */
  mode: "record";
  /** Mapping of keys to their respective value comparators */
  values: Record<string, TagAttributeValueComparator>;
}>;

/**
 * A comparator for tag attribute values in set format (space or delimiter-separated values).
 *
 * Used for attributes like `class` that contain multiple values separated by delimiters.
 *
 * @example
 * ```typescript
 * const comparator: TagAttributeSetValueComparator = {
 *   mode: "set",
 *   delimiter: " ",
 *   maxEntries: 10,
 *   values: ["btn", "btn-primary", "btn-large"]
 * };
 * ```
 */
export type TagAttributeSetValueComparator = ReadonlyDeep<{
  /** Character that separates different values in the attribute set */
  delimiter: string;
  /** Maximum number of values allowed in the set (optional) */
  maxEntries?: number;
  /** Always "set" to indicate this comparator handles set format */
  mode: "set";
  /** Comparator for validating individual values in the set */
  values: TagAttributeValueComparator;
}>;

/**
 * A comparator for simple tag attribute values (single values without collections).
 *
 * Used for attributes that contain only a single value without any complex structure.
 *
 * @example
 * ```typescript
 * const comparator: TagAttributeSimpleValueComparator = {
 *   mode: "simple",
 *   value: "https://example.com"
 * };
 * ```
 */
export type TagAttributeSimpleValueComparator = ReadonlyDeep<{
  /** Always "simple" to indicate this comparator handles simple values */
  mode: "simple";
  /** Comparator for validating the single attribute value */
  value: TagAttributeValueComparator;
}>;

/**
 * A comparator for validating individual tag attribute values.
 *
 * Supports multiple validation strategies from simple exact matches to complex regex patterns.
 *
 * @example
 * ```typescript
 * // Exact string match
 * const exactMatch: TagAttributeValueComparator = "exact-value";
 *
 * // One of multiple values
 * const oneOf: TagAttributeValueComparator = ["value1", "value2", "value3"];
 *
 * // Regex pattern
 * const regex: TagAttributeValueComparator = /^https?:\/\//;
 *
 * // Custom function
 * const custom: TagAttributeValueComparator = (value) => value.length > 5;
 *
 * // Boolean values
 * const boolean: TagAttributeValueComparator = true; // or false
 *
 * // Any value allowed
 * const any: TagAttributeValueComparator = "*";
 * ```
 */
export type TagAttributeValueComparator = ReadonlyDeep<
  | "*" // Allow any value
  | ((value: string) => boolean) // Custom validation function
  | false // Reject boolean-like values
  | RegExp // Pattern matching with regular expression
  | string // Exact string match
  | string[] // Must be one of the provided strings
  | true // Accept boolean-like values
>;

/**
 * The available modes for tag attribute value comparators.
 *
 * - `"record"`: For key-value pair collections (e.g., `data-id:123;data-class:btn`)
 * - `"set"`: For delimiter-separated value collections (e.g., `class1 class2 class3`)
 * - `"simple"`: For single values without collections
 */
export type TagAttributeValueComparatorMode = "record" | "set" | "simple";
