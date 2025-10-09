import type { TagAttributeValueRule } from "./rules";

/**
 * All valid HTML tag names as defined by the HTML specification.
 *
 * Includes both current and deprecated HTML elements, with comments indicating
 * their status. Based on the Mozilla Developer Network HTML element reference.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements}
 *
 * @example
 * ```typescript
 * const validTag: HtmlTag = "div";
 * const deprecatedTag: HtmlTag = "font"; // Deprecated but still valid
 * const experimentalTag: HtmlTag = "fencedframe"; // Experimental
 * ```
 */
// https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements
export type HtmlTag =
  | "a"
  | "abbr"
  | "acronym" // Deprecated
  | "address"
  | "area"
  | "article"
  | "aside"
  | "audio"
  | "b"
  | "base"
  | "bdi"
  | "bdo"
  | "big" // Deprecated
  | "blockquote"
  | "body"
  | "br"
  | "button"
  | "canvas"
  | "caption"
  | "center" // Deprecated
  | "cite"
  | "code"
  | "col"
  | "colgroup"
  | "data"
  | "datalist"
  | "dd"
  | "del"
  | "details"
  | "dfn"
  | "dialog"
  | "dir" // Deprecated
  | "div"
  | "dl"
  | "dt"
  | "em"
  | "embed"
  | "fencedframe" // Experimental
  | "fieldset"
  | "figcaption"
  | "figure"
  | "font" // Deprecated
  | "footer"
  | "form"
  | "frame" // Deprecated
  | "frameset" // Deprecated
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "head"
  | "header"
  | "hgroup"
  | "hr"
  | "html"
  | "i"
  | "iframe"
  | "img"
  | "input"
  | "ins"
  | "kbd"
  | "label"
  | "legend"
  | "li"
  | "link"
  | "main"
  | "mark"
  | "marquee" // Deprecated
  | "menu"
  | "meta"
  | "meter"
  | "nav"
  | "nobr" // Deprecated
  | "noembed" // Deprecated
  | "noframes" // Deprecated
  | "noscript"
  | "object"
  | "ol"
  | "optgroup"
  | "option"
  | "output"
  | "p"
  | "param" // Deprecated
  | "picture"
  | "plaintext" // Deprecated
  | "pre"
  | "progress"
  | "q"
  | "rb" // Deprecated
  | "rp"
  | "rt"
  | "rtc" // Deprecated
  | "ruby"
  | "s"
  | "samp"
  | "script"
  | "search"
  | "section"
  | "select"
  | "selectedcontent" // Experimental
  | "slot"
  | "small"
  | "source"
  | "span"
  | "strike" // Deprecated
  | "strong"
  | "style"
  | "sub"
  | "summary"
  | "sup"
  | "table"
  | "tbody"
  | "td"
  | "template"
  | "textarea"
  | "tfoot"
  | "th"
  | "thead"
  | "time"
  | "title"
  | "tr"
  | "track"
  | "tt" // Deprecated
  | "u"
  | "ul"
  | "var"
  | "video"
  | "wbr"
  | "xmp"; // Deprecated

/**
 * Represents a single HTML attribute with its key-value pair.
 *
 * Used internally to represent parsed attribute data during HTML processing.
 *
 * @example
 * ```typescript
 * const attribute: TagAttribute = {
 *   key: "class",
 *   value: "btn btn-primary"
 * };
 * ```
 */
export type TagAttribute = {
  /** The attribute name (e.g., "class", "id", "href") */
  key: string;
  /** The attribute value (e.g., "btn btn-primary", "my-id", "https://example.com") */
  value: string;
};

/**
 * A tag attribute key that can be either a specific attribute name or a wildcard.
 *
 * The wildcard "*" allows matching any attribute name, useful for defining
 * rules that apply to all attributes or for catch-all patterns.
 *
 * @example
 * ```typescript
 * const specificKey: TagAttributeKey = "class";
 * const wildcardKey: TagAttributeKey = "*"; // Matches any attribute
 * ```
 */
