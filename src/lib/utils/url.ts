// Base patterns (unclamped)
const protocolRe = /[a-z][a-z0-9+.-]*/i;

// https://ihateregex.io/expr/ip/
const ipv4Frag = /(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])/i;
const ipv4Re = new RegExp(
  String.raw`${ipv4Frag.source}(?:\.${ipv4Frag.source}){3}`,
  "i",
);

// https://ihateregex.io/expr/ipv6/
const hexFrag = /[a-f0-9]/i;
const ipv6Frag = new RegExp(`${hexFrag.source}{1,4}`, "i");
const ipv6Re = new RegExp(
  `((${ipv6Frag.source}:){7,7}${ipv6Frag.source}|
  (${ipv6Frag.source}:){1,7}:|
  (${ipv6Frag.source}:){1,6}:${ipv6Frag.source}|
  (${ipv6Frag.source}:){1,5}(:${ipv6Frag.source}){1,2}|
  (${ipv6Frag.source}:){1,4}(:${ipv6Frag.source}){1,3}|
  (${ipv6Frag.source}:){1,3}(:${ipv6Frag.source}){1,4}|
  (${ipv6Frag.source}:){1,2}(:${ipv6Frag.source}){1,5}|
  ${ipv6Frag.source}:((:${ipv6Frag.source}){1,6})|
  :((:${ipv6Frag.source}){1,7}|:)|
  fe80:(:${hexFrag.source}{0,4}){0,4}%[0-9a-z]{1,}|
  ::(ffff(:0{1,4}){0,1}:){0,1}(${ipv4Re.source})|
  (${ipv6Frag.source}:){1,4}:(${ipv4Re.source}))`.replaceAll(/[ \t\n]/g, ""), // prevent newline pollution
  "i",
);

const domainRe =
  /(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,}/i;

// Clamped validators for config inputs
const protocolValidator = new RegExp(`^${protocolRe.source}$`, "i");
const ipv4Validator = new RegExp(`^${ipv4Re.source}$`, "i");
const ipv6Validator = new RegExp(`^${ipv6Re.source}$`, "i");
const domainValidator = new RegExp(`^${domainRe.source}$`, "i");

// Helper
const escapeForRegex = (s: string) =>
  s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

// Fallback
const hostFallback = String.raw`(?:${domainRe.source}|${ipv4Re.source}|\[(?:${ipv6Re.source})\])`;

type HostKind = "domain" | "ipv4" | "ipv6";

export function buildAllowedUrlRegex(
  protocols: string[],
  hosts: string[], // domains, IPv4, or IPv6 (bare or [bracketed])
  allowRelative: boolean,
): RegExp {
  // Validate protocols
  for (const p of protocols) {
    if (!protocolValidator.test(p)) throw new Error(`Invalid protocol: ${p}`);
  }
  // Validate hosts
  for (const h of hosts) {
    if (!classifyHost(h)) throw new Error(`Invalid host: ${h}`);
  }

  const protoPart = protocols.length
    ? `(?:${protocols.map(escapeForRegex).join("|")})`
    : `(?:${protocolRe.source})`;

  const hostPart = hosts.length ? hostPatternFromList(hosts) : hostFallback;

  const absolutePart = `${protoPart}://${hostPart}`;
  const relativePart = allowRelative ? String.raw`|(?:/[^\s]*)` : "";

  const pattern = `^(?:${absolutePart}${relativePart})$`;
  return new RegExp(pattern, "i");
}

export function classifyHost(input: string): HostKind | null {
  // Accept both bracketed and bare IPv6 in the list
  const bare =
    input.startsWith("[") && input.endsWith("]") ? input.slice(1, -1) : input;
  if (ipv6Validator.test(bare)) return "ipv6";
  if (ipv4Validator.test(input)) return "ipv4";
  if (domainValidator.test(input)) return "domain";
  return null;
}

export function hostPatternFromList(hosts: string[]): string {
  // Build an alternation for concrete hosts
  const parts = hosts.map((h) => {
    const kind = classifyHost(h);
    if (!kind) throw new Error(`Invalid host: ${h}`);
    if (kind === "ipv6") {
      const bare = h.startsWith("[") && h.endsWith("]") ? h.slice(1, -1) : h;
      return String.raw`\[${escapeForRegex(bare)}\]`; // IPv6 must be bracketed in URLs
    }
    return escapeForRegex(h); // domain or IPv4
  });
  return `(?:${parts.join("|")})`;
}
