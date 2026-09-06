import { describe, expect, test } from 'vitest';
import { assertSafePublicUrl } from '@/lib/url-safety';

describe('assertSafePublicUrl', () => {
  test.each([
    'http://localhost:4100',
    'http://127.0.0.1:4100',
    'http://169.254.169.254/latest/meta-data',
    'http://10.0.0.1',
    'http://[::1]/',
  ])('rejects private target %s', async (url) => {
    await expect(assertSafePublicUrl(url)).rejects.toThrow();
  });

  test('accepts a public IP URL', async () => {
    await expect(assertSafePublicUrl('https://93.184.216.34/')).resolves.toBeInstanceOf(URL);
  });

  test('rejects embedded credentials', async () => {
    await expect(assertSafePublicUrl('https://user:pass@example.com/')).rejects.toThrow();
  });
});
