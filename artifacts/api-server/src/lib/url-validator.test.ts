import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateScanUrl } from "./url-validator";

describe("URL Validator & SSRF Protection", () => {
  test("allows valid public HTTPS URLs", () => {
    const res = validateScanUrl("https://example.com/page");
    assert.equal(res.valid, true);
    assert.equal(res.url?.hostname, "example.com");
  });

  test("allows valid public HTTP URLs and formats them", () => {
    const res = validateScanUrl("example.org");
    assert.equal(res.valid, true);
    assert.equal(res.url?.protocol, "https:");
    assert.equal(res.url?.hostname, "example.org");
  });

  test("blocks localhost hostname", () => {
    const res = validateScanUrl("http://localhost:5000/api");
    assert.equal(res.valid, false);
    assert.match(res.error || "", /local network hosts/i);
  });

  test("blocks 127.0.0.1 loopback IP", () => {
    const res = validateScanUrl("http://127.0.0.1:8080");
    assert.equal(res.valid, false);
    assert.match(res.error || "", /private or loopback/i);
  });

  test("blocks 10.x.x.x private IP range", () => {
    const res = validateScanUrl("http://10.0.0.1/admin");
    assert.equal(res.valid, false);
    assert.match(res.error || "", /private or loopback/i);
  });

  test("blocks 192.168.x.x private IP range", () => {
    const res = validateScanUrl("http://192.168.1.1/router");
    assert.equal(res.valid, false);
    assert.match(res.error || "", /private or loopback/i);
  });

  test("blocks 169.254.169.254 cloud metadata IP", () => {
    const res = validateScanUrl("http://169.254.169.254/latest/meta-data/");
    assert.equal(res.valid, false);
    assert.match(res.error || "", /private or loopback/i);
  });

  test("blocks invalid protocol schemes like ftp or file", () => {
    const res = validateScanUrl("file:///etc/passwd");
    assert.equal(res.valid, false);
    assert.match(res.error || "", /http and https/i);
  });
});

// Additional SSRF edge-case tests for IPv6 and IPv4-mapped IPv6 addresses
// These were added to ensure mapped private IPv4 addresses are blocked.
import { describe as _describe } from "node:test";

test("blocks IPv6 loopback and mapped IPv4 addresses", () => {
  // IPv6 loopback
  const v1 = validateScanUrl("http://[::1]:8080");
  assert.equal(v1.valid, false);
  assert.match(v1.error || "", /private or loopback/i);

  // IPv4-mapped IPv6 for a private IPv4 should be blocked
  const v2 = validateScanUrl("http://[::ffff:192.168.1.1]");
  assert.equal(v2.valid, false);
  assert.match(v2.error || "", /private or loopback/i);

  // IPv4-mapped IPv6 for a public IPv4 should be allowed
  const v3 = validateScanUrl("http://[::ffff:8.8.8.8]");
  assert.equal(v3.valid, true);
});
