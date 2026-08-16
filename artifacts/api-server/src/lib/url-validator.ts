import { isIP } from "net";

/**
 * Validates a target URL to ensure it is valid, uses http/https,
 * and does NOT target private IP ranges, loopback addresses, or internal services (SSRF Prevention).
 */
export function validateScanUrl(rawUrl: string): { valid: boolean; url?: URL; error?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "URL parameter is required." };
  }

  let formatted = rawUrl.trim();
  if (formatted.includes("://") && !/^https?:\/\//i.test(formatted)) {
    return { valid: false, error: "Only http and https protocols are allowed." };
  }
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`;
  }

  let url: URL;
  try {
    url = new URL(formatted);
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }

  if (!["http:", "https:"].includes(url.protocol.toLowerCase())) {
    return { valid: false, error: "Only http and https protocols are allowed." };
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0"
  ) {
    return { valid: false, error: "Access to local network hosts is prohibited." };
  }

  const ipType = isIP(hostname);
  if (ipType !== 0) {
    if (isPrivateOrLoopbackIP(hostname)) {
      return { valid: false, error: "Access to private or loopback IP addresses is prohibited." };
    }
  }

  return { valid: true, url };
}

function isPrivateOrLoopbackIP(ip: string): boolean {
  if (ip.includes(".")) {
    const parts = ip.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    if (parts[0] === 127) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 0) return true;

    return false;
  }

  const normalized = ip.toLowerCase();
  
  // Handle IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)
  if (normalized.startsWith("::ffff:")) {
    const mappedIPv4 = normalized.slice(7);
    if (mappedIPv4.includes(".")) {
      return isPrivateOrLoopbackIP(mappedIPv4);
    }
  }
  
  if (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc00:") ||
    normalized.startsWith("fd00:")
  ) {
    return true;
  }

  return false;
}
