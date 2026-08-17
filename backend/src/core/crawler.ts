import * as cheerio from 'cheerio';
import { safeFetch } from './safe-fetch';
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
  // safeFetch, not fetch: crawl targets are user-supplied, so the address has to
  // be validated against private and link-local ranges — including on every
  // redirect hop — before any request goes out.
  const html = await safeFetch(url, {
    userAgent: 'Mozilla/5.0 (compatible; MarketingOSBot/1.0)',
  });
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
