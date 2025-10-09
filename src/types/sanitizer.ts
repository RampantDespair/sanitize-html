import type { ReadonlyDeep } from "type-fest";

import type {
  TagAttributeCollectionValueTooManyErrorHandlingMode,
  TagAttributeErrorHandlingMode,
  TagAttributeRecordValueDuplicateErrorHandlingMode,
  TagAttributeRecordValueErrorHandlingMode,
  TagAttributeSetValueErrorHandlingMode,
  TagAttributeValueErrorHandlingMode,
  TagAttributeValueTooLongErrorHandlingMode,
  TagChildrenErrorHandlingMode,
  TagErrorHandlingMode,
  TagNestingErrorHandlingMode,
} from "./error-handling";
import type { TagKey, TagLimits, TagRule } from "./tag";

/**
 * Configuration for how different types of errors should be handled during sanitization.
 *
 * Provides fine-grained control over error handling behavior for various scenarios
 * that can occur when processing HTML tags and attributes.
 *
 * @example
 * ```typescript
 * const errorHandling: ErrorHandling = {
 *   tag: "discardElement",
 *   tagChildren: "discardFirsts",
 *   tagNesting: "throwError",
 *   attribute: "discardAttribute",
 *   attributeValue: "applyDefaultValue",
 *   attributeValueTooLong: "trimExcess",
 *   attributeCollectionValueTooMany: "dropExtra",
 *   attributeRecordValueDuplicate: "keepFirst",
 *   attributeSetValue: "dropValue",
 *   attributeRecordValue: "dropPair"
 * };
 * ```
 */
export type ErrorHandling = {
  /** How to handle general tag attribute errors */
  attribute?: TagAttributeErrorHandlingMode;
  /** How to handle when attribute collections have too many values */
  attributeCollectionValueTooMany?: TagAttributeCollectionValueTooManyErrorHandlingMode;
  /** How to handle errors in attribute record values */
  attributeRecordValue?: TagAttributeRecordValueErrorHandlingMode;
  /** How to handle duplicate values in attribute records */
  attributeRecordValueDuplicate?: TagAttributeRecordValueDuplicateErrorHandlingMode;
  /** How to handle errors in attribute set values */
  attributeSetValue?: TagAttributeSetValueErrorHandlingMode;
  /** How to handle general attribute value errors */
  attributeValue?: TagAttributeValueErrorHandlingMode;
  /** How to handle when attribute values are too long */
  attributeValueTooLong?: TagAttributeValueTooLongErrorHandlingMode;
  /** How to handle general tag errors */
  tag?: TagErrorHandlingMode;
  /** How to handle errors with tag children */
  tagChildren?: TagChildrenErrorHandlingMode;
  /** How to handle tag nesting errors */
  tagNesting?: TagNestingErrorHandlingMode;
};

/**
 * Configuration options for the HTML sanitizer.
 *
 * Defines the complete set of options that control how HTML content is sanitized,
 * including error handling strategies, tag rules, and processing limits.
 *
 * @example
 * ```typescript
 * const options: SanitizerOptions = {
 *   preserveComments: true,
 *   errorHandling: {
 *     tag: "discardElement",
 *     attribute: "discardAttribute"
 *   },
 *   tags: {
 *     "div": {
 *       allowedAttributes: ["class", "id"],
 *       allowedValues: {
 *         "class": ["container", "row", "col"]
 *       }
 *     },
 *     "a": {
 *       allowedAttributes: ["href"],
 *       allowedValues: {
 *         "href": /^https?:\/\//
 *       }
 *     }
 *   },
 *   topLevelLimits: {
 *     maxDepth: 10,
 *     maxChildren: 100
 *   }
 * };
 * ```
 */
export type SanitizerOptions = ReadonlyDeep<{
  /** Configuration for error handling behavior during sanitization */
  errorHandling?: ErrorHandling;
  /** Whether to preserve HTML comments in the output (default: false) */
  preserveComments?: boolean;
  /** Rules defining which tags and attributes are allowed */
  tags?: Record<TagKey, TagRule>;
  /** Limits applied to the top-level document structure */
  topLevelLimits?: TagLimits;
}>;

/**
 * Internal state tracking for the HTML sanitizer during processing.
 *
 * Maintains information about the current nesting depth and tag hierarchy
 * to enforce nesting rules and limits during sanitization.
 *
 * @example
 * ```typescript
 * const state: SanitizerState = {
 *   rootNesting: 2,
 *   tagNesting: [
 *     { key: "div", value: 1 },
 *     { key: "span", value: 1 },
 *     { key: "p", value: 0 }
 *   ]
 * };
 * ```
 */
export type SanitizerState = {
  /** Current nesting depth from the root element */
  rootNesting: number;
  /** Array tracking the nesting count for each tag type */
  tagNesting: {
    /** The tag name being tracked */
    key: TagKey;
    /** Current nesting depth for this specific tag */
    value: number;
  }[];
};
