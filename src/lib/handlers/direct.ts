import type { Htmlparser2TreeAdapterMap } from "parse5-htmlparser2-tree-adapter";
import type { ReadonlyDeep } from "type-fest";

import { adapter } from "parse5-htmlparser2-tree-adapter";

import type {
  TagAttributeErrorHandlingMode,
  TagAttributeRecordValueErrorHandlingMode,
  TagAttributeSetValueErrorHandlingMode,
  TagAttributeValueErrorHandlingMode,
  TagAttributeValueTooLongErrorHandlingMode,
  TagChildrenErrorHandlingMode,
  TagErrorHandlingMode,
  TagNestingErrorHandlingMode,
} from "../../types/error-handling";
import type {
  TagAttributeRecordValueRule,
  TagAttributeSetValueRule,
  TagAttributeValueRule,
} from "../../types/rules";
import type { TagAttribute } from "../../types/tag";

import { unwrapInParent } from "../helpers";

/**
 * Handles errors related to tag attributes by applying the specified error handling strategy.
 *
 * This function processes attribute-level errors and applies the configured handling mode.
 * It can either remove the problematic attribute or escalate to tag-level error handling.
 *
 * @param attribute - The attribute that caused the error
 * @param element - The HTML element containing the attribute
 * @param errorHandlingMode - The error handling strategy to apply
 * @param errorMessage - Optional custom error message for logging/throwing
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { handleTagAttributeError } from './handlers/direct';
 * import type { TagAttributeErrorHandlingMode } from '../types/error-handling';
 *
 * const attribute: TagAttribute = { key: "onclick", value: "alert('xss')" };
 * const element = document.createElement("div");
 *
 * // Remove the attribute and continue processing
 * const result = handleTagAttributeError(
 *   attribute,
 *   element,
 *   "discardAttribute"
 * );
 * console.log(result); // true - processing continues
 * ```
 *
 * @throws {Error} Throws an error if `errorHandlingMode` is "throwError" or falls back to tag-level handling
 */
export function handleTagAttributeError(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  errorHandlingMode?: TagAttributeErrorHandlingMode,
  errorMessage?: string,
): boolean {
  switch (errorHandlingMode) {
    case "discardAttribute":
      delete element.attribs[attribute.key];
      return true;
    default:
      return handleTagError(
        element,
        errorHandlingMode,
        errorMessage ?? `Attribute ${attribute.key} is not allowed`,
      );
  }
}

/**
 * Handles errors related to record value pairs in tag attributes.
 *
 * This function processes errors that occur when validating key-value pairs
 * in record-format attributes (e.g., `data-*` attributes with structured values).
 * It can either remove the problematic pair or escalate to attribute-level handling.
 *
 * @param attribute - The attribute containing the record
 * @param element - The HTML element containing the attribute
 * @param record - The array of key-value pairs being validated
 * @param index - The index of the problematic pair in the record
 * @param rule - The validation rule that was violated
 * @param errorHandlingMode - The error handling strategy to apply
 * @param errorMessage - Optional custom error message for logging/throwing
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { handleTagAttributeRecordValueError } from './handlers/direct';
 * import type { TagAttributeRecordValueErrorHandlingMode } from '../types/error-handling';
 *
 * const attribute: TagAttribute = { key: "data-config", value: "id:123;class:btn;script:alert(1)" };
 * const element = document.createElement("div");
 * const record = [
 *   { key: "id", val: "123" },
 *   { key: "class", val: "btn" },
 *   { key: "script", val: "alert(1)" } // This pair is problematic
 * ];
 *
 * // Remove the problematic pair and continue
 * const result = handleTagAttributeRecordValueError(
 *   attribute,
 *   element,
 *   record,
 *   2, // index of the problematic pair
 *   rule,
 *   "dropPair"
 * );
 * ```
 */
