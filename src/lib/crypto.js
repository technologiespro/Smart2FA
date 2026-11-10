const SALT = 'smart2fa-oxid-v1-salt'

function hexToBytes(hex) {
  const clean = hex.trim()
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i)
  }
  return bytes
}

function bytesToBase64(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i])
  }
  return btoa(bin)
}

// Derive a 256-bit AES key from PIN using PBKDF2
async function deriveAesKey(pin, algorithm = 'AES-GCM') {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(pin)),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT),
      iterations: 25_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: algorithm, length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Modern format v:2 (AES-GCM)
export async function encryptJSON(obj, pin) {
  const key = await deriveAesKey(pin, 'AES-GCM')
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(JSON.stringify(obj))

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return JSON.stringify({
    v: 2,
    iv: bytesToHex(iv),
    ct: bytesToBase64(new Uint8Array(ciphertextBuffer)),
  })
}

// Decrypt with support for legacy v:1 (AES-CBC) and current v:2 (AES-GCM)
export async function decryptJSON(payloadStr, pin) {
  let payload
  try {
    payload = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr
  } catch (e) {
    throw new Error('Invalid PIN or corrupted data')
  }

  if (!payload || typeof payload !== 'object' || !payload.iv || !payload.ct) {
    throw new Error('Invalid PIN or corrupted data')
  }

  const version = payload.v || 1

  try {
    if (version === 2) {
      // Current format: AES-GCM (12-byte IV)
      const key = await deriveAesKey(pin, 'AES-GCM')
      const iv = hexToBytes(payload.iv)
      const ct = base64ToBytes(payload.ct)

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ct
      )
      const text = new TextDecoder().decode(decrypted)
      return JSON.parse(text)
    } else {
      // Legacy format: AES-CBC (16-byte IV) for backward compatibility
      const key = await deriveAesKey(pin, 'AES-CBC')
      const iv = hexToBytes(payload.iv)
      const ct = base64ToBytes(payload.ct)

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        key,
        ct
      )
      const text = new TextDecoder().decode(decrypted)
      return JSON.parse(text)
    }
  } catch (e) {
    throw new Error('Invalid PIN or corrupted data')
  }
}

// Hash PIN for verification (PBKDF2-HMAC-SHA256 with distinct salt - exact match with legacy hash)
export async function hashPin(pin) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(pin)),
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT + '-verify'),
      iterations: 25_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )

  return bytesToHex(new Uint8Array(bits))
}
