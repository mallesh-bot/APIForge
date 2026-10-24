import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Encrypts plaintext string using AES-256-GCM.
 * @param {string} plaintext - Content to encrypt
 * @param {string} keyHex - 64-character hex string representing a 32-byte key
 * @returns {string} Serialized string format: "ivHex:authTagHex:ciphertextHex"
 */
export function encrypt(plaintext, keyHex) {
  if (!plaintext) return '';
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('Encryption key must be a 64-character hex string (32 bytes)');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts serialized AES-256-GCM ciphertext.
 * @param {string} serializedCiphertext - Format: "ivHex:authTagHex:ciphertextHex"
 * @param {string} keyHex - 64-character hex string representing a 32-byte key
 * @returns {string} Decrypted plaintext string
 */
export function decrypt(serializedCiphertext, keyHex) {
  if (!serializedCiphertext) return '';
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('Encryption key must be a 64-character hex string (32 bytes)');
  }

  const parts = serializedCiphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, tagHex, encHex] = parts;
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
