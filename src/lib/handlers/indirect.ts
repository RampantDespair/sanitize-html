import type { Htmlparser2TreeAdapterMap } from "parse5-htmlparser2-tree-adapter";
import type { ReadonlyDeep } from "type-fest";

import type {
  TagAttributeCollectionValueTooManyErrorHandlingMode,
  TagAttributeRecordValueDuplicateErrorHandlingMode,
} from "../../types/error-handling";
import type {
  TagAttributeCollectionValueRule,
  TagAttributeRecordValueRule,
} from "../../types/rules";
import type {
  TagAttribute,
  TagAttributeValueCollection,
  TagAttributeValueRecord,
} from "../../types/tag";

import { handleTagAttributeValueError } from "./direct";

/**
 * Handles errors when attribute collections have too many values.
 *
 * This function processes errors that occur when an attribute collection (record or set)
 * exceeds the maximum allowed number of entries. It can either trim the collection
 * to fit within the limit or escalate to general attribute value error handling.
 *
 * @template T - The type of the attribute value collection (record or set)
 * @param attribute - The attribute containing the collection
 * @param element - The HTML element containing the attribute
 * @param collection - The collection that has too many values
 * @param rule - The validation rule containing the entry limit
 * @param errorHandlingMode - The error handling strategy to apply
 * @param errorMessage - Optional custom error message for logging/throwing
 * @returns An object containing the processed collection and whether to continue processing
 *
 * @example
 * ```typescript
 * import { handleTagAttributeCollectionValueTooManyError } from './handlers/indirect';
 * import type { TagAttributeCollectionValueTooManyErrorHandlingMode } from '../types/error-handling';
 *
 * const attribute: TagAttribute = {
 *   key: "class",
 *   value: "btn btn-primary btn-secondary btn-success btn-warning btn-danger btn-info btn-light btn-dark"
 * };
 * const element = document.createElement("div");
 * const collection = ["btn", "btn-primary", "btn-secondary", "btn-success", "btn-warning", "btn-danger", "btn-info", "btn-light", "btn-dark"];
 * const rule = {
 *   mode: "set",
 *   delimiter: " ",
 *   maxEntries: 5
 * };
 *
 * // Trim the collection to 5 entries
 * const result = handleTagAttributeCollectionValueTooManyError(
 *   attribute,
 *   element,
 *   collection,
 *   rule,
 *   "dropExtra"
 * );
 * console.log(result.output); // ["btn", "btn-primary", "btn-secondary", "btn-success", "btn-warning"]
 * console.log(result.proceed); // true
 * ```
 *
 * @example
 * ```typescript
 * // Record format example
 * const recordAttribute: TagAttribute = {
 *   key: "data-config",
 *   value: "id:1;name:test;class:btn;type:button;size:large;color:blue;theme:dark"
 * };
 * const record = [
 *   { key: "id", val: "1" },
 *   { key: "name", val: "test" },
 *   { key: "class", val: "btn" },
 *   { key: "type", val: "button" },
 *   { key: "size", val: "large" },
 *   { key: "color", val: "blue" },
 *   { key: "theme", val: "dark" }
 * ];
 * const recordRule = {
 *   mode: "record",
 *   entrySeparator: ";",
 *   keyValueSeparator: ":",
 *   maxEntries: 4
 * };
 *
 * const recordResult = handleTagAttributeCollectionValueTooManyError(
 *   recordAttribute,
 *   element,
 *   record,
 *   recordRule,
 *   "dropExtra"
 * );
 * // Keeps only the first 4 entries
 * ```
 */
export function handleTagAttributeCollectionValueTooManyError<
  T extends TagAttributeValueCollection,
>(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  collection: T,
  rule: ReadonlyDeep<TagAttributeCollectionValueRule>,
  errorHandlingMode?: TagAttributeCollectionValueTooManyErrorHandlingMode,
  errorMessage?: string,
): { output: T; proceed: boolean } {
  switch (errorHandlingMode) {
    case "dropExtra":
      collection = collection.slice(0, rule.maxEntries) as T;
      return { output: collection, proceed: true };
    default:
      return {
        output: collection,
        proceed: handleTagAttributeValueError(
          attribute,
          element,
          rule,
          errorHandlingMode,
          errorMessage ??
            `Value ${attribute.value} for attribute ${attribute.key} has too many tokens`,
        ),
      };
  }
}

