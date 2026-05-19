// WebAuthn helpers for client-side biometric unlock.
// Uses the PRF extension to derive a stable 32-byte secret per credential,
// which we use as an AES key to wrap the user's PIN locally.
//
// No server, no API calls. Everything stays in this browser.

const KEYS = {
  credentialId: 'oxid:wa:credId',
  userHandle:   'oxid:wa:userHandle',
  prfSalt:      'oxid:wa:prfSalt',
  wrappedPin:   'oxid:wa:wrappedPin',
}

// ---------- utils ----------

function randomBytes(len) {
  const a = new Uint8Array(len)
  crypto.getRandomValues(a)
  return a
}

function b64uEncode(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64uDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const bin = atob(str)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function getRpId() {
  // Use the hostname. Works on localhost and on real domains.
  return window.location.hostname
}

// AES-GCM via SubtleCrypto using a 32-byte secret as key material
async function importAesKey(rawBytes) {
  return crypto.subtle.importKey(
    'raw',
    rawBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

async function aesEncrypt(rawKeyBytes, plaintextString) {
  const iv = randomBytes(12)
  const key = await importAesKey(rawKeyBytes)
  const enc = new TextEncoder().encode(plaintextString)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc)
  return { iv: b64uEncode(iv), ct: b64uEncode(new Uint8Array(ct)) }
}

async function aesDecrypt(rawKeyBytes, payload) {
  const iv = b64uDecode(payload.iv)
  const ct = b64uDecode(payload.ct)
  const key = await importAesKey(rawKeyBytes)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}

// ---------- public API ----------

export function isWebAuthnSupported() {
  return typeof window !== 'undefined'
    && !!window.PublicKeyCredential
    && typeof navigator.credentials?.create === 'function'
    && typeof navigator.credentials?.get === 'function'
}

export async function isPlatformAuthenticatorAvailable() {
  if (!isWebAuthnSupported()) return false
  try {
    if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function hasRegisteredBiometric() {
  return !!localStorage.getItem(KEYS.credentialId)
    && !!localStorage.getItem(KEYS.wrappedPin)
}

// Register a passkey + wrap the PIN using PRF-derived secret.
// Throws on failure (cancellation, no PRF support, etc.).
export async function registerBiometric(pin) {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser')
  }

  const challenge = randomBytes(32)
  const userHandle = randomBytes(32)
  const prfSalt = randomBytes(32)

  const publicKey = {
    challenge,
    rp: { id: getRpId(), name: 'Smart2FA Oxid' },
    user: {
      id: userHandle,
      name: 'oxid-vault',
      displayName: 'Oxid Vault',
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },    // ES256
      { type: 'public-key', alg: -257 },  // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60_000,
    attestation: 'none',
    extensions: {
      prf: { eval: { first: prfSalt } },
    },
  }

  const cred = await navigator.credentials.create({ publicKey })
  if (!cred) throw new Error('Authenticator returned no credential')

  // Verify PRF was actually evaluated by the authenticator at registration time.
  // Some authenticators only expose PRF results on the get() ceremony.
  // We do NOT require PRF results here — we will verify them via a follow-up
  // get() call below.
  const credentialId = new Uint8Array(cred.rawId)

  // Now run a get() to obtain the PRF secret (works on more authenticators).
  const getRes = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      rpId: getRpId(),
      allowCredentials: [{ type: 'public-key', id: credentialId }],
      userVerification: 'required',
      timeout: 60_000,
      extensions: { prf: { eval: { first: prfSalt } } },
    },
  })

  const ext = getRes?.getClientExtensionResults?.()
  const prfFirst = ext?.prf?.results?.first
  if (!prfFirst) {
    throw new Error('Your authenticator does not support the PRF extension required for secure key derivation')
  }

  const prfBytes = new Uint8Array(prfFirst)
  const wrapped = await aesEncrypt(prfBytes, String(pin))

  // Persist
  localStorage.setItem(KEYS.credentialId, b64uEncode(credentialId))
  localStorage.setItem(KEYS.userHandle, b64uEncode(userHandle))
  localStorage.setItem(KEYS.prfSalt, b64uEncode(prfSalt))
  localStorage.setItem(KEYS.wrappedPin, JSON.stringify(wrapped))

  return true
}

// Trigger biometric prompt and return the unwrapped PIN string.
export async function unlockWithBiometric() {
  if (!isWebAuthnSupported()) throw new Error('WebAuthn not supported')
  const credIdB64 = localStorage.getItem(KEYS.credentialId)
  const saltB64   = localStorage.getItem(KEYS.prfSalt)
  const wrappedJs = localStorage.getItem(KEYS.wrappedPin)
  if (!credIdB64 || !saltB64 || !wrappedJs) {
    throw new Error('Biometric is not registered on this device')
  }

  const credentialId = b64uDecode(credIdB64)
  const prfSalt = b64uDecode(saltB64)
  const wrapped = JSON.parse(wrappedJs)

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      rpId: getRpId(),
      allowCredentials: [{ type: 'public-key', id: credentialId }],
      userVerification: 'required',
      timeout: 60_000,
      extensions: { prf: { eval: { first: prfSalt } } },
    },
  })
  if (!assertion) throw new Error('No assertion returned')

  const ext = assertion.getClientExtensionResults?.()
  const prfFirst = ext?.prf?.results?.first
  if (!prfFirst) {
    throw new Error('PRF extension not available on this authenticator')
  }

  const pin = await aesDecrypt(new Uint8Array(prfFirst), wrapped)
  return pin
}

export function removeBiometric() {
  localStorage.removeItem(KEYS.credentialId)
  localStorage.removeItem(KEYS.userHandle)
  localStorage.removeItem(KEYS.prfSalt)
  localStorage.removeItem(KEYS.wrappedPin)
}

export const WA_KEYS = KEYS
