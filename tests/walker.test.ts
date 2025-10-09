import type { Htmlparser2TreeAdapterMap } from "parse5-htmlparser2-tree-adapter";

import { parseFragment } from "parse5";
import { adapter } from "parse5-htmlparser2-tree-adapter";
import { describe, expect, it } from "vitest";

import { walkNode } from "../src/lib/walker";

describe("walker", () => {
  describe("walkNode", () => {
    it("walks element nodes", () => {
      const html = "<div>Hello</div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        tags: {
          div: {},
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles nesting limits", () => {
      const html = "<div><div><div>Deep</div></div></div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        tags: {
          div: {},
        },
        topLevelLimits: {
          nesting: 2,
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles comment nodes when preserveComments is false", () => {
      const html = "<div><!-- comment -->Hello</div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        preserveComments: false,
        tags: {
          div: {},
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles comment nodes when preserveComments is true", () => {
      const html = "<div><!-- comment -->Hello</div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        preserveComments: true,
        tags: {
          div: {},
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles text nodes", () => {
      const html = "Hello World";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {};

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles tag limits", () => {
      const html = "<div><span>1</span><span>2</span><span>3</span></div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        tags: {
          div: {
            limits: {
              children: 2,
            },
          },
          span: {},
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should throw due to children limit
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).toThrow();
    });

    it("handles tag nesting limits", () => {
      const html = "<div><div><div>Nested</div></div></div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        tags: {
          div: {
            limits: {
              nesting: 2,
            },
          },
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles disallowed tags", () => {
      const html = "<div><script>alert('xss')</script><p>Safe</p></div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        tags: {
          div: {},
          p: {},
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should throw due to disallowed script tag
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).toThrow();
    });

    it("handles attributes", () => {
      const html = '<div class="test" id="example">Hello</div>';
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        tags: {
          div: {
            attributes: {
              class: {
                mode: "simple" as const,
                value: "*",
              },
              id: {
                mode: "simple" as const,
                value: "*",
              },
            },
          },
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles complex nested structure", () => {
      const html = `
        <div>
          <p>Paragraph 1</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <p>Paragraph 2</p>
        </div>
      `;
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        tags: {
          div: {},
          li: {},
          p: {},
          ul: {},
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles error handling modes", () => {
      const html = "<div><script>alert('xss')</script></div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        errorHandling: {
          attribute: "discardAttribute" as const,
          attributeValue: "applyDefaultValue" as const,
          tag: "discardElement" as const,
          tagChildren: "discardFirsts" as const,
          tagNesting: "discardElement" as const,
        },
        tags: {
          div: {},
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles empty elements", () => {
      const html = "<div></div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        tags: {
          div: {},
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles self-closing elements", () => {
      const html = "<img src='test.jpg' /><br />";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        tags: {
          br: {},
          img: {
            attributes: {
              src: {
                mode: "simple" as const,
                value: "*",
              },
            },
          },
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles top-level nesting limit exceeded", () => {
      const html = "<div><div><div>Deep</div></div></div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        errorHandling: {
          tagNesting: "discardElement" as const,
        },
        tags: {
          div: {},
        },
        topLevelLimits: {
          nesting: 1,
        },
      };

      const state = { rootNesting: 2, tagNesting: [] }; // Already at nesting level 2

      // Should not throw due to error handling
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles attribute sanitization failure", () => {
      const html = '<div class="test">Hello</div>';
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        errorHandling: {
          attributeValue: "applyDefaultValue" as const,
        },
        tags: {
          div: {
            attributes: {
              class: {
                mode: "simple" as const,
                value: "allowed-class", // Only allow specific class
              },
            },
          },
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw due to error handling
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles tag children error handling that returns false", () => {
      const html = "<div><span>1</span><span>2</span><span>3</span></div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        errorHandling: {
          tagChildren: "discardElement" as const,
        },
        tags: {
          div: {
            limits: {
              children: 2,
            },
          },
          span: {},
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw due to error handling
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles tag nesting error handling that returns false", () => {
      const html = "<div><div><div>Nested</div></div></div>";
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        errorHandling: {
          tagNesting: "discardElement" as const,
        },
        tags: {
          div: {
            limits: {
              nesting: 1,
            },
          },
        },
      };

      const state = { rootNesting: 0, tagNesting: [{ key: "div", value: 1 }] }; // Already nested once

      // Should not throw due to error handling
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });

    it("handles attribute sanitization that returns false", () => {
      const html = '<div class="test">Hello</div>';
      const frag: Htmlparser2TreeAdapterMap["documentFragment"] = parseFragment(
        html,
        { treeAdapter: adapter },
      );

      const options = {
        errorHandling: {
          attributeValue: "discardElement" as const,
        },
        tags: {
          div: {
            attributes: {
              class: {
                mode: "simple" as const,
                value: "allowed-class", // Only allow specific class
              },
            },
          },
        },
      };

      const state = { rootNesting: 0, tagNesting: [] };

      // Should not throw due to error handling
      expect(() => {
        walkNode(frag.firstChild!, options, state);
      }).not.toThrow();
    });
  });
});