export function handleTagAttributeRecordValueError(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  record: { key: string; val: string }[],
  index: number,
  rule: ReadonlyDeep<TagAttributeRecordValueRule>,
  errorHandlingMode?: TagAttributeRecordValueErrorHandlingMode,
  errorMessage?: string,
): boolean {
  switch (errorHandlingMode) {
    case "dropPair":
      return true;
    default:
      return handleTagAttributeValueError(
        attribute,
        element,
        rule,
        errorHandlingMode,
        errorMessage ??
          `Pair ${record[index].key}=${record[index].val} for attribute ${attribute.key} is not allowed`,
      );
  }
}

/**
 * Handles errors related to individual values in set-format tag attributes.
 *
 * This function processes errors that occur when validating individual values
 * in set-format attributes (e.g., `class` attributes with space-separated values).
 * It can either remove the problematic value or escalate to attribute-level handling.
 *
 * @param attribute - The attribute containing the set
 * @param element - The HTML element containing the attribute
 * @param index - The index of the problematic value in the set
 * @param set - The array of values being validated
 * @param rule - The validation rule that was violated
 * @param errorHandlingMode - The error handling strategy to apply
 * @param errorMessage - Optional custom error message for logging/throwing
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { handleTagAttributeSetValueError } from './handlers/direct';
 * import type { TagAttributeSetValueErrorHandlingMode } from '../types/error-handling';
 *
 * const attribute: TagAttribute = { key: "class", value: "btn btn-primary btn-danger" };
 * const element = document.createElement("div");
 * const set = ["btn", "btn-primary", "btn-danger"]; // btn-danger is not allowed
 *
 * // Remove the problematic value and continue
 * const result = handleTagAttributeSetValueError(
 *   attribute,
 *   element,
 *   2, // index of the problematic value
 *   set,
 *   rule,
 *   "dropValue"
 * );
 * ```
 */
export function handleTagAttributeSetValueError(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  index: number,
  set: string[],
  rule: ReadonlyDeep<TagAttributeSetValueRule>,
  errorHandlingMode?: TagAttributeSetValueErrorHandlingMode,
  errorMessage?: string,
): boolean {
  switch (errorHandlingMode) {
    case "dropValue":
      return true;
    default:
      return handleTagAttributeValueError(
        attribute,
        element,
        rule,
        errorHandlingMode,
        errorMessage ??
          `Value ${set[index]} for attribute ${attribute.key} is not allowed`,
      );
  }
}

/**
 * Handles errors related to attribute values by applying default values or escalating to attribute-level handling.
 *
 * This function processes general attribute value errors and can either apply a default value
 * from the rule configuration or escalate to attribute-level error handling.
 *
 * @param attribute - The attribute that caused the error
 * @param element - The HTML element containing the attribute
 * @param rule - The validation rule that was violated
 * @param errorHandlingMode - The error handling strategy to apply
 * @param errorMessage - Optional custom error message for logging/throwing
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { handleTagAttributeValueError } from './handlers/direct';
 * import type { TagAttributeValueErrorHandlingMode } from '../types/error-handling';
 *
 * const attribute: TagAttribute = { key: "href", value: "javascript:alert(1)" };
 * const element = document.createElement("a");
 * const rule = {
 *   mode: "simple",
 *   value: /^https?:\/\//,
 *   defaultValue: "https://example.com"
 * };
 *
 * // Apply default value and continue
 * const result = handleTagAttributeValueError(
 *   attribute,
 *   element,
 *   rule,
 *   "applyDefaultValue"
 * );
 * // element.attribs.href is now "https://example.com"
 * ```
 */
export function handleTagAttributeValueError(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  rule: ReadonlyDeep<TagAttributeValueRule>,
  errorHandlingMode?: TagAttributeValueErrorHandlingMode,
  errorMessage?: string,
): boolean {
  switch (errorHandlingMode) {
    case "applyDefaultValue":
      if (rule.defaultValue) {
        element.attribs[attribute.key] = rule.defaultValue;
      } else {
        delete element.attribs[attribute.key];
      }
      return true;
    default:
      return handleTagAttributeError(
        attribute,
        element,
        errorHandlingMode,
        errorMessage ??
          `Value ${attribute.value} for attribute ${attribute.key} is not allowed`,
      );
  }
}

