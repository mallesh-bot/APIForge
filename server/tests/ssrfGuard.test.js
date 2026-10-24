import { describe, it, expect } from 'vitest';
import { validateDestination, isPrivateIPv4, isPrivateIPv6 } from '../src/utils/ssrfGuard.js';
import { env } from '../src/config/env.js';

describe('SSRF Protection Guard', () => {
  it('should detect private IPv4 ranges accurately', () => {
    expect(isPrivateIPv4('127.0.0.1')).toBe(true);
    expect(isPrivateIPv4('10.0.0.1')).toBe(true);
    expect(isPrivateIPv4('172.16.0.1')).toBe(true);
    expect(isPrivateIPv4('192.168.1.1')).toBe(true);
    expect(isPrivateIPv4('169.254.169.254')).toBe(true); // Cloud metadata
    expect(isPrivateIPv4('0.0.0.0')).toBe(true);

    // Public IPs should not be marked private
    expect(isPrivateIPv4('8.8.8.8')).toBe(false);
    expect(isPrivateIPv4('1.1.1.1')).toBe(false);
    expect(isPrivateIPv4('93.184.216.34')).toBe(false);
  });

  it('should detect private IPv6 ranges accurately', () => {
    expect(isPrivateIPv6('::1')).toBe(true);
    expect(isPrivateIPv6('::')).toBe(true);
    expect(isPrivateIPv6('fe80::1')).toBe(true);
    expect(isPrivateIPv6('fc00::1')).toBe(true);
    expect(isPrivateIPv6('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateIPv6('::ffff:192.168.0.1')).toBe(true);
  });

  it('should reject non-HTTP/HTTPS protocols', async () => {
    await expect(validateDestination('file:///etc/passwd')).rejects.toThrow('Unsupported protocol');
    await expect(validateDestination('ftp://example.com')).rejects.toThrow('Unsupported protocol');
    await expect(validateDestination('javascript:alert(1)')).rejects.toThrow();
  });

  it('should block cloud metadata IP (169.254.169.254)', async () => {
    await expect(validateDestination('http://169.254.169.254/latest/meta-data')).rejects.toThrow(
      /SSRF Protection/
    );
  });

  it('should block arbitrary loopback ports', async () => {
    await expect(validateDestination('http://127.0.0.1:8080/admin')).rejects.toThrow(
      /SSRF Protection/
    );
    await expect(validateDestination('http://localhost:3000/')).rejects.toThrow(
      /SSRF Protection/
    );
  });

  it('should block arbitrary loopback paths on server port', async () => {
    const serverPort = env.PORT || 5000;
    // Calling internal API endpoints like auth/me or collections via outbound executor is blocked
    await expect(validateDestination(`http://127.0.0.1:${serverPort}/api/v1/auth/me`)).rejects.toThrow(
      /SSRF Protection/
    );
  });

  it('should allow internal mock endpoint on server port in development mode', async () => {
    const serverPort = env.PORT || 5000;
    const res = await validateDestination(
      `http://127.0.0.1:${serverPort}/api/v1/mock/shopkart/products`
    );
    expect(res.safe).toBe(true);
    expect(res.isInternalMock).toBe(true);
  });
});
