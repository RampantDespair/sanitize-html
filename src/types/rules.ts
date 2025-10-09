import type { Simplify } from "type-fest";

import type {
  TagAttributeCollectionValueComparator,
  TagAttributeRecordValueComparator,
  TagAttributeSetValueComparator,
  TagAttributeSimpleValueComparator,
  TagAttributeValueComparatorMode,
} from "./comparators";

/**
 * A rule for validating tag attribute collection values that combines comparator logic with rule constraints.
 *
 * This rule extends {@link TagAttributeCollectionValueComparator} with additional validation rules
 * like default values, length limits, and requirement flags.
 *
 * @example
 * ```typescript
 * const rule: TagAttributeCollectionValueRule = {
 *   mode: "record",
 *   entrySeparator: ";",
 *   keyValueSeparator: ":",
 *   maxEntries: 5,
 *   values: { "id": "required", "class": ["btn", "btn-primary"] },
 *   defaultValue: "id:default;class:btn",
 *   maxLength: 100,
 *   required: true
 * };
 * ```
 */
export type TagAttributeCollectionValueRule =
  TagAttributeCollectionValueComparator & TagAttributeValueRuleBase;

/**
 * A rule for validating tag attribute values in record format (key-value pairs).
 *
 * Combines {@link TagAttributeRecordValueComparator} validation with additional rule constraints
 * for handling structured attribute data.
 *
 * @example
 * ```typescript
 * const rule: TagAttributeRecordValueRule = {
 *   mode: "record",
 *   entrySeparator: ";",
 *   keyValueSeparator: ":",
 *   maxEntries: 3,
 *   values: {
 *     "align": ["left", "center", "right"],
 *     "color": /^#[0-9a-fA-F]{6}$/,
 *     "size": (value) => parseInt(value) > 0 && parseInt(value) <= 100
 *   },
 *   defaultValue: "align:left;color:#000000",
 *   required: false
 * };
 * ```
 */
export type TagAttributeRecordValueRule = TagAttributeRecordValueComparator &
  TagAttributeValueRuleBase;

/**
 * A rule for validating tag attribute values in set format (delimiter-separated values).
 *
 * Combines {@link TagAttributeSetValueComparator} validation with additional rule constraints
 * for handling multi-value attributes like `class`.
 *
 * @example
 * ```typescript
 * const rule: TagAttributeSetValueRule = {
 *   mode: "set",
 *   delimiter: " ",
 *   maxEntries: 5,
 *   values: ["btn", "btn-primary", "btn-large", "btn-disabled"],
 *   defaultValue: "btn",
 *   maxLength: 50,
 *   required: true
 * };
 * ```
 */
export type TagAttributeSetValueRule = TagAttributeSetValueComparator &
  TagAttributeValueRuleBase;

/**
 * A rule for validating simple tag attribute values (single values without collections).
 *
 * Combines {@link TagAttributeSimpleValueComparator} validation with additional rule constraints
 * for handling single-value attributes.
 *
 * @example
 * ```typescript
 * const rule: TagAttributeSimpleValueRule = {
 *   mode: "simple",
 *   value: /^https?:\/\//,
 *   defaultValue: "https://example.com",
 *   maxLength: 2000,
 *   required: true
 * };
 * ```
 */
export type TagAttributeSimpleValueRule = TagAttributeSimpleValueComparator &
  TagAttributeValueRuleBase;

/**
 * A simplified rule for validating tag attribute values that handles both collection and simple formats.
 *
 * This is a union type that combines {@link TagAttributeCollectionValueRule} and
 * {@link TagAttributeSimpleValueRule} with shared rule constraints.
 *
 * @example
 * ```typescript
 * // Simple value rule
 * const simpleRule: TagAttributeValueRule = {
 *   mode: "simple",
 *   value: "exact-match",
 *   defaultValue: "default-value",
 *   required: true
 * };
 *
 * // Collection value rule (record format)
 * const collectionRule: TagAttributeValueRule = {
 *   mode: "record",
 *   entrySeparator: ";",
 *   keyValueSeparator: ":",
 *   values: { "id": "*", "class": ["btn"] },
 *   defaultValue: "id:default",
 *   required: false
 * };
 * ```
 */
export type TagAttributeValueRule = Simplify<
  TagAttributeCollectionValueRule | TagAttributeSimpleValueRule
> &
  TagAttributeValueRuleBase;

/**
 * Base properties shared by all tag attribute value rules.
 *
 * Provides common validation constraints and configuration options that can be applied
 * to any attribute value rule regardless of its format (simple, set, or record).
 *
 * @example
 * ```typescript
 * const baseRule: TagAttributeValueRuleBase = {
 *   mode: "simple",
 *   defaultValue: "fallback-value",
 *   maxLength: 100,
 *   required: false
 * };
 * ```
 */
export type TagAttributeValueRuleBase = {
  /** Default value to use when the attribute is missing or invalid (optional) */
  defaultValue?: string;
  /** Maximum allowed length for the attribute value (optional) */
  maxLength?: number;
  /** The validation mode determining how the attribute value should be processed */
  mode: TagAttributeValueComparatorMode;
  /** Whether this attribute is required to be present (optional, defaults to false) */
  required?: boolean;
};