export type TagAttributeKey = "*" | string;

/**
 * A collection of attribute values that can be either a record or set format.
 *
 * Used to represent structured attribute data that contains multiple values
 * in different organizational formats.
 *
 * @example
 * ```typescript
 * // Record format (key-value pairs)
 * const recordCollection: TagAttributeValueCollection = [
 *   { key: "align", val: "center" },
 *   { key: "color", val: "red" }
 * ];
 *
 * // Set format (array of values)
 * const setCollection: TagAttributeValueCollection = ["btn", "btn-primary", "btn-large"];
 * ```
 */
export type TagAttributeValueCollection =
  | TagAttributeValueRecord
  | TagAttributeValueSet;

/**
 * A single key-value entry within an attribute value record.
 *
 * Represents one pair in a structured attribute value collection.
 *
 * @example
 * ```typescript
 * const entry: TagAttributeValueEntry = {
 *   key: "align",
 *   val: "center"
 * };
 * ```
 */
export type TagAttributeValueEntry = { key: string; val: string };

/**
 * An attribute value in record format (array of key-value pairs).
 *
 * Used for attributes that contain structured data with named fields,
 * such as data attributes or custom structured attributes.
 *
 * @example
 * ```typescript
 * const record: TagAttributeValueRecord = [
 *   { key: "align", val: "center" },
 *   { key: "color", val: "red" },
 *   { key: "size", val: "large" }
 * ];
 * ```
 */
export type TagAttributeValueRecord = TagAttributeValueEntry[];

/**
 * An attribute value in set format (array of values).
 *
 * Used for attributes that contain multiple values without named fields,
 * such as the `class` attribute with space-separated CSS classes.
 *
 * @example
 * ```typescript
 * const set: TagAttributeValueSet = ["btn", "btn-primary", "btn-large", "btn-disabled"];
 * ```
 */
export type TagAttributeValueSet = string[];

/**
 * A tag key that can be either a standard HTML tag or a custom string.
 *
 * Extends {@link HtmlTag} to allow custom tag names for specialized use cases
 * or non-standard HTML elements.
 *
 * @example
 * ```typescript
 * const htmlTag: TagKey = "div";
 * const customTag: TagKey = "my-custom-element";
 * ```
 */
export type TagKey = HtmlTag | string;

/**
 * Limits that can be applied to HTML tags during sanitization.
 *
 * Provides constraints on tag structure and nesting to prevent
 * excessive nesting or too many children.
 *
 * @example
 * ```typescript
 * const limits: TagLimits = {
 *   children: 10,    // Maximum 10 child elements
 *   nesting: 5       // Maximum nesting depth of 5 levels
 * };
 * ```
 */
export type TagLimits = {
  /** Maximum number of child elements allowed (optional) */
  children?: number;
  /** Maximum nesting depth allowed for this tag (optional) */
  nesting?: number;
};

/**
 * Rules defining how a specific HTML tag should be processed during sanitization.
 *
 * Combines attribute validation rules with structural limits to control
 * how tags and their attributes are handled.
 *
 * @example
 * ```typescript
 * const rule: TagRule = {
 *   attributes: {
 *     "class": {
 *       mode: "set",
 *       delimiter: " ",
 *       values: ["btn", "btn-primary", "btn-large"],
 *       maxLength: 100
 *     },
 *     "id": {
 *       mode: "simple",
 *       value: /^[a-zA-Z][a-zA-Z0-9-_]*$/,
 *       required: true
 *     },
 *     "*": {
 *       mode: "simple",
 *       value: "*", // Allow any other attributes
 *       maxLength: 50
 *     }
 *   },
 *   limits: {
 *     children: 20,
 *     nesting: 3
 *   }
 * };
 * ```
 */
export type TagRule = {
  /** Rules for validating tag attributes (optional) */
  attributes?: Record<TagAttributeKey, TagAttributeValueRule>;
  /** Structural limits for the tag (optional) */
  limits?: TagLimits;
};
