import * as OTPAuth from 'otpauth'

export function generateTOTP({ secret, algorithm = 'SHA1', digits = 6, period = 30, issuer = '', label = '' }) {
  try {
    const totp = new OTPAuth.TOTP({
      issuer,
      label: label || 'account',
      algorithm,
      digits,
      period,
      secret: OTPAuth.Secret.fromBase32(String(secret).replace(/\s+/g, '').toUpperCase()),
    })
    return totp.generate()
  } catch (e) {
    return '------'
  }
}

export function secondsRemaining(period = 30) {
  const now = Math.floor(Date.now() / 1000)
  return period - (now % period)
}

export function parseOtpAuthURI(uri) {
  // otpauth://totp/Issuer:account@example.com?secret=BASE32&issuer=Issuer&algorithm=SHA1&digits=6&period=30
  try {
    const parsed = OTPAuth.URI.parse(uri)
    return {
      type: 'totp',
      secret: parsed.secret.base32,
      issuer: parsed.issuer || '',
      label: parsed.label || '',
      algorithm: parsed.algorithm || 'SHA1',
      digits: parsed.digits || 6,
      period: parsed.period || 30,
    }
  } catch (e) {
    return null
  }
}

export function isValidBase32Secret(secret) {
  try {
    const cleaned = String(secret).replace(/\s+/g, '').toUpperCase()
    if (!/^[A-Z2-7]+=*$/.test(cleaned)) return false
    OTPAuth.Secret.fromBase32(cleaned)
    return true
  } catch (e) {
    return false
  }
}
