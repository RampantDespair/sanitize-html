import type { Token } from "parse5";
import type { Htmlparser2TreeAdapterMap } from "parse5-htmlparser2-tree-adapter";

import { html } from "parse5";
import { adapter } from "parse5-htmlparser2-tree-adapter";
import { beforeEach, describe, expect, it } from "vitest";

import {
  enforceRequiredAttributes,
  sanitizeAttributes,
  sanitizeTag,
  sanitizeTagAttribute,
  sanitizeTagAttributeRecordValue,
  sanitizeTagAttributeSetValue,
  sanitizeTagAttributeSimpleValue,
  sanitizeTagAttributeValue,
} from "../src/lib/sanitizers";

describe("enforceRequiredAttributes", () => {
  let base: Htmlparser2TreeAdapterMap["element"];
  let el: Htmlparser2TreeAdapterMap["element"];

  beforeEach(() => {
    base = adapter.createElement("root", html.NS.HTML, []);
    el = adapter.createElement("test", html.NS.HTML, []);
    adapter.appendChild(base, el);
  });

  it("handles required attribute error handling failure", () => {
    const rules = {
      required: {
        mode: "simple" as const,
        required: true,
        value: "invalid",
      },
    };

    const result = enforceRequiredAttributes(el, rules, {
      attributeValue: "discardElement",
    });

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("skips wildcard attribute '*' in rules", () => {
    const rules = {
      "*": {
        mode: "simple" as const,
        required: true,
        value: "wildcard",
      },
      required: {
        mode: "simple" as const,
        required: true,
        value: "test",
      },
    };

    // Add the required attribute to pass validation
    el.attribs.required = "test";

    const result = enforceRequiredAttributes(el, rules);

    expect(result).toBe(true);
    expect(el.attribs.required).toBe("test");
  });

  it("returns true when rules is undefined", () => {
    const result = enforceRequiredAttributes(el, undefined);

    expect(result).toBe(true);
  });
});

describe("sanitizeAttributes", () => {
  let base: Htmlparser2TreeAdapterMap["element"];
  let el: Htmlparser2TreeAdapterMap["element"];

  beforeEach(() => {
    base = adapter.createElement("root", html.NS.HTML, []);
    el = adapter.createElement("test", html.NS.HTML, []);
    adapter.appendChild(base, el);
  });

  it("handles fast path when no attributes present", () => {
    const rules = {
      required: {
        mode: "simple" as const,
        required: true,
        value: "test",
      },
    };

    // Add required attribute to pass validation
    el.attribs.required = "test";

    const result = sanitizeAttributes(el, rules);

    expect(result).toBe(true);
    expect(el.attribs.required).toBe("test");
  });

  it("handles fast path with no attributes and no rules", () => {
    const result = sanitizeAttributes(el, undefined);

    expect(result).toBe(true);
  });

  it("validates attributes against specific rules", () => {
    el.attribs.id = "test-id";
    el.attribs.class = "test-class";

    const rules = {
      class: {
        mode: "simple" as const,
        value: "test-class",
      },
      id: {
        mode: "simple" as const,
        value: "test-id",
      },
    };

    const result = sanitizeAttributes(el, rules);

    expect(result).toBe(true);
    expect(el.attribs.id).toBe("test-id");
    expect(el.attribs.class).toBe("test-class");
  });

  it("uses wildcard rule as fallback", () => {
    el.attribs.custom = "valid-value";

    const rules = {
      "*": {
        mode: "simple" as const,
        value: "valid-value",
      },
    };

    const result = sanitizeAttributes(el, rules);

    expect(result).toBe(true);
    expect(el.attribs.custom).toBe("valid-value");
  });

  it("returns false when globalProceed is false", () => {
    el.attribs.invalid = "invalid-value";

    const rules = {
      invalid: {
        mode: "simple" as const,
        value: "valid-value",
      },
    };

    const result = sanitizeAttributes(el, rules, {
      attributeValue: "discardElement",
    });

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("continues when localProceed is false", () => {
    el.attribs.invalid = "invalid-value";
    el.attribs.valid = "valid-value";

    const rules = {
      invalid: {
        mode: "simple" as const,
        value: "valid-value",
      },
      valid: {
        mode: "simple" as const,
        value: "valid-value",
      },
    };

    const result = sanitizeAttributes(el, rules, {
      attributeValue: "discardAttribute",
    });

    expect(result).toBe(true);
    expect(el.attribs.invalid).toBeUndefined();
    expect(el.attribs.valid).toBe("valid-value");
  });

  it("returns false when attribute value sanitization fails", () => {
    el.attribs.record = "key1=value1,key2=invalid";

    const rules = {
      record: {
        entrySeparator: ",",
        keyValueSeparator: "=",
        mode: "record" as const,
        values: {
          key1: "value1",
          key2: "valid",
        },
      },
    };

    const result = sanitizeAttributes(el, rules, {
      attributeRecordValue: "discardElement",
    });

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("enforces required attributes after processing", () => {
    el.attribs.present = "value";

    const rules = {
      present: {
        mode: "simple" as const,
        value: "value",
      },
      required: {
        mode: "simple" as const,
        required: true,
        value: "required-value",
      },
    };

    // Add required attribute to pass validation
    el.attribs.required = "required-value";

    const result = sanitizeAttributes(el, rules);

    expect(result).toBe(true);
    expect(el.attribs.present).toBe("value");
    expect(el.attribs.required).toBe("required-value");
  });

  it("returns false when required attributes are missing", () => {
    el.attribs.present = "value";

    const rules = {
      present: {
        mode: "simple" as const,
        value: "value",
      },
      required: {
        mode: "simple" as const,
        required: true,
        value: "required-value",
      },
    };

    const result = sanitizeAttributes(el, rules, {
      attributeValue: "discardElement",
    });

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("handles complex attribute validation with multiple modes", () => {
    el.attribs.simple = "valid";
    el.attribs.record = "key1=value1,key2=value2";
    el.attribs.set = "a,b,c";

    const rules = {
      record: {
        entrySeparator: ",",
        keyValueSeparator: "=",
        mode: "record" as const,
        values: {
          key1: "value1",
          key2: "value2",
        },
      },
      set: {
        delimiter: ",",
        mode: "set" as const,
        values: ["a", "b", "c"],
      },
      simple: {
        mode: "simple" as const,
        value: "valid",
      },
    };

    const result = sanitizeAttributes(el, rules);

    expect(result).toBe(true);
    expect(el.attribs.simple).toBe("valid");
    expect(el.attribs.record).toBe("key1=value1,key2=value2");
    expect(el.attribs.set).toBe("a,b,c");
  });

  it("returns false when attribute has no matching rule and globalProceed is false", () => {
    el.attribs.allowed = "value";
    el.attribs.forbidden = "value";

    const rules = {
      allowed: {
        mode: "simple" as const,
        value: "value",
      },
    };

    const result = sanitizeAttributes(el, rules, {
      attribute: "discardElement",
    });

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("continues when attribute has no matching rule and localProceed is false", () => {
    el.attribs.allowed = "value";
    el.attribs.forbidden = "value";

    const rules = {
      allowed: {
        mode: "simple" as const,
        value: "value",
      },
    };

    const result = sanitizeAttributes(el, rules, {
      attribute: "discardAttribute",
    });

    expect(result).toBe(true);
    expect(el.attribs.allowed).toBe("value");
    expect(el.attribs.forbidden).toBeUndefined();
  });
});

describe("sanitizeTag", () => {
  let base: Htmlparser2TreeAdapterMap["element"];

  beforeEach(() => {
    base = adapter.createElement("root", html.NS.HTML, []);
  });

  it("allows permitted element", () => {
    const el = adapter.createElement("this", html.NS.HTML, []);
    adapter.appendChild(base, el);

    const ok = sanitizeTag(el, {});

    expect(ok).toBe(true);
  });

  it("throws when tag is denied (errorHandling: default)", () => {
    const el = adapter.createElement("this", html.NS.HTML, []);
    adapter.appendChild(base, el);

    expect(() => sanitizeTag(el)).toThrow();
  });

  it("throws when tag is denied (errorHandling: throwError)", () => {
    const el = adapter.createElement("this", html.NS.HTML, []);
    adapter.appendChild(base, el);

    expect(() => sanitizeTag(el, undefined, "throwError")).toThrow();
  });

  it("discards tag when tag is denied (errorHandling: discardElement)", () => {
    const el = adapter.createElement("this", html.NS.HTML, []);
    adapter.appendChild(base, el);

    const ok = sanitizeTag(el, undefined, "discardElement");

    expect(ok).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("unwraps element when tag is denied (errorHandling: unwrapElement)", () => {
    const parent = adapter.createElement("parent", html.NS.HTML, []);
    adapter.appendChild(base, parent);

    const child = adapter.createElement("child", html.NS.HTML, []);
    adapter.appendChild(parent, child);

    const ok = sanitizeTag(parent, undefined, "unwrapElement");

    expect(ok).toBe(false);
    expect(base.children).toHaveLength(1);
    expect(base.children[0]).toBe(child);
  });
});

describe("sanitizeTagAttribute", () => {
  let base: Htmlparser2TreeAdapterMap["element"];
  let templateAttribute: Token.Attribute;

  beforeEach(() => {
    base = adapter.createElement("root", html.NS.HTML, []);
    templateAttribute = {
      name: "template",
      value: "x",
    };
  });

  it("allows permitted attribute", () => {
    const el = adapter.createElement("this", html.NS.HTML, [templateAttribute]);
    adapter.appendChild(base, el);

    const { globalProceed, localProceed } = sanitizeTagAttribute(
      { key: templateAttribute.name, value: templateAttribute.value },
      el,
      { mode: "simple", value: "*" },
    );

    expect(globalProceed).toBe(true);
    expect(localProceed).toBe(true);
  });

  it("throws when attribute has no matching rule (errorHandling: default)", () => {
    const el = adapter.createElement("this", html.NS.HTML, [templateAttribute]);
    adapter.appendChild(base, el);

    expect(() =>
      sanitizeTagAttribute(
        { key: templateAttribute.name, value: templateAttribute.value },
        el,
      ),
    ).toThrow();
  });

  it("throws when attribute has no matching rule (errorHandling: throwError)", () => {
    const el = adapter.createElement("this", html.NS.HTML, [templateAttribute]);
    adapter.appendChild(base, el);

    expect(() =>
      sanitizeTagAttribute(
        { key: templateAttribute.name, value: templateAttribute.value },
        el,
        undefined,
        "throwError",
      ),
    ).toThrow();
  });

  it("discards attribute when attribute has no matching rule (errorHandling: discardAttribute)", () => {
    const el = adapter.createElement("this", html.NS.HTML, [templateAttribute]);
    adapter.appendChild(base, el);

    const { globalProceed, localProceed } = sanitizeTagAttribute(
      { key: templateAttribute.name, value: templateAttribute.value },
      el,
      undefined,
      "discardAttribute",
    );

    expect(globalProceed).toBe(true);
    expect(localProceed).toBe(false);
    expect(el.attribs.that).toBeUndefined();
  });

  it("discards element when attribute has no matching rule (errorHandling: discardElement)", () => {
    const el = adapter.createElement("this", html.NS.HTML, [templateAttribute]);
    adapter.appendChild(base, el);

    const { globalProceed, localProceed } = sanitizeTagAttribute(
      { key: templateAttribute.name, value: templateAttribute.value },
      el,
      undefined,
      "discardElement",
    );

    expect(globalProceed).toBe(false);
    expect(localProceed).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("unwraps element when attribute has no matching rule (errorHandling: unwrapElement)", () => {
    const parent = adapter.createElement("parent", html.NS.HTML, [
      templateAttribute,
    ]);
    adapter.appendChild(base, parent);

    const child = adapter.createElement("child", html.NS.HTML, []);
    adapter.appendChild(parent, child);

    const { globalProceed, localProceed } = sanitizeTagAttribute(
      { key: templateAttribute.name, value: templateAttribute.value },
      parent,
      undefined,
      "unwrapElement",
    );

    expect(globalProceed).toBe(false);
    expect(localProceed).toBe(false);
    expect(base.children).toHaveLength(1);
    expect(base.children[0]).toBe(child);
  });
});

describe("sanitizeTagAttributeRecordValue", () => {
  let base: Htmlparser2TreeAdapterMap["element"];
  let el: Htmlparser2TreeAdapterMap["element"];

  beforeEach(() => {
    base = adapter.createElement("root", html.NS.HTML, []);
    el = adapter.createElement("test", html.NS.HTML, []);
    adapter.appendChild(base, el);
  });

  it("sanitizes record value successfully", () => {
    el.attribs.record = "key1=value1,key2=value2";

    const rule = {
      entrySeparator: ",",
      keyValueSeparator: "=",
      mode: "record" as const,
      values: {
        key1: "value1",
        key2: "value2",
      },
    };

    const result = sanitizeTagAttributeRecordValue(
      { key: "record", value: "key1=value1,key2=value2" },
      el,
      rule,
    );

    expect(result).toBe(true);
    expect(el.attribs.record).toBe("key1=value1,key2=value2");
  });

  it("handles maxEntries exceeded with dropExtra", () => {
    el.attribs.record = "key1=value1,key2=value2,key3=value3";

    const rule = {
      entrySeparator: ",",
      keyValueSeparator: "=",
      maxEntries: 2,
      mode: "record" as const,
      values: {
        key1: "value1",
        key2: "value2",
        key3: "value3",
      },
    };

    const result = sanitizeTagAttributeRecordValue(
      { key: "record", value: "key1=value1,key2=value2,key3=value3" },
      el,
      rule,
      { attributeCollectionValueTooMany: "dropExtra" },
    );

    expect(result).toBe(true);
    expect(el.attribs.record).toBe("key1=value1,key2=value2");
  });

  it("handles maxEntries exceeded with discardElement", () => {
    el.attribs.record = "key1=value1,key2=value2,key3=value3";

    const rule = {
      entrySeparator: ",",
      keyValueSeparator: "=",
      maxEntries: 2,
      mode: "record" as const,
      values: {
        key1: "value1",
        key2: "value2",
        key3: "value3",
      },
    };

    const result = sanitizeTagAttributeRecordValue(
      { key: "record", value: "key1=value1,key2=value2,key3=value3" },
      el,
      rule,
      { attributeCollectionValueTooMany: "discardElement" },
    );

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("handles duplicate keys with dropDuplicates", () => {
    el.attribs.record = "key1=value1,key1=value2";

    const rule = {
      entrySeparator: ",",
      keyValueSeparator: "=",
      mode: "record" as const,
      values: {
        key1: "value1",
      },
    };

    const result = sanitizeTagAttributeRecordValue(
      { key: "record", value: "key1=value1,key1=value2" },
      el,
      rule,
      { attributeRecordValueDuplicate: "dropDuplicates" },
    );

    expect(result).toBe(true);
    expect(el.attribs.record).toBe("");
  });

  it("handles duplicate keys with discardElement error handling", () => {
    el.attribs.record = "key1=value1,key1=value2";

    const rule = {
      entrySeparator: ",",
      keyValueSeparator: "=",
      mode: "record" as const,
      values: {
        key1: "value1",
      },
    };

    const result = sanitizeTagAttributeRecordValue(
      { key: "record", value: "key1=value1,key1=value2" },
      el,
      rule,
      { attributeRecordValueDuplicate: "discardElement" },
    );

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("handles invalid pair rule with dropPair", () => {
    el.attribs.record = "key1=value1,key2=invalid";

    const rule = {
      entrySeparator: ",",
      keyValueSeparator: "=",
      mode: "record" as const,
      values: {
        key1: "value1",
        key2: "valid",
      },
    };

    const result = sanitizeTagAttributeRecordValue(
      { key: "record", value: "key1=value1,key2=invalid" },
      el,
      rule,
      { attributeRecordValue: "dropPair" },
    );

    expect(result).toBe(true);
    expect(el.attribs.record).toBe("key1=value1");
  });

  it("handles invalid pair rule with discardElement error handling", () => {
    el.attribs.record = "key1=value1,key2=invalid";

    const rule = {
      entrySeparator: ",",
      keyValueSeparator: "=",
      mode: "record" as const,
      values: {
        key1: "value1",
        key2: "valid",
      },
    };

    const result = sanitizeTagAttributeRecordValue(
      { key: "record", value: "key1=value1,key2=invalid" },
      el,
      rule,
      { attributeRecordValue: "discardElement" },
    );

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("handles missing pair rule with default error handling", () => {
    el.attribs.record = "key1=value1,unknown=value2";

    const rule = {
      entrySeparator: ",",
      keyValueSeparator: "=",
      mode: "record" as const,
      values: {
        key1: "value1",
      },
    };

    expect(() =>
      sanitizeTagAttributeRecordValue(
        { key: "record", value: "key1=value1,unknown=value2" },
        el,
        rule,
      ),
    ).toThrow();
  });
});

describe("sanitizeTagAttributeSetValue", () => {
  let base: Htmlparser2TreeAdapterMap["element"];
  let el: Htmlparser2TreeAdapterMap["element"];

  beforeEach(() => {
    base = adapter.createElement("root", html.NS.HTML, []);
    el = adapter.createElement("test", html.NS.HTML, []);
    adapter.appendChild(base, el);
  });

  it("sanitizes set value successfully", () => {
    el.attribs.set = "a,b,c";

    const rule = {
      delimiter: ",",
      mode: "set" as const,
      values: ["a", "b", "c"],
    };

    const result = sanitizeTagAttributeSetValue(
      { key: "set", value: "a,b,c" },
      el,
      rule,
    );

    expect(result).toBe(true);
    expect(el.attribs.set).toBe("a,b,c");
  });

  it("handles maxEntries exceeded with dropExtra", () => {
    el.attribs.set = "a,b,c";

    const rule = {
      delimiter: ",",
      maxEntries: 2,
      mode: "set" as const,
      values: ["a", "b", "c"],
    };

    const result = sanitizeTagAttributeSetValue(
      { key: "set", value: "a,b,c" },
      el,
      rule,
      { attributeCollectionValueTooMany: "dropExtra" },
    );

    expect(result).toBe(true);
    expect(el.attribs.set).toBe("a,b");
  });

  it("handles maxEntries exceeded with default error handling", () => {
    el.attribs.set = "a,b,c";

    const rule = {
      delimiter: ",",
      maxEntries: 2,
      mode: "set" as const,
      values: ["a", "b", "c"],
    };

    expect(() =>
      sanitizeTagAttributeSetValue({ key: "set", value: "a,b,c" }, el, rule),
    ).toThrow();
  });

  it("handles maxEntries exceeded with discardElement", () => {
    el.attribs.set = "a,b,c";

    const rule = {
      delimiter: ",",
      maxEntries: 2,
      mode: "set" as const,
      values: ["a", "b", "c"],
    };

    const result = sanitizeTagAttributeSetValue(
      { key: "set", value: "a,b,c" },
      el,
      rule,
      { attributeCollectionValueTooMany: "discardElement" },
    );

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("handles invalid values with default error handling", () => {
    el.attribs.set = "a,b,invalid";

    const rule = {
      delimiter: ",",
      mode: "set" as const,
      values: ["a", "b"],
    };

    expect(() =>
      sanitizeTagAttributeSetValue(
        { key: "set", value: "a,b,invalid" },
        el,
        rule,
      ),
    ).toThrow();
  });

  it("handles invalid values with discardElement", () => {
    el.attribs.set = "a,b,invalid";

    const rule = {
      delimiter: ",",
      mode: "set" as const,
      values: ["a", "b"],
    };

    const result = sanitizeTagAttributeSetValue(
      { key: "set", value: "a,b,invalid" },
      el,
      rule,
      { attributeSetValue: "discardElement" },
    );

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });
});

describe("sanitizeTagAttributeSimpleValue", () => {
  let base: Htmlparser2TreeAdapterMap["element"];
  let el: Htmlparser2TreeAdapterMap["element"];

  beforeEach(() => {
    base = adapter.createElement("root", html.NS.HTML, []);
    el = adapter.createElement("test", html.NS.HTML, []);
    adapter.appendChild(base, el);
  });

  it("sanitizes simple value successfully", () => {
    el.attribs.simple = "valid";

    const rule = {
      mode: "simple" as const,
      value: "valid",
    };

    const result = sanitizeTagAttributeSimpleValue(
      { key: "simple", value: "valid" },
      el,
      rule,
    );

    expect(result).toBe(true);
    expect(el.attribs.simple).toBe("valid");
  });

  it("handles invalid simple value", () => {
    el.attribs.simple = "invalid";

    const rule = {
      mode: "simple" as const,
      value: "valid",
    };

    const result = sanitizeTagAttributeSimpleValue(
      { key: "simple", value: "invalid" },
      el,
      rule,
      "applyDefaultValue",
    );

    expect(result).toBe(true);
    expect(el.attribs.simple).toBeUndefined();
  });
});

describe("sanitizeTagAttributeValue", () => {
  let base: Htmlparser2TreeAdapterMap["element"];
  let el: Htmlparser2TreeAdapterMap["element"];

  beforeEach(() => {
    base = adapter.createElement("root", html.NS.HTML, []);
    el = adapter.createElement("test", html.NS.HTML, []);
    adapter.appendChild(base, el);
  });

  it("handles maxLength with discardElement", () => {
    el.attribs.long = "very long value that exceeds limit";

    const rule = {
      maxLength: 10,
      mode: "simple" as const,
      value: "*",
    };

    const result = sanitizeTagAttributeValue(
      { key: "long", value: "very long value that exceeds limit" },
      el,
      rule,
      { attributeValueTooLong: "discardElement" },
    );

    expect(result).toBe(false);
    expect(base.children).toHaveLength(0);
  });

  it("handles record mode", () => {
    el.attribs.record = "key=value";

    const rule = {
      entrySeparator: ",",
      keyValueSeparator: "=",
      mode: "record" as const,
      values: {
        key: "value",
      },
    };

    const result = sanitizeTagAttributeValue(
      { key: "record", value: "key=value" },
      el,
      rule,
    );

    expect(result).toBe(true);
    expect(el.attribs.record).toBe("key=value");
  });

  it("handles set mode", () => {
    el.attribs.set = "a,b,c";

    const rule = {
      delimiter: ",",
      mode: "set" as const,
      values: ["a", "b", "c"],
    };

    const result = sanitizeTagAttributeValue(
      { key: "set", value: "a,b,c" },
      el,
      rule,
    );

    expect(result).toBe(true);
    expect(el.attribs.set).toBe("a,b,c");
  });

  it("handles simple mode", () => {
    el.attribs.simple = "valid";

    const rule = {
      mode: "simple" as const,
      value: "valid",
    };

    const result = sanitizeTagAttributeValue(
      { key: "simple", value: "valid" },
      el,
      rule,
    );

    expect(result).toBe(true);
    expect(el.attribs.simple).toBe("valid");
  });

  it("handles maxLength with empty result after truncation", () => {
    el.attribs.long = "very long value";

    const rule = {
      maxLength: 5,
      mode: "simple" as const,
      value: "*",
    };

    // Test with trimExcess which will truncate the value
    const result = sanitizeTagAttributeValue(
      { key: "long", value: "very long value" },
      el,
      rule,
      { attributeValueTooLong: "trimExcess" },
    );

    expect(result).toBe(true);
    expect(el.attribs.long).toBe("very ");
  });

  it("handles maxLength with discardAttribute resulting in empty value", () => {
    el.attribs.long = "very long value";

    const rule = {
      maxLength: 5,
      mode: "simple" as const,
      value: "*",
    };

    // Test with discardAttribute which will delete the attribute
    const result = sanitizeTagAttributeValue(
      { key: "long", value: "very long value" },
      el,
      rule,
      { attributeValueTooLong: "discardAttribute" },
    );

    expect(result).toBe(true);
    expect(el.attribs.long).toBeUndefined();
  });
});
