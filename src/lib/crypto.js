import CryptoJS from 'crypto-js'

const SALT = 'smart2fa-oxid-v1-salt'

// Derive a 256-bit key from the PIN using PBKDF2
function deriveKey(pin) {
  return CryptoJS.PBKDF2(String(pin), SALT, {
    keySize: 256 / 32,
    iterations: 25_000,
    hasher: CryptoJS.algo.SHA256,
  })
}

export function encryptJSON(obj, pin) {
  const key = deriveKey(pin)
  const iv = CryptoJS.lib.WordArray.random(16)
  const data = CryptoJS.enc.Utf8.parse(JSON.stringify(obj))
  const cipher = CryptoJS.AES.encrypt(data, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return JSON.stringify({
    v: 1,
    iv: CryptoJS.enc.Hex.stringify(iv),
    ct: cipher.ciphertext.toString(CryptoJS.enc.Base64),
  })
}

export function decryptJSON(payload, pin) {
  const { iv, ct } = JSON.parse(payload)
  const key = deriveKey(pin)
  const ivWA = CryptoJS.enc.Hex.parse(iv)
  const ctWA = CryptoJS.enc.Base64.parse(ct)
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: ctWA },
    key,
    { iv: ivWA, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  )
  const text = decrypted.toString(CryptoJS.enc.Utf8)
  if (!text) throw new Error('Invalid PIN or corrupted data')
  return JSON.parse(text)
}

// Hash PIN for verification (not for key — different salt)
export function hashPin(pin) {
  return CryptoJS.PBKDF2(String(pin), SALT + '-verify', {
    keySize: 256 / 32,
    iterations: 25_000,
    hasher: CryptoJS.algo.SHA256,
  }).toString(CryptoJS.enc.Hex)
}
