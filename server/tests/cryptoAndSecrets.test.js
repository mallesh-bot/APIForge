import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../src/utils/crypto.js';
import { env } from '../src/config/env.js';

describe('AES-256-GCM Cryptographic Protection', () => {
  const secretText = 'super_secret_api_key_12345';
  const key = env.ENCRYPTION_KEY;

  it('should encrypt and decrypt plaintext reliably', () => {
    const ciphertext = encrypt(secretText, key);
    expect(ciphertext).not.toBe(secretText);
    expect(ciphertext.split(':')).toHaveLength(3); // iv:tag:content

    const decrypted = decrypt(ciphertext, key);
    expect(decrypted).toBe(secretText);
  });

  it('should use a unique IV for each encryption call', () => {
    const enc1 = encrypt(secretText, key);
    const enc2 = encrypt(secretText, key);

    const [iv1] = enc1.split(':');
    const [iv2] = enc2.split(':');

    expect(iv1).not.toBe(iv2);
    expect(enc1).not.toBe(enc2);

    expect(decrypt(enc1, key)).toBe(secretText);
    expect(decrypt(enc2, key)).toBe(secretText);
  });

  it('should fail decryption if auth tag or ciphertext is tampered with', () => {
    const ciphertext = encrypt(secretText, key);
    const [iv, tag, enc] = ciphertext.split(':');

    // Tamper with ciphertext by altering last byte
    const tamperedEnc = enc.slice(0, -2) + (enc.slice(-2) === 'aa' ? 'bb' : 'aa');
    const tampered = `${iv}:${tag}:${tamperedEnc}`;

    expect(() => decrypt(tampered, key)).toThrow();
  });

  it('should fail decryption if auth tag is modified', () => {
    const ciphertext = encrypt(secretText, key);
    const [iv, tag, enc] = ciphertext.split(':');

    const tamperedTag = tag.slice(0, -2) + (tag.slice(-2) === '00' ? '11' : '00');
    const tampered = `${iv}:${tamperedTag}:${enc}`;

    expect(() => decrypt(tampered, key)).toThrow();
  });
});