/**
 * Handles errors related to attribute values that exceed the maximum allowed length.
 *
 * This function processes length validation errors and can either trim the value
 * to fit within the limit or escalate to attribute-level error handling.
 *
 * @param attribute - The attribute that caused the error
 * @param element - The HTML element containing the attribute
 * @param rule - The validation rule containing the length limit
 * @param errorHandlingMode - The error handling strategy to apply
 * @param errorMessage - Optional custom error message for logging/throwing
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { handleTagAttributeValueTooLongError } from './handlers/direct';
 * import type { TagAttributeValueTooLongErrorHandlingMode } from '../types/error-handling';
 *
 * const attribute: TagAttribute = { key: "title", value: "This is a very long title that exceeds the limit" };
 * const element = document.createElement("div");
 * const rule = {
 *   mode: "simple",
 *   value: "*",
 *   maxLength: 20
 * };
 *
 * // Trim the value and continue
 * const result = handleTagAttributeValueTooLongError(
 *   attribute,
 *   element,
 *   rule,
 *   "trimExcess"
 * );
 * // element.attribs.title is now "This is a very long"
 * ```
 */
export function handleTagAttributeValueTooLongError(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  rule: ReadonlyDeep<TagAttributeValueRule>,
  errorHandlingMode?: TagAttributeValueTooLongErrorHandlingMode,
  errorMessage?: string,
): boolean {
  switch (errorHandlingMode) {
    case "trimExcess":
      element.attribs[attribute.key] = attribute.value.slice(0, rule.maxLength);
      return true;
    default:
      return handleTagAttributeValueError(
        attribute,
        element,
        rule,
        errorHandlingMode,
        errorMessage ??
          `Value ${attribute.value} for attribute ${attribute.key} is too long`,
      );
  }
}

/**
 * Handles errors related to elements that have too many children.
 *
 * This function processes structural validation errors when an element exceeds
 * its maximum allowed number of children. It can remove excess children or
 * remove the entire element based on the configured strategy.
 *
 * @param element - The element that has too many children (can be document or element)
 * @param maxChildren - The maximum number of children allowed
 * @param errorHandlingMode - The error handling strategy to apply
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { handleTagChildrenError } from './handlers/direct';
 * import type { TagChildrenErrorHandlingMode } from '../types/error-handling';
 *
 * const element = document.createElement("div");
 * // Add 10 children to an element with maxChildren = 5
 * for (let i = 0; i < 10; i++) {
 *   const child = document.createElement("span");
 *   element.appendChild(child);
 * }
 *
 * // Remove the first 5 excess children
 * const result = handleTagChildrenError(
 *   element,
 *   5,
 *   "discardFirsts"
 * );
 * console.log(element.children.length); // 5
 * ```
 *
 * @throws {Error} Throws an error if `errorHandlingMode` is "throwError"
 */
export function handleTagChildrenError(
  element:
    | Htmlparser2TreeAdapterMap["document"]
    | Htmlparser2TreeAdapterMap["element"],
  maxChildren: number,
  errorHandlingMode?: TagChildrenErrorHandlingMode,
): boolean {
  const { children } = element;
  const len = children.length;
  const excess = Math.max(0, len - maxChildren);

  switch (errorHandlingMode) {
    case "discardElement": {
      adapter.detachNode(element);
      return false;
    }
    case "discardFirsts": {
      if (excess > 0) {
        for (let i = 0; i < excess; i++) {
          const first = element.children[0];
          if (first) {
            adapter.detachNode(first);
          }
        }
      }
      return true;
    }
    case "discardLasts": {
      if (excess > 0) {
        for (let i = 0; i < excess; i++) {
          const last = element.children[element.children.length - 1];
          if (last) {
            adapter.detachNode(last);
          }
        }
      }
      return true;
    }
    case "throwError":
    default:
      if ("tagName" in element) {
        throw new Error(
          `Tag ${element.tagName} has exceeded the maximum allowed number of children of ${maxChildren}`,
        );
      } else {
        throw new Error(
          `Root has exceeded the maximum allowed number of children of ${maxChildren}`,
        );
      }
  }
}

