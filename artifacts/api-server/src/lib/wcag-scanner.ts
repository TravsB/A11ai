import * as cheerio from "cheerio";
import type { ScanIssue, ScanResult } from "@workspace/db";

interface CheckResult {
  count: number;
  elementSnippet?: string;
}

const VALID_ARIA_ROLES = new Set([
  "alert", "alertdialog", "application", "article", "banner", "button", "cell",
  "checkbox", "columnheader", "combobox", "complementary", "contentinfo",
  "definition", "dialog", "directory", "document", "feed", "figure", "form",
  "grid", "gridcell", "group", "heading", "img", "link", "list", "listbox",
  "listitem", "log", "main", "marquee", "math", "menu", "menubar", "menuitem",
  "menuitemcheckbox", "menuitemradio", "navigation", "none", "note", "option",
  "presentation", "progressbar", "radio", "radiogroup", "region", "row",
  "rowgroup", "rowheader", "scrollbar", "search", "searchbox", "separator",
  "slider", "spinbutton", "status", "switch", "tab", "table", "tablist",
  "tabpanel", "term", "textbox", "timer", "toolbar", "tooltip", "tree",
  "treegrid", "treeitem"
]);

function getSnippet($el: any): string {
  const tagStr = cheerio.load($el.toArray()[0] ?? "").html() || "";
  return tagStr.length > 120 ? tagStr.slice(0, 120) + "..." : tagStr;
}

