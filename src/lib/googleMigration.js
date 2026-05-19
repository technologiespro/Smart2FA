// Google Authenticator export QR decoder.
//
// Google Auth exports as `otpauth-migration://offline?data=<URL-ENCODED BASE64 PROTOBUF>`.
// The protobuf payload is MigrationPayload:
//
//   message MigrationPayload {
//     repeated OtpParameters otp_parameters = 1;
//     int32 version = 2;
//     int32 batch_size = 3;
//     int32 batch_index = 4;
//     int32 batch_id = 5;
//   }
//   message OtpParameters {
//     bytes  secret    = 1;
//     string name      = 2;
//     string issuer    = 3;
//     int32  algorithm = 4; // 1=SHA1 2=SHA256 3=SHA512 4=MD5
//     int32  digits    = 5; // 1=6 2=8
//     int32  type      = 6; // 1=HOTP 2=TOTP
//     int64  counter   = 7;
//   }
//
// We implement a tiny manual protobuf reader (varint + length-delimited).

const ALGO_MAP = { 0: 'SHA1', 1: 'SHA1', 2: 'SHA256', 3: 'SHA512', 4: 'MD5' }
const DIGIT_MAP = { 0: 6, 1: 6, 2: 8 }
const TYPE_MAP  = { 0: 'totp', 1: 'hotp', 2: 'totp' }

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function bytesToBase32(bytes) {
  let bits = 0
  let value = 0
  let out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }
  return out
}

function base64ToBytes(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob(s + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

class Reader {
  constructor(bytes) { this.b = bytes; this.p = 0 }
  eof() { return this.p >= this.b.length }
  readVarint() {
    let result = 0n
    let shift = 0n
    while (true) {
      if (this.p >= this.b.length) throw new Error('varint EOF')
      const byte = this.b[this.p++]
      result |= BigInt(byte & 0x7f) << shift
      if ((byte & 0x80) === 0) break
      shift += 7n
      if (shift > 70n) throw new Error('varint too long')
    }
    return result
  }
  readVarintNum() {
    const v = this.readVarint()
    return Number(v)
  }
  readBytes(n) {
    if (this.p + n > this.b.length) throw new Error('bytes EOF')
    const out = this.b.slice(this.p, this.p + n)
    this.p += n
    return out
  }
  readLenDelim() {
    const n = this.readVarintNum()
    return this.readBytes(n)
  }
  skipField(wireType) {
    if (wireType === 0) this.readVarint()
    else if (wireType === 2) this.readLenDelim()
    else if (wireType === 5) this.readBytes(4)
    else if (wireType === 1) this.readBytes(8)
    else throw new Error('Unsupported wire type ' + wireType)
  }
}

function decodeOtpParameters(bytes) {
  const r = new Reader(bytes)
  const out = { secret: null, name: '', issuer: '', algorithm: 'SHA1', digits: 6, type: 'totp', counter: 0 }
  while (!r.eof()) {
    const tag = r.readVarintNum()
    const field = tag >>> 3
    const wire = tag & 7
    if (field === 1 && wire === 2) out.secret = r.readLenDelim()
    else if (field === 2 && wire === 2) out.name = new TextDecoder().decode(r.readLenDelim())
    else if (field === 3 && wire === 2) out.issuer = new TextDecoder().decode(r.readLenDelim())
    else if (field === 4 && wire === 0) out.algorithm = ALGO_MAP[r.readVarintNum()] || 'SHA1'
    else if (field === 5 && wire === 0) out.digits = DIGIT_MAP[r.readVarintNum()] || 6
    else if (field === 6 && wire === 0) out.type = TYPE_MAP[r.readVarintNum()] || 'totp'
    else if (field === 7 && wire === 0) out.counter = r.readVarintNum()
    else r.skipField(wire)
  }
  return out
}

function decodeMigrationPayload(bytes) {
  const r = new Reader(bytes)
  const params = []
  while (!r.eof()) {
    const tag = r.readVarintNum()
    const field = tag >>> 3
    const wire = tag & 7
    if (field === 1 && wire === 2) {
      params.push(decodeOtpParameters(r.readLenDelim()))
    } else {
      r.skipField(wire)
    }
  }
  return params
}

// Parse one Google Auth migration URI → array of token objects compatible with vault.addToken().
export function parseGoogleMigrationURI(uri) {
  if (!uri || typeof uri !== 'string') return null
  if (!uri.startsWith('otpauth-migration://')) return null

  try {
    const u = new URL(uri)
    const data = u.searchParams.get('data')
    if (!data) return null

    const bytes = base64ToBytes(decodeURIComponent(data))
    const params = decodeMigrationPayload(bytes)

    return params
      .filter(p => p.secret && p.secret.length > 0)
      .map(p => ({
        type: p.type,
        secret: bytesToBase32(p.secret),
        issuer: p.issuer || '',
        label: p.name || '',
        algorithm: p.algorithm,
        digits: p.digits,
        period: 30,
        counter: p.counter || 0,
      }))
  } catch (e) {
    return null
  }
}

export function isGoogleMigrationURI(s) {
  return typeof s === 'string' && s.startsWith('otpauth-migration://')
}