/**
 * Handles errors when attribute records contain duplicate keys.
 *
 * This function processes errors that occur when a record-format attribute contains
 * multiple entries with the same key. It provides various strategies for handling
 * duplicates, including keeping the first occurrence, keeping the last occurrence,
 * removing all duplicates, or allowing duplicates.
 *
 * @param attribute - The attribute containing the record
 * @param element - The HTML element containing the attribute
 * @param key - The duplicate key that was found
 * @param record - The record containing the duplicate entries
 * @param rule - The validation rule that was violated
 * @param errorHandlingMode - The error handling strategy to apply
 * @param errorMessage - Optional custom error message for logging/throwing
 * @returns An object containing the processed record and processing flags
 *
 * @example
 * ```typescript
 * import { handleTagAttributeRecordValueDuplicateError } from './handlers/indirect';
 * import type { TagAttributeRecordValueDuplicateErrorHandlingMode } from '../types/error-handling';
 *
 * const attribute: TagAttribute = {
 *   key: "data-config",
 *   value: "id:1;name:test;id:2;class:btn" // id appears twice
 * };
 * const element = document.createElement("div");
 * const key = "id"; // The duplicate key
 * const record = [
 *   { key: "id", val: "1" },
 *   { key: "name", val: "test" },
 *   { key: "id", val: "2" }, // Duplicate key
 *   { key: "class", val: "btn" }
 * ];
 * const rule = {
 *   mode: "record",
 *   entrySeparator: ";",
 *   keyValueSeparator: ":",
 *   values: { "id": "*", "name": "*", "class": "*" }
 * };
 *
 * // Keep the first occurrence, remove the duplicate
 * const result = handleTagAttributeRecordValueDuplicateError(
 *   attribute,
 *   element,
 *   key,
 *   record,
 *   rule,
 *   "keepFirst"
 * );
 * console.log(result.output); // [{ key: "id", val: "1" }, { key: "name", val: "test" }, { key: "class", val: "btn" }]
 * console.log(result.globalProceed); // true
 * console.log(result.localProceed); // false (duplicate was removed)
 * ```
 *
 * @example
 * ```typescript
 * // Keep the last occurrence
 * const result = handleTagAttributeRecordValueDuplicateError(
 *   attribute,
 *   element,
 *   key,
 *   record,
 *   rule,
 *   "keepLast"
 * );
 * // Removes the first occurrence, keeps the second
 * ```
 *
 * @example
 * ```typescript
 * // Remove all occurrences of the duplicate key
 * const result = handleTagAttributeRecordValueDuplicateError(
 *   attribute,
 *   element,
 *   key,
 *   record,
 *   rule,
 *   "dropDuplicates"
 * );
 * // Removes both id entries
 * ```
 *
 * @example
 * ```typescript
 * // Allow duplicates (no action taken)
 * const result = handleTagAttributeRecordValueDuplicateError(
 *   attribute,
 *   element,
 *   key,
 *   record,
 *   rule,
 *   "keepDuplicates"
 * );
 * // Record remains unchanged
 * ```
 */
export function handleTagAttributeRecordValueDuplicateError(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  key: string,
  record: TagAttributeValueRecord,
  rule: ReadonlyDeep<TagAttributeRecordValueRule>,
  errorHandlingMode?: TagAttributeRecordValueDuplicateErrorHandlingMode,
  errorMessage?: string,
): {
  globalProceed: boolean;
  localProceed: boolean;
  output: TagAttributeValueRecord;
} {
  switch (errorHandlingMode) {
    case "dropDuplicates":
      record = record.filter((entry) => entry.key !== key);
      return { globalProceed: true, localProceed: false, output: record };
    case "keepDuplicates":
      return { globalProceed: true, localProceed: true, output: record };
    case "keepFirst":
      return { globalProceed: true, localProceed: false, output: record };
    case "keepLast":
      record = record.filter((entry) => entry.key !== key);
      return { globalProceed: true, localProceed: true, output: record };
    default: {
      const result = handleTagAttributeValueError(
        attribute,
        element,
        rule,
        errorHandlingMode,
        errorMessage ??
          `Value ${attribute.value} for attribute ${attribute.key} has duplicate ${key} keys`,
      );
      return { globalProceed: result, localProceed: result, output: record };
    }
  }
}
