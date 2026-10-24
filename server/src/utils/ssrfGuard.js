import dns from 'dns/promises';
import { URL } from 'url';
import net from 'net';
import { env } from '../config/env.js';

// Convert dotted IPv4 to 32-bit unsigned integer
function ipv4ToLong(ip) {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// Check if IPv4 falls within a CIDR range
function inIPv4Range(ipLong, cidrStart, maskBits) {
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipLong & mask) === (cidrStart & mask);
}

const BLOCKED_IPV4_RANGES = [
  { cidr: '0.0.0.0', mask: 8 },      // Current network (RFC 1122)
  { cidr: '10.0.0.0', mask: 8 },     // Private (RFC 1918)
  { cidr: '100.64.0.0', mask: 10 },  // Shared / Carrier NAT (RFC 6598)
  { cidr: '127.0.0.0', mask: 8 },    // Loopback (RFC 1122)
  { cidr: '169.254.0.0', mask: 16 }, // Link-local / Cloud metadata (RFC 3927)
  { cidr: '172.16.0.0', mask: 12 },  // Private (RFC 1918)
  { cidr: '192.168.0.0', mask: 16 }, // Private (RFC 1918)
  { cidr: '198.18.0.0', mask: 15 },  // Benchmarking (RFC 2544)
  { cidr: '224.0.0.0', mask: 4 },    // Multicast (RFC 5771)
  { cidr: '240.0.0.0', mask: 4 },    // Reserved (RFC 1112)
].map(({ cidr, mask }) => ({ start: ipv4ToLong(cidr), mask }));

export function isPrivateIPv4(ip) {
  if (!net.isIPv4(ip)) return false;
  const ipLong = ipv4ToLong(ip);
  return BLOCKED_IPV4_RANGES.some(({ start, mask }) => inIPv4Range(ipLong, start, mask));
}

export function isPrivateIPv6(ip) {
  if (!net.isIPv6(ip)) return false;
  const normalized = ip.toLowerCase();

  // Unspecified & loopback
  if (normalized === '::' || normalized === '::1' || normalized === '0:0:0:0:0:0:0:0' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
    return true;
  }

  // Unique local addresses (fc00::/7) -> fc or fd
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) {
    return true;
  }

  // Link-local addresses (fe80::/10) -> fe8, fe9, fea, feb
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Validates a target URL against SSRF rules.
 * @param {string} urlString - Target URL to validate
 * @returns {Promise<{ safe: boolean, isInternalMock: boolean, resolvedIPs: string[] }>}
 */
export async function validateDestination(urlString) {
  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (err) {
    const error = new Error('Invalid URL format');
    error.statusCode = 400;
    throw error;
  }

  // 1. Protocol check
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    const error = new Error(`Unsupported protocol '${parsedUrl.protocol}'. Only http: and https: are allowed.`);
    error.statusCode = 400;
    throw error;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (parsedUrl.protocol === 'https:' ? 443 : 80);
  const serverPort = parseInt(env.PORT || 5000, 10);

  // 2. Gated internal mock target exception
  const isLoopbackHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (isLoopbackHost) {
    const isMockTargetAllowed =
      env.NODE_ENV !== 'production' &&
      env.ENABLE_INTERNAL_MOCK_TARGET === 'true';

    const isInternalMockPath = parsedUrl.pathname.startsWith('/api/v1/mock/shopkart');
    const isSamePort = port === serverPort;

    if (isMockTargetAllowed && isInternalMockPath && isSamePort) {
      return { safe: true, isInternalMock: true, resolvedIPs: ['127.0.0.1'] };
    }

    const error = new Error(
      'SSRF Protection: Access to loopback/internal hosts is blocked. Mock targets are only accessible on the server port at /api/v1/mock/shopkart/ in development mode.'
    );
    error.statusCode = 403;
    throw error;
  }

  // 3. Reject literal IPs if private
  if (net.isIP(hostname)) {
    if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
      const error = new Error(`SSRF Protection: Requests to private or reserved IP address '${hostname}' are blocked.`);
      error.statusCode = 403;
      throw error;
    }
    return { safe: true, isInternalMock: false, resolvedIPs: [hostname] };
  }

  // 4. DNS resolution validation
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch (dnsErr) {
    const error = new Error(`DNS resolution failed for host '${hostname}': ${dnsErr.message}`);
    error.statusCode = 502;
    throw error;
  }

  if (!addresses || addresses.length === 0) {
    const error = new Error(`No IP addresses found for host '${hostname}'`);
    error.statusCode = 502;
    throw error;
  }

  const resolvedIPs = addresses.map((a) => a.address);
  for (const ip of resolvedIPs) {
    if (isPrivateIPv4(ip) || isPrivateIPv6(ip)) {
      const error = new Error(
        `SSRF Protection: Host '${hostname}' resolved to private or reserved IP '${ip}'. Request blocked.`
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return { safe: true, isInternalMock: false, resolvedIPs };
}