function checkImagesAlt($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkRedundantAlt($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  const redundant = /^(image of|picture of|photo of|graphic of)/i;
  $("img[alt]").each((_, el) => {
    const alt = $(el).attr("alt") ?? "";
    if (redundant.test(alt.trim())) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkPageTitle($: cheerio.CheerioAPI): CheckResult {
  const title = $("title").first().text().trim();
  const missing = title.length === 0;
  return {
    count: missing ? 1 : 0,
    elementSnippet: missing ? "<head><title></title></head>" : undefined,
  };
}

function checkLangAttribute($: cheerio.CheerioAPI): CheckResult {
  const lang = $("html").attr("lang");
  const missing = !lang || lang.trim() === "";
  return {
    count: missing ? 1 : 0,
    elementSnippet: missing ? "<html>" : undefined,
  };
}

function checkEmptyLinks($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("a").each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const hasAriaLabel = $el.attr("aria-label") || $el.attr("aria-labelledby");
    const hasImg = $el.find("img[alt]").length > 0;
    if (!text && !hasAriaLabel && !hasImg) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkEmptyButtons($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("button").each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const hasAriaLabel = $el.attr("aria-label") || $el.attr("aria-labelledby");
    if (!text && !hasAriaLabel) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkInputLabels($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset'])").each((_, el) => {
    const $el = $(el);
    const id = $el.attr("id");
    const hasAriaLabel = $el.attr("aria-label") || $el.attr("aria-labelledby");
    const hasTitle = $el.attr("title");
    const hasAssociatedLabel = id && $(`label[for="${id}"]`).length > 0;
    const isWrappedInLabel = $el.closest("label").length > 0;
    if (!hasAriaLabel && !hasTitle && !hasAssociatedLabel && !isWrappedInLabel) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkHeadingHierarchy($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let lastLevel = 0;
  let elementSnippet: string | undefined;
  $("h1,h2,h3,h4,h5,h6").each((_, el) => {
    const level = parseInt(el.tagName.replace("h", ""), 10);
    if (lastLevel > 0 && level > lastLevel + 1) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
    lastLevel = level;
  });
  return { count, elementSnippet };
}

function checkMultipleH1($: cheerio.CheerioAPI): CheckResult {
  const h1s = $("h1");
  const count = h1s.length;
  return {
    count: count > 1 ? count - 1 : 0,
    elementSnippet: count > 1 ? $.html(h1s.get(1)!) : undefined,
  };
}

function checkNewTabLinks($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("a[target='_blank']").each((_, el) => {
    const $el = $(el);
    const ariaLabel = $el.attr("aria-label") ?? "";
    const title = $el.attr("title") ?? "";
    const text = $el.text();
    const warns = /new (tab|window)/i;
    if (!warns.test(ariaLabel) && !warns.test(title) && !warns.test(text)) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkSkipLink($: cheerio.CheerioAPI): CheckResult {
  const hasSkip =
    $("a[href^='#']").filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes("skip") || text.includes("jump");
    }).length > 0;
  return {
    count: hasSkip ? 0 : 1,
    elementSnippet: hasSkip ? undefined : "<body><!-- Missing skip link at top of body --></body>",
  };
}

function checkSelectLabels($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("select").each((_, el) => {
    const $el = $(el);
    const id = $el.attr("id");
    const hasAriaLabel = $el.attr("aria-label") || $el.attr("aria-labelledby");
    const hasAssociatedLabel = id && $(`label[for="${id}"]`).length > 0;
    const isWrappedInLabel = $el.closest("label").length > 0;
    if (!hasAriaLabel && !hasAssociatedLabel && !isWrappedInLabel) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkTextareaLabels($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("textarea").each((_, el) => {
    const $el = $(el);
    const id = $el.attr("id");
    const hasAriaLabel = $el.attr("aria-label") || $el.attr("aria-labelledby");
    const hasAssociatedLabel = id && $(`label[for="${id}"]`).length > 0;
    const isWrappedInLabel = $el.closest("label").length > 0;
    if (!hasAriaLabel && !hasAssociatedLabel && !isWrappedInLabel) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkAriaRoles($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("[role]").each((_, el) => {
    const role = $(el).attr("role")?.trim().toLowerCase() ?? "";
    if (role && !VALID_ARIA_ROLES.has(role)) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkIframeTitle($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("iframe").each((_, el) => {
    const title = $(el).attr("title")?.trim();
    if (!title) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkDuplicateIds($: cheerio.CheerioAPI): CheckResult {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  let elementSnippet: string | undefined;

  $("[id]").each((_, el) => {
    const id = $(el).attr("id")?.trim();
    if (id) {
      if (seen.has(id)) {
        duplicates.add(id);
        if (!elementSnippet) elementSnippet = $.html(el);
      } else {
        seen.add(id);
      }
    }
  });
  return { count: duplicates.size, elementSnippet };
}

function checkTableHeaders($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("table").each((_, el) => {
    const $table = $(el);
    const hasTh = $table.find("th").length > 0;
    const isPresentation = $table.attr("role") === "presentation" || $table.attr("role") === "none";
    if (!hasTh && !isPresentation) {
      count++;
      if (!elementSnippet) elementSnippet = $.html(el);
    }
  });
  return { count, elementSnippet };
}

function checkInputAutocomplete($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  const sensitiveTypes = ["text", "email", "password", "tel"];
  $("input").each((_, el) => {
    const $el = $(el);
    const type = ($el.attr("type") || "text").toLowerCase();
    const name = ($el.attr("name") || $el.attr("id") || "").toLowerCase();
    const hasAuto = $el.attr("autocomplete");
    if (sensitiveTypes.includes(type) && (name.includes("email") || name.includes("pass") || name.includes("phone"))) {
      if (!hasAuto) {
        count++;
        if (!elementSnippet) elementSnippet = $.html(el);
      }
    }
  });
  return { count, elementSnippet };
}

function checkTargetSize($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("a, button").each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text.length === 1 && !/\w{2,}/.test(text)) {
      const aria = $el.attr("aria-label");
      if (!aria) {
        count++;
        if (!elementSnippet) elementSnippet = $.html(el);
      }
    }
  });
  return { count, elementSnippet };
}

function checkFocusIndicator($: cheerio.CheerioAPI): CheckResult {
  let count = 0;
  let elementSnippet: string | undefined;
  $("[style]").each((_, el) => {
    const style = $(el).attr("style")?.toLowerCase() ?? "";
    if (style.includes("outline:none") || style.includes("outline: 0") || style.includes("outline:none")) {
      if (!style.includes("box-shadow") && !style.includes("border")) {
        count++;
        if (!elementSnippet) elementSnippet = $.html(el);
      }
    }
  });
  return { count, elementSnippet };
}

function calculateScore(issues: ScanIssue[]): number {
  const weights: Record<ScanIssue["severity"], number> = {
    critical: 15,
    high: 8,
    medium: 4,
    low: 1,
  };
  const deduction = issues.reduce((sum, issue) => {
    return sum + Math.min(issue.count, 5) * weights[issue.severity];
  }, 0);
  return Math.max(0, Math.min(100, 100 - deduction));
}

const CHECKS: Array<{
  fn: ($: cheerio.CheerioAPI) => CheckResult;
  id: string;
  severity: ScanIssue["severity"];
  wcag: string;
  title: string;
  description: (n: number) => string;
  remediation: string;
}> = [
  {
    fn: checkImagesAlt,
    id: "img-alt",
    severity: "critical",
    wcag: "1.1.1",
    title: "Images missing alt text",
    description: (n) => `${n} image(s) have no alt attribute — screen readers cannot describe them.`,
    remediation: '<img src="hero.jpg" alt="A team collaborating around a table"> (or alt="" if decorative).',
  },
  {
    fn: checkPageTitle,
    id: "page-title",
    severity: "critical",
    wcag: "2.4.2",
    title: "Page missing title",
    description: () => "The <title> element is empty or absent — essential for screen reader navigation.",
    remediation: "Add a descriptive <title> in <head>: <title>Dashboard | A11ai Platform</title>",
  },
  {
    fn: checkLangAttribute,
    id: "html-lang",
    severity: "critical",
    wcag: "3.1.1",
    title: "HTML element missing lang attribute",
    description: () => "The <html> element has no lang attribute — assistive technology cannot determine language.",
    remediation: 'Specify the primary document language: <html lang="en">',
  },
  {
    fn: checkInputLabels,
    id: "input-label",
    severity: "critical",
    wcag: "1.3.1",
    title: "Form inputs without labels",
    description: (n) => `${n} input(s) have no associated label — screen reader users cannot identify the field.`,
    remediation: '<label for="user-email">Email Address</label><input id="user-email" type="email" />',
  },
  {
    fn: checkAriaRoles,
    id: "aria-valid-roles",
    severity: "critical",
    wcag: "4.1.2",
    title: "Invalid ARIA role attributes",
    description: (n) => `${n} element(s) contain invalid or misspelled ARIA role values.`,
    remediation: 'Use standard WAI-ARIA roles (e.g. role="navigation", role="dialog", role="tab").',
  },
  {
    fn: checkEmptyLinks,
    id: "empty-link",
    severity: "high",
    wcag: "2.4.4",
    title: "Links with no accessible text",
    description: (n) => `${n} link(s) have no text, aria-label, or labelled image — purpose is unknown.`,
    remediation: '<a href="/settings" aria-label="Account Settings"><svg>...</svg></a>',
  },
  {
    fn: checkEmptyButtons,
    id: "empty-button",
    severity: "high",
    wcag: "4.1.2",
    title: "Buttons with no accessible text",
    description: (n) => `${n} button(s) have no text or aria-label — purpose cannot be determined.`,
    remediation: '<button type="button" aria-label="Close dialog"><svg>...</svg></button>',
  },
  {
    fn: checkSelectLabels,
    id: "select-label",
    severity: "high",
    wcag: "1.3.1",
    title: "Select elements without labels",
    description: (n) => `${n} <select> element(s) have no associated label.`,
    remediation: '<label for="country">Select Country</label><select id="country">...</select>',
  },
  {
    fn: checkTextareaLabels,
    id: "textarea-label",
    severity: "high",
    wcag: "1.3.1",
    title: "Textareas without labels",
    description: (n) => `${n} <textarea> element(s) have no associated label.`,
    remediation: '<label for="comments">Comments</label><textarea id="comments"></textarea>',
  },
  {
    fn: checkIframeTitle,
    id: "iframe-title",
    severity: "high",
    wcag: "4.1.2",
    title: "Iframe missing title attribute",
    description: (n) => `${n} <iframe> element(s) have no title attribute — screen readers cannot announce frame purpose.`,
    remediation: '<iframe src="widget.html" title="Interactive Financial Calculator"></iframe>',
  },
  {
    fn: checkDuplicateIds,
    id: "duplicate-id",
    severity: "high",
    wcag: "4.1.1",
    title: "Duplicate element IDs",
    description: (n) => `${n} duplicate ID value(s) detected — breaks ARIA element referencing and label pairing.`,
    remediation: "Ensure all HTML `id` attributes are unique across the document.",
  },
  {
    fn: checkHeadingHierarchy,
    id: "heading-order",
    severity: "medium",
    wcag: "1.3.1",
    title: "Heading hierarchy skips levels",
    description: (n) => `${n} heading(s) skip levels (e.g. h2 → h4) — breaks document structure for screen readers.`,
    remediation: "Use sequential heading tags (h1 → h2 → h3) without skipping levels.",
  },
  {
    fn: checkMultipleH1,
    id: "multiple-h1",
    severity: "medium",
    wcag: "1.3.1",
    title: "Multiple h1 elements",
    description: (n) => `Page contains ${n + 1} h1 elements — only one main heading is recommended.`,
    remediation: "Use a single main <h1> heading per page, and use <h2> for major sections.",
  },
  {
    fn: checkNewTabLinks,
    id: "new-tab-links",
    severity: "medium",
    wcag: "3.2.2",
    title: "Links open new tab without warning",
    description: (n) => `${n} link(s) open in a new tab/window without notifying the user.`,
    remediation: '<a href="pdf.pdf" target="_blank" aria-label="Download Guide (opens in new tab)">Download Guide</a>',
  },
  {
    fn: checkSkipLink,
    id: "skip-link",
    severity: "medium",
    wcag: "2.4.1",
    title: "No skip navigation link",
    description: () => "Page has no skip link — keyboard users must tab through all navigation to reach main content.",
    remediation: '<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>',
  },
  {
    fn: checkTableHeaders,
    id: "table-headers",
    severity: "medium",
    wcag: "1.3.1",
    title: "Data table missing header elements",
    description: (n) => `${n} data table(s) lack <th> header cells.`,
    remediation: 'Use <thead><tr><th scope="col">Name</th></tr></thead> inside data tables.',
  },
  {
    fn: checkInputAutocomplete,
    id: "input-autocomplete",
    severity: "medium",
    wcag: "1.3.5",
    title: "Form input missing autocomplete attribute",
    description: (n) => `${n} user field(s) lack explicit autocomplete hints for password managers & assistive tech.`,
    remediation: '<input type="email" autocomplete="email" /> or autocomplete="current-password"',
  },
  {
    fn: checkTargetSize,
    id: "target-size",
    severity: "low",
    wcag: "2.5.5",
    title: "Interactive target size warning",
    description: (n) => `${n} single-character link/button(s) may lack minimum 24x24px tap target size.`,
    remediation: 'Add sufficient padding or explicit `min-w-[44px] min-h-[44px]` touch targets.',
  },
  {
    fn: checkFocusIndicator,
    id: "focus-indicator",
    severity: "low",
    wcag: "2.4.7",
    title: "Focus outline removed without replacement",
    description: (n) => `${n} element(s) disable default browser focus outline without adding a custom focus state.`,
    remediation: 'Add focus styling: `focus-visible:ring-2 focus-visible:ring-primary focus:outline-none`.',
  },
  {
    fn: checkRedundantAlt,
    id: "redundant-alt",
    severity: "low",
    wcag: "1.1.1",
    title: "Redundant alt text",
    description: (n) => `${n} image(s) use redundant phrases like "image of" or "picture of" in their alt text.`,
    remediation: 'Remove "image of" or "photo of" prefixes. Describe what the image conveys directly.',
  },
];

export function scanHtml(html: string): { issues: ScanIssue[]; score: number } {
  const $ = cheerio.load(html);
  const issues: ScanIssue[] = [];

  for (const check of CHECKS) {
    const { count, elementSnippet } = check.fn($);
    if (count > 0) {
      issues.push({
        id: check.id,
        severity: check.severity,
        wcag: check.wcag,
        title: check.title,
        description: check.description(count),
        count,
        remediation: check.remediation,
        elementSnippet: elementSnippet,
      });
    }
  }

  const score = calculateScore(issues);
  return { issues, score };
}

export async function scanUrl(rawUrl: string): Promise<ScanResult & { score: number }> {
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "A11ai-Scanner/1.0 (accessibility audit bot)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html")) {
    throw new Error(`URL did not return HTML (got ${contentType})`);
  }

  const html = await response.text();
  return scanHtml(html);
}
