import { describe, expect, it } from "vitest";

import {
  buildAllowedUrlRegex,
  classifyHost,
  hostPatternFromList,
} from "../src/lib/utils/url";

describe("buildAllowedUrlRegex", () => {
  it("matches only specified protocols + hosts (domain, IPv4, IPv6)", () => {
    const re = buildAllowedUrlRegex(
      ["http", "https"],
      ["example.com", "192.168.0.1", "2001:db8::1"],
      false,
    );

    // Exact absolute forms (no path/port per current builder)
    expect(re.test("https://example.com")).toBe(true);
    expect(re.test("http://192.168.0.1")).toBe(true);
    expect(re.test("http://[2001:db8::1]")).toBe(true);

    // Wrong scheme
    expect(re.test("ftp://example.com")).toBe(false);

    // Wrong host
    expect(re.test("https://evil.com")).toBe(false);

    // Unbracketed IPv6 is invalid in URL
    expect(re.test("http://2001:db8::1")).toBe(false);
  });

  it("is case-insensitive for scheme, domain, and IPv6 hex", () => {
    const re = buildAllowedUrlRegex(
      ["http"],
      ["EXAMPLE.com", "2001:DB8::1"],
      false,
    );
    expect(re.test("HTTP://EXAMPLE.COM")).toBe(true);
    expect(re.test("http://[2001:db8::1]")).toBe(true);
    expect(re.test("http://[2001:DB8::1]")).toBe(true);
  });

  it("allows relative URLs when allowRelative = true", () => {
    const re = buildAllowedUrlRegex(["http"], ["example.com"], true);
    expect(re.test("/")).toBe(true);
    expect(re.test("/foo/bar?x=1#hash")).toBe(true);

    // Absolute still okay
    expect(re.test("http://example.com")).toBe(true);
  });

  it("rejects relative URLs when allowRelative = false", () => {
    const re = buildAllowedUrlRegex(["http"], ["example.com"], false);
    expect(re.test("/foo")).toBe(false);
  });

  it("falls back to ANY valid scheme when protocols = []", () => {
    const re = buildAllowedUrlRegex([], ["example.com"], false);
    expect(re.test("git+ssh://example.com")).toBe(true);
    expect(re.test("coap+tcp://example.com")).toBe(true);
    // Still requires '://'
    expect(re.test("mailto:example.com")).toBe(false);
  });

  it("falls back to ANY valid host when hosts = []", () => {
    const re = buildAllowedUrlRegex(["http"], [], false);
    expect(re.test("http://sub.domain.co.uk")).toBe(true);
    expect(re.test("http://1.2.3.4")).toBe(true);
    expect(re.test("http://[2001:db8::1]")).toBe(true);
    // Invalid domain label
    expect(re.test("http://-bad-.com")).toBe(false);
    // Needs 2+ letter TLD in fallback
    expect(re.test("http://x.y.z")).toBe(false);
    expect(re.test("http://x.y.zz")).toBe(true);
  });

  it("rejects trailing junk due to anchors (^$)", () => {
    const re = buildAllowedUrlRegex(["https"], ["example.com"], false);
    expect(re.test("https://example.com/")).toBe(false); // no path supported
    expect(re.test(" https://example.com")).toBe(false); // leading space
    expect(re.test("https://example.com ")).toBe(false); // trailing space
  });

  it("throws on invalid protocol in list", () => {
    expect(() =>
      buildAllowedUrlRegex(["1http"], ["example.com"], false),
    ).toThrow(/Invalid protocol: 1http/);
  });

  it("throws on invalid host in list (domain, IPv4, IPv6)", () => {
    expect(() => buildAllowedUrlRegex(["http"], ["-bad.com"], false)).toThrow(
      /Invalid host: -bad\.com/,
    );

    expect(() => buildAllowedUrlRegex(["http"], ["999.0.0.1"], false)).toThrow(
      /Invalid host: 999\.0\.0\.1/,
    );

    expect(() => buildAllowedUrlRegex(["http"], ["2001:::1"], false)).toThrow(
      /Invalid host: 2001:::1/,
    );
  });

  it("accepts bracketed IPv6 in host list and matches correctly", () => {
    const re = buildAllowedUrlRegex(["http"], ["[2001:db8::2]"], false);
    expect(re.test("http://[2001:db8::2]")).toBe(true);
    expect(re.test("http://2001:db8::2")).toBe(false);
  });

  it("rejects ports and any path when allowRelative = false", () => {
    const re = buildAllowedUrlRegex(["https"], ["example.com"], false);
    expect(re.test("https://example.com:443")).toBe(false); // no port support
    expect(re.test("https://example.com/foo")).toBe(false); // no path support
    expect(re.test("https://example.com?x=1")).toBe(false); // no query
    expect(re.test("https://example.com#hash")).toBe(false); // no hash
  });

  it("does not allow dot-relative URLs even when allowRelative = true", () => {
    const re = buildAllowedUrlRegex(["http"], ["example.com"], true);
    expect(re.test("./foo")).toBe(false);
    expect(re.test("../foo")).toBe(false);
  });

  it("any-scheme + any-host when both lists are empty", () => {
    const re = buildAllowedUrlRegex([], [], false);
    expect(re.test("ssh://a.b")).toBe(false); // invalid: 1-char TLD blocked by fallback domain rule
    expect(re.test("ssh://a.bb")).toBe(true);
    expect(re.test("foo+bar://1.2.3.4")).toBe(true);
    expect(re.test("foo.bar://[::1]")).toBe(true);
  });

  it("scheme tokens may include + . - per protocol grammar", () => {
    const re = buildAllowedUrlRegex([], ["example.com"], false);
    expect(re.test("abc+def://example.com")).toBe(true);
    expect(re.test("a.b-c://example.com")).toBe(true);
  });

  it("case-insensitive host fallback allows mixed-case IPv6", () => {
    const re = buildAllowedUrlRegex(["http"], [], false);
    expect(re.test("http://[Fe80::1]")).toBe(true);
  });
});

