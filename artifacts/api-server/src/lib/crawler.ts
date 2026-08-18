import * as cheerio from "cheerio";
import { scanHtml } from "./wcag-scanner";
import type { ScanIssue } from "@workspace/db";
import { validateScanUrl } from "./url-validator";

const MAX_PAGES = 12;
const FETCH_TIMEOUT_MS = 10_000;

export interface CrawledPage {
  url: string;
  score: number;
  issueCount: number;
  result: { issues: ScanIssue[] };
}

function normUrl(href: string): string {
  try {
    const u = new URL(href);
    u.hash = "";
    u.search = "";
    return u.href.replace(/\/$/, "") || "/";
  } catch {
    return href;
  }
}

export async function crawlSite(
  rootUrl: string,
  onPage: (page: CrawledPage, scanned: number) => void,
): Promise<CrawledPage[]> {
  const base = new URL(rootUrl.startsWith("http") ? rootUrl : `https://${rootUrl}`);
  const baseNorm = normUrl(base.href);

  const visited = new Set<string>();
  const queue: string[] = [baseNorm];
  const results: CrawledPage[] = [];

  while (queue.length > 0 && results.length < MAX_PAGES) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "A11ai-Scanner/1.0 (accessibility audit bot)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: "follow",
      });

      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("html")) continue;

      const html = await res.text();
      const scanResult = scanHtml(html);

      const page: CrawledPage = {
        url,
        score: scanResult.score,
        issueCount: scanResult.issues.length,
        result: { issues: scanResult.issues },
      };
      results.push(page);
      onPage(page, results.length);

      if (results.length < MAX_PAGES) {
        const $ = cheerio.load(html);
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href") ?? "";
          try {
            const resolved = new URL(href, url);
            if (
              resolved.hostname === base.hostname &&
              resolved.protocol.startsWith("http")
            ) {
              const norm = normUrl(resolved.href);
              if (!visited.has(norm) && !queue.includes(norm)) {
                queue.push(norm);
              }
            }
          } catch {
          }
        });
      }
    } catch {
    }
  }

  return results;
}
