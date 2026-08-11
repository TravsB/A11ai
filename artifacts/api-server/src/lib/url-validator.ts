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

  // Block localhost, local domains
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0"
  ) {
    return { valid: false, error: "Access to local network hosts is prohibited." };
  }

  // Check if hostname is an IP address
  const ipType = isIP(hostname);
  if (ipType !== 0) {
    if (isPrivateOrLoopbackIP(hostname)) {
      return { valid: false, error: "Access to private or loopback IP addresses is prohibited." };
    }
  }

  return { valid: true, url };
}

function isPrivateOrLoopbackIP(ip: string): boolean {
  // IPv4 check
  if (ip.includes(".")) {
    const parts = ip.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud Metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;

    return false;
  }

  // IPv6 check
  const normalized = ip.toLowerCase();
  if (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fe80:") || // link-local
    normalized.startsWith("fc00:") || // unique local
    normalized.startsWith("fd00:")
  ) {
    return true;
  }

  return false;
}