/**
 * Handles general tag errors by applying the specified error handling strategy.
 *
 * This function processes tag-level errors and can either remove the element,
 * unwrap it (remove the tag but keep children), or throw an error.
 *
 * @param element - The HTML element that caused the error
 * @param errorHandlingMode - The error handling strategy to apply
 * @param errorMessage - Optional custom error message for logging/throwing
 * @returns `true` if processing should continue, `false` if the element was removed/unwrapped
 *
 * @example
 * ```typescript
 * import { handleTagError } from './handlers/direct';
 * import type { TagErrorHandlingMode } from '../types/error-handling';
 *
 * const element = document.createElement("script"); // Not allowed tag
 *
 * // Remove the element entirely
 * const result = handleTagError(
 *   element,
 *   "discardElement"
 * );
 * console.log(result); // false - element was removed
 * ```
 *
 * @example
 * ```typescript
 * // Unwrap the element (keep children, remove tag)
 * const result = handleTagError(
 *   element,
 *   "unwrapElement"
 * );
 * // Children are now direct children of the parent
 * ```
 *
 * @throws {Error} Throws an error if `errorHandlingMode` is "throwError"
 */
export function handleTagError(
  element: Htmlparser2TreeAdapterMap["element"],
  errorHandlingMode?: TagErrorHandlingMode,
  errorMessage?: string,
): boolean {
  switch (errorHandlingMode) {
    case "discardElement":
      adapter.detachNode(element);
      return false;
    case "unwrapElement":
      unwrapInParent(element);
      return false;
    case "throwError":
    default:
      throw new Error(errorMessage ?? `Tag ${element.tagName} is not allowed`);
  }
}

/**
 * Handles errors related to elements that exceed the maximum nesting depth.
 *
 * This function processes structural validation errors when an element exceeds
 * its maximum allowed nesting depth. It can either remove the element or throw an error.
 *
 * @param element - The element that exceeds nesting limits (can be document or element)
 * @param maxNesting - The maximum nesting depth allowed
 * @param errorHandlingMode - The error handling strategy to apply
 * @returns Always returns `false` since nesting errors prevent further processing
 *
 * @example
 * ```typescript
 * import { handleTagNestingError } from './handlers/direct';
 * import type { TagNestingErrorHandlingMode } from '../types/error-handling';
 *
 * const element = document.createElement("div");
 * // Element is nested too deeply (e.g., 10 levels deep with maxNesting = 5)
 *
 * // Remove the element
 * const result = handleTagNestingError(
 *   element,
 *   5,
 *   "discardElement"
 * );
 * console.log(result); // false - element was removed
 * ```
 *
 * @throws {Error} Throws an error if `errorHandlingMode` is "throwError"
 */
export function handleTagNestingError(
  element:
    | Htmlparser2TreeAdapterMap["document"]
    | Htmlparser2TreeAdapterMap["element"],
  maxNesting: number,
  errorHandlingMode?: TagNestingErrorHandlingMode,
): false {
  switch (errorHandlingMode) {
    case "discardElement":
      adapter.detachNode(element);
      return false;
    case "throwError":
    default:
      if ("tagName" in element) {
        throw new Error(
          `Tag ${element.tagName} has exceeded the maximum nesting level of ${maxNesting}`,
        );
      } else {
        throw new Error(
          `Root has exceeded the maximum nesting level of ${maxNesting}`,
        );
      }
  }
}
