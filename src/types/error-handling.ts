/**
 * Error handling mode for when a tag attribute collection has too many values.
 *
 * - `dropExtra`: Remove excess values, keeping only the allowed number
 * - Falls back to {@link TagAttributeValueErrorHandlingMode} for other errors
 */
export type TagAttributeCollectionValueTooManyErrorHandlingMode =
  | "dropExtra"
  | TagAttributeValueErrorHandlingMode;

/**
 * Error handling mode for tag attribute errors.
 *
 * - `discardAttribute`: Remove the entire attribute from the tag
 * - Falls back to {@link TagErrorHandlingMode} for other errors
 */
export type TagAttributeErrorHandlingMode =
  | "discardAttribute"
  | TagErrorHandlingMode;

/**
 * Error handling mode for duplicate values in tag attribute records.
 *
 * - `dropDuplicates`: Remove all duplicate values
 * - `keepDuplicates`: Allow duplicate values to remain
 * - `keepFirst`: Keep only the first occurrence of each value
 * - `keepLast`: Keep only the last occurrence of each value
 * - Falls back to {@link TagAttributeValueErrorHandlingMode} for other errors
 */
export type TagAttributeRecordValueDuplicateErrorHandlingMode =
  | "dropDuplicates"
  | "keepDuplicates"
  | "keepFirst"
  | "keepLast"
  | TagAttributeValueErrorHandlingMode;

/**
 * Error handling mode for tag attribute record value errors.
 *
 * - `dropPair`: Remove the entire key-value pair from the attribute record
 * - Falls back to {@link TagAttributeValueErrorHandlingMode} for other errors
 */
export type TagAttributeRecordValueErrorHandlingMode =
  | "dropPair"
  | TagAttributeValueErrorHandlingMode;

/**
 * Error handling mode for tag attribute set value errors.
 *
 * - `dropValue`: Remove the problematic value from the attribute set
 * - Falls back to {@link TagAttributeValueErrorHandlingMode} for other errors
 */
export type TagAttributeSetValueErrorHandlingMode =
  | "dropValue"
  | TagAttributeValueErrorHandlingMode;

/**
 * Error handling mode for tag attribute value errors.
 *
 * - `applyDefaultValue`: Use a predefined default value for the attribute
 * - Falls back to {@link TagAttributeErrorHandlingMode} for other errors
 */
export type TagAttributeValueErrorHandlingMode =
  | "applyDefaultValue"
  | TagAttributeErrorHandlingMode;

/**
 * Error handling mode for when a tag attribute value is too long.
 *
 * - `trimExcess`: Truncate the value to fit within the allowed length
 * - Falls back to {@link TagAttributeValueErrorHandlingMode} for other errors
 */
export type TagAttributeValueTooLongErrorHandlingMode =
  | "trimExcess"
  | TagAttributeValueErrorHandlingMode;

/**
 * Error handling mode for tag children errors.
 *
 * - `discardElement`: Remove the entire element and its children
 * - `discardFirsts`: Remove the first few child elements that are causing issues
 * - `discardLasts`: Remove the last few child elements that are causing issues
 * - `throwError`: Throw an error and stop processing
 */
export type TagChildrenErrorHandlingMode =
  | "discardElement"
  | "discardFirsts"
  | "discardLasts"
  | "throwError";

/**
 * General error handling mode for tag-related errors.
 *
 * - `discardElement`: Remove the entire element from the output
 * - `throwError`: Throw an error and stop processing
 * - `unwrapElement`: Remove the tag but keep its children
 */
export type TagErrorHandlingMode =
  | "discardElement"
  | "throwError"
  | "unwrapElement";

/**
 * Error handling mode for tag nesting errors.
 *
 * - `discardElement`: Remove the element that violates nesting rules
 * - `throwError`: Throw an error and stop processing
 */
export type TagNestingErrorHandlingMode = "discardElement" | "throwError";
