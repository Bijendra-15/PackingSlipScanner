import CryptoJS from 'crypto-js'

const SECRET_PASSPHRASE = 'Secret Passphrase'

/**
 * Encrypts a value using AES with a fixed passphrase.
 * Mirrors the original `encrypted()` helper.
 */
export function encrypted(val: string): string {
  return CryptoJS.AES.encrypt(val, SECRET_PASSPHRASE).toString()
}

/**
 * Decrypts an AES-encrypted value back to a UTF-8 string.
 * Mirrors the original `dencrypted()` helper.
 */
export function dencrypted(val: string | null): string {
  if (!val) return ''
  const bytes = CryptoJS.AES.decrypt(val, SECRET_PASSPHRASE)
  return bytes.toString(CryptoJS.enc.Utf8)
}

/**
 * The base API domain, stored encrypted in sessionStorage just like the
 * original application so the value is not visible in plain text.
 */
export const API_DOMAIN = encrypted('http://localhost:5181/')