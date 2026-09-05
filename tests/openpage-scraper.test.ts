import { describe, expect, test } from 'vitest';
import { scrapeWebsite } from '@/lib/openpage-scraper';

describe('OpenPage website scanner', () => {
  test('rejects local and private URLs before making a request', async () => {
    await expect(scrapeWebsite('http://127.0.0.1:4100/')).rejects.toThrow(/public HTTP|private|local/i);
    await expect(scrapeWebsite('http://localhost/')).rejects.toThrow(/public HTTP|private|local/i);
  });
});
