import type { Htmlparser2TreeAdapterMap } from "parse5-htmlparser2-tree-adapter";

import { html } from "parse5";
import { adapter } from "parse5-htmlparser2-tree-adapter";
import { beforeEach, describe, expect, it } from "vitest";

import {
  handleTagAttributeError,
  handleTagAttributeRecordValueError,
  handleTagAttributeSetValueError,
  handleTagAttributeValueError,
  handleTagAttributeValueTooLongError,
  handleTagChildrenError,
  handleTagError,
  handleTagNestingError,
} from "../src/lib/handlers/direct";
import {
  handleTagAttributeCollectionValueTooManyError,
  handleTagAttributeRecordValueDuplicateError,
} from "../src/lib/handlers/indirect";

describe("handlers/direct", () => {
  describe("handleTagAttributeError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("discards attribute", () => {
      el.attribs.test = "value";

      const result = handleTagAttributeError(
        { key: "test", value: "value" },
        el,
        "discardAttribute",
      );

      expect(result).toBe(true);
      expect(el.attribs.test).toBeUndefined();
    });

    it("throws error by default", () => {
      expect(() => {
        handleTagAttributeError({ key: "test", value: "value" }, el);
      }).toThrow();
    });

    it("throws error with throwError mode", () => {
      expect(() => {
        handleTagAttributeError(
          { key: "test", value: "value" },
          el,
          "throwError",
        );
      }).toThrow();
    });

    it("discards element", () => {
      const result = handleTagAttributeError(
        { key: "test", value: "value" },
        el,
        "discardElement",
      );

      expect(result).toBe(false);
      expect(base.children).toHaveLength(0);
    });

    it("unwraps element", () => {
      const child = adapter.createElement("child", html.NS.HTML, []);
      adapter.appendChild(el, child);

      const result = handleTagAttributeError(
        { key: "test", value: "value" },
        el,
        "unwrapElement",
      );

      expect(result).toBe(false);
      expect(base.children).toHaveLength(1);
      expect(base.children[0]).toBe(child);
    });
  });

  describe("handleTagAttributeRecordValueError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("drops pair", () => {
      const record = [{ key: "test", val: "value" }];
      const rule = {
        entrySeparator: ",",
        keyValueSeparator: "=",
        mode: "record" as const,
        values: {},
      };

      const result = handleTagAttributeRecordValueError(
        { key: "test", value: "value" },
        el,
        record,
        0,
        rule,
        "dropPair",
      );

      expect(result).toBe(true);
    });

    it("handles default error handling", () => {
      const record = [{ key: "test", val: "value" }];
      const rule = {
        entrySeparator: ",",
        keyValueSeparator: "=",
        mode: "record" as const,
        values: {},
      };

      expect(() => {
        handleTagAttributeRecordValueError(
          { key: "test", value: "value" },
          el,
          record,
          0,
          rule,
        );
      }).toThrow();
    });
  });

  describe("handleTagAttributeSetValueError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("drops value", () => {
      const set = ["valid", "invalid"];
      const rule = {
        delimiter: ",",
        mode: "set" as const,
        values: ["valid"],
      };

      const result = handleTagAttributeSetValueError(
        { key: "test", value: "valid,invalid" },
        el,
        1,
        set,
        rule,
        "dropValue",
      );

      expect(result).toBe(true);
    });

    it("handles default error handling", () => {
      const set = ["valid", "invalid"];
      const rule = {
        delimiter: ",",
        mode: "set" as const,
        values: ["valid"],
      };

      expect(() => {
        handleTagAttributeSetValueError(
          { key: "test", value: "valid,invalid" },
          el,
          1,
          set,
          rule,
        );
      }).toThrow();
    });
  });

  describe("handleTagAttributeValueError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("applies default value", () => {
      const rule = {
        defaultValue: "default",
        mode: "simple" as const,
        value: "*",
      };

      const result = handleTagAttributeValueError(
        { key: "test", value: "invalid" },
        el,
        rule,
        "applyDefaultValue",
      );

      expect(result).toBe(true);
      expect(el.attribs.test).toBe("default");
    });

    it("deletes attribute when no default value", () => {
      const rule = {
        mode: "simple" as const,
        value: "*",
      };

      el.attribs.test = "invalid";

      const result = handleTagAttributeValueError(
        { key: "test", value: "invalid" },
        el,
        rule,
        "applyDefaultValue",
      );

      expect(result).toBe(true);
      expect(el.attribs.test).toBeUndefined();
    });

    it("handles default error handling", () => {
      const rule = {
        mode: "simple" as const,
        value: "*",
      };

      expect(() => {
        handleTagAttributeValueError(
          { key: "test", value: "invalid" },
          el,
          rule,
        );
      }).toThrow();
    });
  });

  describe("handleTagAttributeValueTooLongError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("trims excess", () => {
      const rule = {
        maxLength: 10,
        mode: "simple" as const,
        value: "*",
      };

      const result = handleTagAttributeValueTooLongError(
        { key: "test", value: "very long value" },
        el,
        rule,
        "trimExcess",
      );

      expect(result).toBe(true);
      expect(el.attribs.test).toBe("very long ");
    });

    it("handles default error handling", () => {
      const rule = {
        maxLength: 10,
        mode: "simple" as const,
        value: "*",
      };

      expect(() => {
        handleTagAttributeValueTooLongError(
          { key: "test", value: "very long value" },
          el,
          rule,
        );
      }).toThrow();
    });
  });

  describe("handleTagChildrenError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("discards element", () => {
      const child1 = adapter.createElement("child1", html.NS.HTML, []);
      const child2 = adapter.createElement("child2", html.NS.HTML, []);
      const child3 = adapter.createElement("child3", html.NS.HTML, []);

      adapter.appendChild(el, child1);
      adapter.appendChild(el, child2);
      adapter.appendChild(el, child3);

      const result = handleTagChildrenError(el, 2, "discardElement");

      expect(result).toBe(false);
      expect(base.children).toHaveLength(0);
    });

    it("discards firsts", () => {
      const child1 = adapter.createElement("child1", html.NS.HTML, []);
      const child2 = adapter.createElement("child2", html.NS.HTML, []);
      const child3 = adapter.createElement("child3", html.NS.HTML, []);

      adapter.appendChild(el, child1);
      adapter.appendChild(el, child2);
      adapter.appendChild(el, child3);

      const result = handleTagChildrenError(el, 2, "discardFirsts");

      expect(result).toBe(true);
      expect(el.children).toHaveLength(2);
      expect(el.children[0]).toBe(child2);
      expect(el.children[1]).toBe(child3);
    });

    it("discards lasts", () => {
      const child1 = adapter.createElement("child1", html.NS.HTML, []);
      const child2 = adapter.createElement("child2", html.NS.HTML, []);
      const child3 = adapter.createElement("child3", html.NS.HTML, []);

      adapter.appendChild(el, child1);
      adapter.appendChild(el, child2);
      adapter.appendChild(el, child3);

      const result = handleTagChildrenError(el, 2, "discardLasts");

      expect(result).toBe(true);
      expect(el.children).toHaveLength(2);
      expect(el.children[0]).toBe(child1);
      expect(el.children[1]).toBe(child2);
    });

    it("throws error by default", () => {
      const child1 = adapter.createElement("child1", html.NS.HTML, []);
      const child2 = adapter.createElement("child2", html.NS.HTML, []);
      const child3 = adapter.createElement("child3", html.NS.HTML, []);

      adapter.appendChild(el, child1);
      adapter.appendChild(el, child2);
      adapter.appendChild(el, child3);

      expect(() => {
        handleTagChildrenError(el, 2);
      }).toThrow();
    });

    it("throws error with throwError mode", () => {
      const child1 = adapter.createElement("child1", html.NS.HTML, []);
      const child2 = adapter.createElement("child2", html.NS.HTML, []);
      const child3 = adapter.createElement("child3", html.NS.HTML, []);

      adapter.appendChild(el, child1);
      adapter.appendChild(el, child2);
      adapter.appendChild(el, child3);

      expect(() => {
        handleTagChildrenError(el, 2, "throwError");
      }).toThrow();
    });

    it("handles document element", () => {
      const doc = adapter.createDocument();
      const child1 = adapter.createElement("child1", html.NS.HTML, []);
      const child2 = adapter.createElement("child2", html.NS.HTML, []);
      const child3 = adapter.createElement("child3", html.NS.HTML, []);

      adapter.appendChild(doc, child1);
      adapter.appendChild(doc, child2);
      adapter.appendChild(doc, child3);

      expect(() => {
        handleTagChildrenError(doc, 2, "throwError");
      }).toThrow();
    });
  });

  describe("handleTagError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("discards element", () => {
      const result = handleTagError(el, "discardElement");

      expect(result).toBe(false);
      expect(base.children).toHaveLength(0);
    });

    it("unwraps element", () => {
      const child = adapter.createElement("child", html.NS.HTML, []);
      adapter.appendChild(el, child);

      const result = handleTagError(el, "unwrapElement");

      expect(result).toBe(false);
      expect(base.children).toHaveLength(1);
      expect(base.children[0]).toBe(child);
    });

    it("throws error by default", () => {
      expect(() => {
        handleTagError(el);
      }).toThrow();
    });

    it("throws error with throwError mode", () => {
      expect(() => {
        handleTagError(el, "throwError");
      }).toThrow();
    });
  });

  describe("handleTagNestingError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("discards element", () => {
      const result = handleTagNestingError(el, 5, "discardElement");

      expect(result).toBe(false);
      expect(base.children).toHaveLength(0);
    });

    it("throws error by default", () => {
      expect(() => {
        handleTagNestingError(el, 5);
      }).toThrow();
    });

    it("throws error with throwError mode", () => {
      expect(() => {
        handleTagNestingError(el, 5, "throwError");
      }).toThrow();
    });

    it("handles document element", () => {
      const doc = adapter.createDocument();

      expect(() => {
        handleTagNestingError(doc, 5, "throwError");
      }).toThrow();
    });
  });
});

