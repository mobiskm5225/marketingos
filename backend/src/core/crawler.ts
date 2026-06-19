import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  h3: string[];
  bodyText: string;
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  imageAlts: string[];
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AcefoneBot/1.0)' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract SEO metadata
  const title = $('title').first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ??
    $('meta[property="og:description"]').attr('content')?.trim() ?? '';

  const h1 = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h3 = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean);

  // Classify links
  const domain = new URL(url).hostname;
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    try {
      const resolved = new URL(href, url);
      if (resolved.hostname === domain) {
        internalLinks.push(resolved.href);
      } else if (resolved.protocol.startsWith('http')) {
        externalLinks.push(resolved.href);
      }
    } catch { /* skip malformed */ }
  });

  // Image alt texts
  const imageAlts = $('img')
    .map((_, el) => $(el).attr('alt')?.trim() ?? '')
    .get()
    .filter(Boolean);

  // Clean article text via Readability
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  const bodyText = article?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

  return {
    url,
    title,
    metaDescription,
    h1,
    h2,
    h3,
    bodyText,
    wordCount,
    internalLinks: [...new Set(internalLinks)],
    externalLinks: [...new Set(externalLinks)],
    imageAlts,
  };
}
