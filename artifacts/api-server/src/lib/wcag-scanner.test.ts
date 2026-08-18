import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { scanHtml } from "./wcag-scanner";

describe("WCAG 2.1 Scanner Engine", () => {
  test("detects missing image alt attributes and provides remediation fix", () => {
    const html = `<!DOCTYPE html><html lang="en"><head><title>Test Page</title></head><body><img src="photo.jpg"></body></html>`;
    const { issues, score } = scanHtml(html);

    const imgIssue = issues.find((i) => i.id === "img-alt");
    assert.ok(imgIssue, "Expected img-alt issue to be detected");
    assert.equal(imgIssue?.severity, "critical");
    assert.equal(imgIssue?.count, 1);
    assert.ok(imgIssue?.remediation, "Expected remediation guidance snippet");
    assert.ok(imgIssue?.remediation.includes("alt="));
    assert.ok(score < 100);
  });

  test("detects form inputs missing labels", () => {
    const html = `<!DOCTYPE html><html lang="en"><head><title>Form Page</title></head><body><input type="email" id="email-field"></body></html>`;
    const { issues } = scanHtml(html);

    const inputIssue = issues.find((i) => i.id === "input-label");
    assert.ok(inputIssue, "Expected input-label issue");
    assert.equal(inputIssue?.severity, "critical");
    assert.ok((inputIssue?.remediation ?? "").includes("<label"));
  });

  test("detects invalid ARIA role attributes", () => {
    const html = `<!DOCTYPE html><html lang="en"><head><title>ARIA Page</title></head><body><div role="super-button">Click</div></body></html>`;
    const { issues } = scanHtml(html);

    const ariaIssue = issues.find((i) => i.id === "aria-valid-roles");
    assert.ok(ariaIssue, "Expected aria-valid-roles issue");
    assert.equal(ariaIssue?.severity, "critical");
  });

  test("detects duplicate element IDs", () => {
    const html = `<!DOCTYPE html><html lang="en"><head><title>IDs Page</title></head><body><div id="wrapper">A</div><div id="wrapper">B</div></body></html>`;
    const { issues } = scanHtml(html);

    const dupIssue = issues.find((i) => i.id === "duplicate-id");
    assert.ok(dupIssue, "Expected duplicate-id issue");
    assert.equal(dupIssue?.severity, "high");
  });

  test("detects missing HTML lang and missing title", () => {
    const html = `<html><head></head><body><main>Content</main></body></html>`;
    const { issues } = scanHtml(html);

    assert.ok(issues.some((i) => i.id === "html-lang"));
    assert.ok(issues.some((i) => i.id === "page-title"));
  });

  test("returns score 100 for clean fully accessible HTML", () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Accessible Web Page</title>
</head>
<body>
  <a href="#main" class="sr-only">Skip to main content</a>
  <main id="main">
    <h1>Welcome</h1>
    <img src="logo.png" alt="A11ai Logo">
    <form>
      <label for="username">Username</label>
      <input type="text" id="username" autocomplete="username">
      <button type="submit">Submit</button>
    </form>
  </main>
</body>
</html>`;
    const { score, issues } = scanHtml(html);
    assert.equal(score, 100);
    assert.equal(issues.length, 0);
  });
});
