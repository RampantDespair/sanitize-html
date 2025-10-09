import type { Htmlparser2TreeAdapterMap } from "parse5-htmlparser2-tree-adapter";
import type { ReadonlyDeep } from "type-fest";

import type {
  TagAttributeErrorHandlingMode,
  TagAttributeValueErrorHandlingMode,
  TagErrorHandlingMode,
} from "../types/error-handling";
import type {
  TagAttributeRecordValueRule,
  TagAttributeSetValueRule,
  TagAttributeSimpleValueRule,
  TagAttributeValueRule,
} from "../types/rules";
import type { ErrorHandling } from "../types/sanitizer";
import type {
  TagAttribute,
  TagAttributeKey,
  TagAttributeValueRecord,
  TagRule,
} from "../types/tag";

import {
  handleTagAttributeError,
  handleTagAttributeRecordValueError,
  handleTagAttributeSetValueError,
  handleTagAttributeValueError,
  handleTagAttributeValueTooLongError,
  handleTagError,
} from "./handlers/direct";
import {
  handleTagAttributeCollectionValueTooManyError,
  handleTagAttributeRecordValueDuplicateError,
} from "./handlers/indirect";
import { matchComparator, parseRecord, parseSet } from "./helpers";

/**
 * Enforces required attributes by adding default values or handling missing attributes.
 *
 * This function checks all attribute rules to ensure required attributes are present.
 * If a required attribute is missing, it applies the configured error handling strategy,
 * which may include applying default values or removing the element.
 *
 * @param element - The HTML element to check for required attributes
 * @param rules - The attribute rules defining which attributes are required
 * @param errorHandling - Error handling configuration for missing required attributes
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { enforceRequiredAttributes } from './sanitizers';
 * import type { ErrorHandling } from '../types/sanitizer';
 *
 * const element = document.createElement("a");
 * const rules = {
 *   "href": {
 *     mode: "simple",
 *     value: /^https?:\/\//,
 *     required: true,
 *     defaultValue: "https://example.com"
 *   },
 *   "target": {
 *     mode: "simple",
 *     value: ["_blank", "_self"],
 *     required: false
 *   }
 * };
 * const errorHandling: ErrorHandling = {
 *   attributeValue: "applyDefaultValue"
 * };
 *
 * // href is missing, so default value will be applied
 * const result = enforceRequiredAttributes(element, rules, errorHandling);
 * console.log(element.attribs.href); // "https://example.com"
 * console.log(result); // true
 * ```
 */
