import type { Htmlparser2TreeAdapterMap } from "parse5-htmlparser2-tree-adapter";

import { parseFragment, serialize } from "parse5";
import { adapter } from "parse5-htmlparser2-tree-adapter";

import type { SanitizerOptions } from "./types/sanitizer";

import { handleTagChildrenError } from "./lib/handlers/direct";
import { walkNode } from "./lib/walker";

/**
 * Sanitizes HTML content by removing or modifying potentially dangerous elements and attributes.
 *
 * This function parses the input HTML, applies sanitization rules based on the provided options,
 * and returns a cleaned version of the HTML. It handles tag validation, attribute filtering,
 * nesting limits, and error handling according to the configuration.
 *
 * @param html - The HTML string to sanitize
 * @param options - Configuration options that define sanitization rules and behavior
 * @returns The sanitized HTML string
 *
 * @example
 * ```typescript
 * import { sanitizeHtml } from './index';
 * import type { SanitizerOptions } from './types/sanitizer';
 *
 * const options: SanitizerOptions = {
 *   preserveComments: false,
 *   errorHandling: {
 *     tag: "discardElement",
 *     attribute: "discardAttribute"
 *   },
 *   tags: {
 *     "div": {
 *       attributes: {
 *         "class": {
 *           mode: "set",
 *           delimiter: " ",
 *           values: ["container", "row", "col"],
 *           maxLength: 100
 *         },
 *         "id": {
 *           mode: "simple",
 *           value: /^[a-zA-Z][a-zA-Z0-9-_]*$/,
 *           required: false
 *         }
 *       },
 *       limits: {
 *         children: 20,
 *         nesting: 5
 *       }
 *     },
 *     "a": {
 *       attributes: {
 *         "href": {
 *           mode: "simple",
 *           value: /^https?:\/\//,
 *           required: true
 *         }
 *       }
 *     }
 *   },
 *   topLevelLimits: {
 *     children: 100,
 *     nesting: 10
 *   }
 * };
 *
 * const dirtyHtml = '<div class="container"><a href="javascript:alert(1)">Click me</a></div>';
 * const cleanHtml = sanitizeHtml(dirtyHtml, options);
 * console.log(cleanHtml); // '<div class="container"></div>'
 * ```
 *
 * @example
 * ```typescript
 * // Basic usage with minimal configuration
 * const basicOptions: SanitizerOptions = {
 *   tags: {
 *     "p": {
 *       attributes: {
 *         "class": {
 *           mode: "simple",
 *           value: "*" // Allow any class value
 *         }
 *       }
 *     }
 *   }
 * };
 *
 * const html = '<p class="text-center">Hello World</p><script>alert("xss")</script>';
 * const sanitized = sanitizeHtml(html, basicOptions);
 * console.log(sanitized); // '<p class="text-center">Hello World</p>'
 * ```
 *
 * @throws {Error} May throw errors if error handling is configured to "throwError" mode
 * and validation failures occur during processing.
 */
export function sanitizeHtml(html: string, options: SanitizerOptions): string {
  if (html === "") {
    return "";
  }

  const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
    html,
    { treeAdapter: adapter },
  );

  if (
    options.topLevelLimits?.children &&
    frag.children.length > options.topLevelLimits.children
  ) {
    if (
      !handleTagChildrenError(
        frag,
        options.topLevelLimits.children,
        options.errorHandling?.tagChildren,
      )
    ) {
      return "";
    }
  }

  let child = frag.firstChild;
  while (child) {
    const next = child.nextSibling;
    walkNode(child, options, { rootNesting: 0, tagNesting: [] });
    child = next;
  }

  return serialize(frag, { treeAdapter: adapter });
}
