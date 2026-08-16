import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateScanUrl } from "./url-validator.ts";

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

  test("blocks IPv6 loopback and IPv4-mapped private addresses", () => {
    const v1 = validateScanUrl("http://[::1]:8080");
    assert.equal(v1.valid, false);
    assert.match(v1.error || "", /private or loopback/i);

    const v2 = validateScanUrl("http://[::ffff:192.168.1.1]");
    assert.equal(v2.valid, false);
    assert.match(v2.error || "", /private or loopback/i);

    const v3 = validateScanUrl("http://[::ffff:8.8.8.8]");
    assert.equal(v3.valid, true);
  });
});
