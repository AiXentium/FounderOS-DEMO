import dns from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'instance-data.ec2.internal',
]);

function ipv4IsPrivate(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 ||
    a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 ||
    a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19) ||
    a >= 224;
}

function ipIsPrivate(address: string, family: number): boolean {
  if (family === 4) return ipv4IsPrivate(address);
  const normalized = address.toLowerCase();
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
    normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:127.') || normalized.startsWith('::ffff:192.168.') ||
    normalized.startsWith('::ffff:172.');
}

/** Validate a user-supplied URL before the server makes an outbound request. */
export async function assertSafePublicUrl(input: string): Promise<URL> {
  const target = new URL(input);
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('only http and https URLs are supported');
  if (target.username || target.password) throw new Error('URLs with embedded credentials are not supported');

  const hostname = target.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new Error('private or internal hosts are not allowed');
  }

  const family = net.isIP(hostname);
  if (family && ipIsPrivate(hostname, family)) throw new Error('private or non-routable addresses are not allowed');
  if (!family) {
    const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((entry) => ipIsPrivate(entry.address, entry.family))) {
      throw new Error('hostname resolves to a private or non-routable address');
    }
  }
  return target;
}