export function enforceRequiredAttributes(
  element: Htmlparser2TreeAdapterMap["element"],
  rules:
    | ReadonlyDeep<Record<TagAttributeKey, TagAttributeValueRule>>
    | undefined,
  errorHandling?: ErrorHandling | undefined,
): boolean {
  if (!rules) {
    return true;
  }

  for (const [attrName, rule] of Object.entries(rules)) {
    if (attrName === "*") {
      continue;
    }

    if (rule.required && !(attrName in element.attribs)) {
      if (
        !handleTagAttributeValueError(
          { key: attrName, value: "" },
          element,
          rule,
          errorHandling?.attributeValue,
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Sanitizes all attributes of an HTML element according to the provided rules.
 *
 * This function processes all attributes present on an element, validating them against
 * their specific rules or falling back to wildcard rules. It handles both attribute
 * validation and required attribute enforcement.
 *
 * @param element - The HTML element whose attributes should be sanitized
 * @param rules - The attribute rules defining validation and requirements
 * @param errorHandling - Error handling configuration for attribute validation
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { sanitizeAttributes } from './sanitizers';
 * import type { ErrorHandling } from '../types/sanitizer';
 *
 * const element = document.createElement("div");
 * element.setAttribute("class", "btn btn-primary");
 * element.setAttribute("id", "my-button");
 * element.setAttribute("onclick", "alert('xss')"); // Should be removed
 *
 * const rules = {
 *   "class": {
 *     mode: "set",
 *     delimiter: " ",
 *     values: ["btn", "btn-primary", "btn-secondary"],
 *     maxLength: 50
 *   },
 *   "id": {
 *     mode: "simple",
 *     value: /^[a-zA-Z][a-zA-Z0-9-_]*$/,
 *     required: true
 *   },
 *   "*": {
 *     mode: "simple",
 *     value: "*", // Allow any other attributes
 *     maxLength: 100
 *   }
 * };
 *
 * const errorHandling: ErrorHandling = {
 *   attribute: "discardAttribute",
 *   attributeValue: "applyDefaultValue"
 * };
 *
 * const result = sanitizeAttributes(element, rules, errorHandling);
 * console.log(element.attribs.class); // "btn btn-primary"
 * console.log(element.attribs.id); // "my-button"
 * console.log(element.attribs.onclick); // undefined (removed)
 * console.log(result); // true
 * ```
 */
export function sanitizeAttributes(
  element: Htmlparser2TreeAdapterMap["element"],
  rules:
    | ReadonlyDeep<Record<TagAttributeKey, TagAttributeValueRule>>
    | undefined,
  errorHandling?: ErrorHandling | undefined,
) {
  const attributes = element.attribs;
  const keys = Object.keys(attributes);

  // Fast path
  if (keys.length === 0) {
    // still need to enforce required with defaultValue injection if any
    return enforceRequiredAttributes(element, rules, errorHandling);
  }

  // Validate all present attributes against scoped rule or "*" fallback.
  for (const name of keys) {
    const value = attributes[name];
    const rule = rules?.[name] ?? rules?.["*"]; // fallback to global attribute rule if present

    const { globalProceed, localProceed } = sanitizeTagAttribute(
      { key: name, value },
      element,
      rule,
      errorHandling?.attribute,
    );

    if (!globalProceed) {
      return false;
    }

    if (!localProceed) {
      continue;
    }

    if (
      !sanitizeTagAttributeValue(
        { key: name, value },
        element,
        rule!,
        errorHandling,
      )
    ) {
      return false;
    }
  }

  return enforceRequiredAttributes(element, rules, errorHandling);
}

/**
 * Sanitizes an HTML tag by validating it against the provided rule.
 *
 * This function checks if a tag is allowed based on the provided rule.
 * If no rule is provided, the tag is considered disallowed and error handling is applied.
 *
 * @param element - The HTML element to sanitize
 * @param rule - The tag rule defining whether the tag is allowed
 * @param errorHandling - Error handling configuration for disallowed tags
 * @returns A type predicate indicating whether the rule is valid (tag is allowed)
 *
 * @example
 * ```typescript
 * import { sanitizeTag } from './sanitizers';
 * import type { TagErrorHandlingMode } from '../types/error-handling';
 *
 * const scriptElement = document.createElement("script");
 * const divElement = document.createElement("div");
 *
 * const divRule = {
 *   attributes: {
 *     "class": { mode: "simple", value: "*" }
 *   }
 * };
 *
 * // Script tag has no rule, so it's disallowed
 * const scriptResult = sanitizeTag(scriptElement, undefined, "discardElement");
 * console.log(scriptResult); // false - element was removed
 *
 * // Div tag has a rule, so it's allowed
 * const divResult = sanitizeTag(divElement, divRule, "discardElement");
 * console.log(divResult); // true - element is allowed
 * ```
 */
export function sanitizeTag(
  element: Htmlparser2TreeAdapterMap["element"],
  rule?: ReadonlyDeep<TagRule> | undefined,
  errorHandling?: TagErrorHandlingMode | undefined,
): rule is ReadonlyDeep<TagRule> {
  if (rule) {
    return true;
  }

  return handleTagError(element, errorHandling);
}

/**
 * Sanitizes a single tag attribute by checking if it has a valid rule.
 *
 * This function determines whether an attribute is allowed based on the presence
 * of a rule. It returns both global and local proceed flags for fine-grained control.
 *
 * @param attribute - The attribute to sanitize
 * @param element - The HTML element containing the attribute
 * @param rule - The attribute rule defining validation (undefined means disallowed)
 * @param errorHandling - Error handling configuration for disallowed attributes
 * @returns An object with global and local proceed flags
 *
 * @example
 * ```typescript
 * import { sanitizeTagAttribute } from './sanitizers';
 * import type { TagAttributeErrorHandlingMode } from '../types/error-handling';
 *
 * const element = document.createElement("div");
 * const attribute = { key: "onclick", value: "alert('xss')" };
 *
 * // No rule for onclick, so it's disallowed
 * const result = sanitizeTagAttribute(
 *   attribute,
 *   element,
 *   undefined,
 *   "discardAttribute"
 * );
 * console.log(result.globalProceed); // true - processing continues
 * console.log(result.localProceed); // false - attribute was removed
 *
 * // With a rule, attribute is allowed
 * const classRule = { mode: "simple", value: "*" };
 * const classResult = sanitizeTagAttribute(
 *   { key: "class", value: "btn" },
 *   element,
 *   classRule,
 *   "discardAttribute"
 * );
 * console.log(classResult.globalProceed); // true
 * console.log(classResult.localProceed); // true
 * ```
 */
export function sanitizeTagAttribute(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  rule?: ReadonlyDeep<TagAttributeValueRule> | undefined,
  errorHandling?: TagAttributeErrorHandlingMode | undefined,
): { globalProceed: boolean; localProceed: boolean } {
  if (rule) {
    return { globalProceed: true, localProceed: true };
  }

  return {
    globalProceed: handleTagAttributeError(attribute, element, errorHandling),
    localProceed: false,
  };
}

/**
 * Sanitizes a tag attribute with record-format values (key-value pairs).
 *
 * This function processes attributes that contain structured data in record format,
 * such as data attributes with multiple key-value pairs. It handles parsing,
 * validation, duplicate detection, and collection size limits.
 *
 * @param attribute - The attribute containing record-format data
 * @param element - The HTML element containing the attribute
 * @param rule - The record validation rule defining separators and value constraints
 * @param errorHandling - Error handling configuration for various validation failures
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { sanitizeTagAttributeRecordValue } from './sanitizers';
 * import type { ErrorHandling } from '../types/sanitizer';
 *
 * const element = document.createElement("div");
 * const attribute = {
 *   key: "data-config",
 *   value: "id:123;name:test;class:btn;script:alert(1)"
 * };
 *
 * const rule = {
 *   mode: "record",
 *   entrySeparator: ";",
 *   keyValueSeparator: ":",
 *   maxEntries: 5,
 *   values: {
 *     "id": /^[0-9]+$/,
 *     "name": /^[a-zA-Z]+$/,
 *     "class": ["btn", "btn-primary"],
 *     "script": false // Not allowed
 *   }
 * };
 *
 * const errorHandling: ErrorHandling = {
 *   attributeRecordValue: "dropPair",
 *   attributeRecordValueDuplicate: "keepFirst",
 *   attributeCollectionValueTooMany: "dropExtra"
 * };
 *
 * const result = sanitizeTagAttributeRecordValue(attribute, element, rule, errorHandling);
 * console.log(element.attribs["data-config"]); // "id:123;name:test;class:btn"
 * console.log(result); // true
 * ```
 */
export function sanitizeTagAttributeRecordValue(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  rule: ReadonlyDeep<TagAttributeRecordValueRule>,
  errorHandling?: ErrorHandling | undefined,
): boolean {
  let input = parseRecord(
    attribute.value,
    rule.entrySeparator,
    rule.keyValueSeparator,
  );

  if (rule.maxEntries && input.length > rule.maxEntries) {
    const result = handleTagAttributeCollectionValueTooManyError(
      attribute,
      element,
      input,
      rule,
      errorHandling?.attributeCollectionValueTooMany,
    );

    if (!result.proceed) {
      return false;
    }

    input = result.output;
  }

  const seen = new Set<string>();
  let output: TagAttributeValueRecord = [];

  for (const [index, { key, val }] of input.entries()) {
    const pairRule = rule.values[key];

    if (seen.has(key)) {
      const result = handleTagAttributeRecordValueDuplicateError(
        attribute,
        element,
        key,
        output,
        rule,
        errorHandling?.attributeRecordValueDuplicate,
      );

      if (!result.globalProceed) {
        return false;
      }

      output = result.output;

      if (!result.localProceed) {
        continue;
      }
    }

    if (!pairRule || !matchComparator(pairRule, val)) {
      if (
        !handleTagAttributeRecordValueError(
          attribute,
          element,
          input,
          index,
          rule,
          errorHandling?.attributeRecordValue,
        )
      ) {
        return false;
      }
      continue;
    }

    output.push({ key, val });
    seen.add(key);
  }

  element.attribs[attribute.key] = output
    .map(({ key, val }) => `${key}${rule.keyValueSeparator}${val}`)
    .join(rule.entrySeparator);

  return true;
}

/**
 * Sanitizes a tag attribute with set-format values (delimiter-separated list).
 *
 * This function processes attributes that contain multiple values separated by delimiters,
 * such as CSS classes in the `class` attribute. It handles parsing, validation,
 * and collection size limits.
 *
 * @param attribute - The attribute containing set-format data
 * @param element - The HTML element containing the attribute
 * @param rule - The set validation rule defining delimiter and value constraints
 * @param errorHandling - Error handling configuration for various validation failures
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { sanitizeTagAttributeSetValue } from './sanitizers';
 * import type { ErrorHandling } from '../types/sanitizer';
 *
 * const element = document.createElement("div");
 * const attribute = {
 *   key: "class",
 *   value: "btn btn-primary btn-danger btn-large btn-disabled"
 * };
 *
 * const rule = {
 *   mode: "set",
 *   delimiter: " ",
 *   maxEntries: 3,
 *   values: ["btn", "btn-primary", "btn-secondary", "btn-large"]
 * };
 *
 * const errorHandling: ErrorHandling = {
 *   attributeSetValue: "dropValue",
 *   attributeCollectionValueTooMany: "dropExtra"
 * };
 *
 * const result = sanitizeTagAttributeSetValue(attribute, element, rule, errorHandling);
 * console.log(element.attribs.class); // "btn btn-primary btn-large"
 * console.log(result); // true
 * ```
 */
export function sanitizeTagAttributeSetValue(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  rule: ReadonlyDeep<TagAttributeSetValueRule>,
  errorHandling?: ErrorHandling | undefined,
): boolean {
  let input = parseSet(attribute.value, rule.delimiter);

  if (rule.maxEntries && input.length > rule.maxEntries) {
    const result = handleTagAttributeCollectionValueTooManyError(
      attribute,
      element,
      input,
      rule,
      errorHandling?.attributeCollectionValueTooMany,
    );

    if (!result.proceed) {
      return false;
    }

    input = result.output;
  }

  const output: string[] = [];

  for (const [index, val] of input.entries()) {
    if (!matchComparator(rule.values, val)) {
      if (
        !handleTagAttributeSetValueError(
          attribute,
          element,
          index,
          input,
          rule,
          errorHandling?.attributeSetValue,
        )
      ) {
        return false;
      }
    } else {
      output.push(val);
    }
  }

  element.attribs[attribute.key] = output.join(rule.delimiter);

  return true;
}

/**
 * Sanitizes a tag attribute with simple single values.
 *
 * This function processes attributes that contain a single value without any
 * complex structure. It validates the value against the provided rule using
 * the comparator matching system.
 *
 * @param attribute - The attribute containing simple value data
 * @param element - The HTML element containing the attribute
 * @param rule - The simple validation rule defining value constraints
 * @param errorHandling - Error handling configuration for validation failures
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { sanitizeTagAttributeSimpleValue } from './sanitizers';
 * import type { TagAttributeValueErrorHandlingMode } from '../types/error-handling';
 *
 * const element = document.createElement("a");
 * const attribute = { key: "href", value: "javascript:alert('xss')" };
 *
 * const rule = {
 *   mode: "simple",
 *   value: /^https?:\/\//,
 *   defaultValue: "https://example.com"
 * };
 *
 * const result = sanitizeTagAttributeSimpleValue(
 *   attribute,
 *   element,
 *   rule,
 *   "applyDefaultValue"
 * );
 * console.log(element.attribs.href); // "https://example.com"
 * console.log(result); // true
 * ```
 *
 * @example
 * ```typescript
 * // Exact string match
 * const idRule = {
 *   mode: "simple",
 *   value: "my-button"
 * };
 *
 * const idResult = sanitizeTagAttributeSimpleValue(
 *   { key: "id", value: "my-button" },
 *   element,
 *   idRule,
 *   "discardAttribute"
 * );
 * console.log(idResult); // true - value matches exactly
 * ```
 */
export function sanitizeTagAttributeSimpleValue(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  rule: ReadonlyDeep<TagAttributeSimpleValueRule>,
  errorHandling?: TagAttributeValueErrorHandlingMode | undefined,
): boolean {
  if (!matchComparator(rule.value, attribute.value)) {
    return handleTagAttributeValueError(
      attribute,
      element,
      rule,
      errorHandling,
    );
  }

  return true;
}

/**
 * Sanitizes a tag attribute value based on its mode (record, set, or simple).
 *
 * This is the main dispatcher function that routes attribute value sanitization
 * to the appropriate specialized function based on the rule's mode. It also
 * handles length validation before processing the value.
 *
 * @param attribute - The attribute to sanitize
 * @param element - The HTML element containing the attribute
 * @param rule - The attribute value rule defining validation mode and constraints
 * @param errorHandling - Error handling configuration for various validation failures
 * @returns `true` if processing should continue, `false` if the element was removed
 *
 * @example
 * ```typescript
 * import { sanitizeTagAttributeValue } from './sanitizers';
 * import type { ErrorHandling } from '../types/sanitizer';
 *
 * const element = document.createElement("div");
 *
 * // Set mode example
 * const classAttribute = { key: "class", value: "btn btn-primary btn-danger" };
 * const classRule = {
 *   mode: "set",
 *   delimiter: " ",
 *   values: ["btn", "btn-primary", "btn-secondary"],
 *   maxLength: 50
 * };
 *
 * // Record mode example
 * const dataAttribute = { key: "data-config", value: "id:123;name:test" };
 * const dataRule = {
 *   mode: "record",
 *   entrySeparator: ";",
 *   keyValueSeparator: ":",
 *   values: { "id": /^[0-9]+$/, "name": /^[a-zA-Z]+$/ }
 * };
 *
 * // Simple mode example
 * const hrefAttribute = { key: "href", value: "https://example.com" };
 * const hrefRule = {
 *   mode: "simple",
 *   value: /^https?:\/\//,
 *   maxLength: 2000
 * };
 *
 * const errorHandling: ErrorHandling = {
 *   attributeValue: "applyDefaultValue",
 *   attributeValueTooLong: "trimExcess",
 *   attributeSetValue: "dropValue",
 *   attributeRecordValue: "dropPair"
 * };
 *
 * const classResult = sanitizeTagAttributeValue(classAttribute, element, classRule, errorHandling);
 * const dataResult = sanitizeTagAttributeValue(dataAttribute, element, dataRule, errorHandling);
 * const hrefResult = sanitizeTagAttributeValue(hrefAttribute, element, hrefRule, errorHandling);
 *
 * console.log(element.attribs.class); // "btn btn-primary" (btn-danger removed)
 * console.log(element.attribs["data-config"]); // "id:123;name:test"
 * console.log(element.attribs.href); // "https://example.com"
 * ```
 */
export function sanitizeTagAttributeValue(
  attribute: TagAttribute,
  element: Htmlparser2TreeAdapterMap["element"],
  rule: ReadonlyDeep<TagAttributeValueRule>,
  errorHandling?: ErrorHandling | undefined,
) {
  if (rule.maxLength && attribute.value.length > rule.maxLength) {
    if (
      !handleTagAttributeValueTooLongError(
        attribute,
        element,
        rule,
        errorHandling?.attributeValueTooLong,
      )
    ) {
      return false;
    }

    attribute.value = element.attribs[attribute.key];

    if (!attribute.value) {
      return true;
    }
  }

  switch (rule.mode) {
    case "record":
      return sanitizeTagAttributeRecordValue(
        attribute,
        element,
        rule,
        errorHandling,
      );
    case "set":
      return sanitizeTagAttributeSetValue(
        attribute,
        element,
        rule,
        errorHandling,
      );
    case "simple":
      return sanitizeTagAttributeSimpleValue(
        attribute,
        element,
        rule,
        errorHandling?.attributeValue,
      );
  }
}