describe("classifyHost", () => {
  it("classifies valid domains, IPv4, and IPv6 (bare/bracketed)", () => {
    expect(classifyHost("example.com")).toBe("domain");
    expect(classifyHost("sub.domain.co.uk")).toBe("domain");

    expect(classifyHost("192.168.0.1")).toBe("ipv4");
    expect(classifyHost("255.255.255.255")).toBe("ipv4");

    expect(classifyHost("2001:db8::1")).toBe("ipv6"); // bare IPv6 accepted in list
    expect(classifyHost("[2001:db8::1]")).toBe("ipv6"); // bracketed IPv6 accepted in list
  });

  it("rejects invalid hosts", () => {
    expect(classifyHost("-bad.com")).toBeNull(); // invalid domain label
    expect(classifyHost("example")).toBeNull(); // no TLD
    expect(classifyHost("300.1.1.1")).toBeNull(); // IPv4 out of range
    expect(classifyHost("2001:::1")).toBeNull(); // malformed IPv6
    expect(classifyHost("[2001:::1]")).toBeNull(); // malformed IPv6 (bracketed)
  });

  it("rejects single-label host and 1-char TLD, underscores, trailing dot", () => {
    expect(classifyHost("localhost")).toBeNull(); // requires a dot + 2+ letter TLD
    expect(classifyHost("foo.bar.z")).toBeNull(); // TLD must be 2+ letters
    expect(classifyHost("foo_bar.com")).toBeNull(); // underscore not allowed
    expect(classifyHost("example.com.")).toBeNull(); // trailing dot not accepted by domain regex
  });

  it("rejects IPv4 with leading zeros and accepts 0.0.0.0", () => {
    expect(classifyHost("01.2.3.4")).toBeNull(); // leading zero in octet
    expect(classifyHost("0.0.0.0")).toBe("ipv4");
  });

  it("accepts additional IPv6 forms and mixed case hex", () => {
    expect(classifyHost("::1")).toBe("ipv6");
    expect(classifyHost("FE80::1")).toBe("ipv6");
    expect(classifyHost("[::1]")).toBe("ipv6");
  });
});

describe("hostPatternFromList", () => {
  it("builds an alternation that brackets IPv6 and leaves domain/IPv4 literal", () => {
    const pat = hostPatternFromList([
      "example.com",
      "192.168.0.1",
      "2001:db8::1", // bare IPv6 in list
      "[2001:db8::2]", // bracketed IPv6 in list
    ]);

    const re = new RegExp(`^${pat}$`, "i");

    // Matches listed hosts
    expect(re.test("example.com")).toBe(true);
    expect(re.test("192.168.0.1")).toBe(true);
    expect(re.test("[2001:db8::1]")).toBe(true); // should be bracketed in the final URL/host match
    expect(re.test("[2001:db8::2]")).toBe(true);

    // Does NOT match unbracketed IPv6 in final
    expect(re.test("2001:db8::1")).toBe(false);

    // Not in list
    expect(re.test("not-listed.com")).toBe(false);
  });

  it("throws on invalid host in list", () => {
    expect(() => hostPatternFromList(["-bad.com"])).toThrow(/Invalid host/);
    expect(() => hostPatternFromList(["999.0.0.1"])).toThrow(/Invalid host/);
    expect(() => hostPatternFromList(["2001:::1"])).toThrow(/Invalid host/);
  });

  it("escapes dots and hyphens correctly and tolerates duplicates", () => {
    const pat = hostPatternFromList([
      "a.b-c.example.com",
      "a.b-c.example.com", // duplicate
    ]);
    const re = new RegExp(`^${pat}$`, "i");
    expect(re.test("a.b-c.example.com")).toBe(true);
    expect(re.test("aXb-c.example.com")).toBe(false);
  });

  it("accepts bracketed IPv6 in input list but requires bracketed match", () => {
    const pat = hostPatternFromList(["[::1]"]);
    const re = new RegExp(`^${pat}$`, "i");
    expect(re.test("[::1]")).toBe(true);
    expect(re.test("::1")).toBe(false);
  });
});