describe("handlers/indirect", () => {
  describe("handleTagAttributeCollectionValueTooManyError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("drops extra values", () => {
      const collection = ["a", "b", "c", "d"];
      const rule = {
        delimiter: ",",
        maxEntries: 2,
        mode: "set" as const,
        values: "*",
      };

      const result = handleTagAttributeCollectionValueTooManyError(
        { key: "test", value: "a,b,c,d" },
        el,
        collection,
        rule,
        "dropExtra",
      );

      expect(result.proceed).toBe(true);
      expect(result.output).toEqual(["a", "b"]);
    });

    it("handles default error handling", () => {
      const collection = ["a", "b", "c", "d"];
      const rule = {
        delimiter: ",",
        maxEntries: 2,
        mode: "set" as const,
        values: "*",
      };

      expect(() => {
        handleTagAttributeCollectionValueTooManyError(
          { key: "test", value: "a,b,c,d" },
          el,
          collection,
          rule,
        );
      }).toThrow();
    });
  });

  describe("handleTagAttributeRecordValueDuplicateError", () => {
    let base: Htmlparser2TreeAdapterMap["element"];
    let el: Htmlparser2TreeAdapterMap["element"];

    beforeEach(() => {
      base = adapter.createElement("root", html.NS.HTML, []);
      el = adapter.createElement("test", html.NS.HTML, []);
      adapter.appendChild(base, el);
    });

    it("drops duplicates", () => {
      const record = [
        { key: "test", val: "value1" },
        { key: "other", val: "value2" },
      ];
      const rule = {
        entrySeparator: ",",
        keyValueSeparator: "=",
        mode: "record" as const,
        values: {},
      };

      const result = handleTagAttributeRecordValueDuplicateError(
        { key: "test", value: "test=value1,other=value2" },
        el,
        "test",
        record,
        rule,
        "dropDuplicates",
      );

      expect(result.globalProceed).toBe(true);
      expect(result.localProceed).toBe(false);
      expect(result.output).toEqual([{ key: "other", val: "value2" }]);
    });

    it("keeps duplicates", () => {
      const record = [
        { key: "test", val: "value1" },
        { key: "other", val: "value2" },
      ];
      const rule = {
        entrySeparator: ",",
        keyValueSeparator: "=",
        mode: "record" as const,
        values: {},
      };

      const result = handleTagAttributeRecordValueDuplicateError(
        { key: "test", value: "test=value1,other=value2" },
        el,
        "test",
        record,
        rule,
        "keepDuplicates",
      );

      expect(result.globalProceed).toBe(true);
      expect(result.localProceed).toBe(true);
      expect(result.output).toEqual(record);
    });

    it("keeps first", () => {
      const record = [
        { key: "test", val: "value1" },
        { key: "other", val: "value2" },
      ];
      const rule = {
        entrySeparator: ",",
        keyValueSeparator: "=",
        mode: "record" as const,
        values: {},
      };

      const result = handleTagAttributeRecordValueDuplicateError(
        { key: "test", value: "test=value1,other=value2" },
        el,
        "test",
        record,
        rule,
        "keepFirst",
      );

      expect(result.globalProceed).toBe(true);
      expect(result.localProceed).toBe(false);
      expect(result.output).toEqual(record);
    });

    it("keeps last", () => {
      const record = [
        { key: "test", val: "value1" },
        { key: "other", val: "value2" },
      ];
      const rule = {
        entrySeparator: ",",
        keyValueSeparator: "=",
        mode: "record" as const,
        values: {},
      };

      const result = handleTagAttributeRecordValueDuplicateError(
        { key: "test", value: "test=value1,other=value2" },
        el,
        "test",
        record,
        rule,
        "keepLast",
      );

      expect(result.globalProceed).toBe(true);
      expect(result.localProceed).toBe(true);
      expect(result.output).toEqual([{ key: "other", val: "value2" }]);
    });

    it("handles default error handling", () => {
      const record = [
        { key: "test", val: "value1" },
        { key: "other", val: "value2" },
      ];
      const rule = {
        entrySeparator: ",",
        keyValueSeparator: "=",
        mode: "record" as const,
        values: {},
      };

      expect(() => {
        handleTagAttributeRecordValueDuplicateError(
          { key: "test", value: "test=value1,other=value2" },
          el,
          "test",
          record,
          rule,
        );
      }).toThrow();
    });
  });
});
