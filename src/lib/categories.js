export const CATEGORIES = {
  crypto: { label: 'Crypto', color: '#EAB308' },
  social: { label: 'Social', color: '#3B82F6' },
  work: { label: 'Work', color: '#A855F7' },
  finance: { label: 'Finance', color: '#10B981' },
  email: { label: 'Email', color: '#EF4444' },
  gaming: { label: 'Gaming', color: '#EC4899' },
  other: { label: 'Other', color: '#6B7280' },
}

export const CATEGORY_KEYS = Object.keys(CATEGORIES)

// Heuristic auto-assignment for common services
export function guessCategory(issuer = '', label = '') {
  const s = (issuer + ' ' + label).toLowerCase()
  if (/(coinbase|binance|kraken|bitfinex|metamask|ledger|crypto|trezor|gemini\sexch|kucoin|okx|bybit)/.test(s)) return 'crypto'
  if (/(twitter|x\.com|facebook|instagram|tiktok|reddit|linkedin|discord|snapchat|threads|mastodon)/.test(s)) return 'social'
  if (/(github|gitlab|aws|azure|google\scloud|slack|atlassian|jira|notion|okta|figma|vercel|cloudflare)/.test(s)) return 'work'
  if (/(paypal|stripe|robinhood|chase|wells|bank|fidelity|venmo|cashapp|wise|revolut)/.test(s)) return 'finance'
  if (/(gmail|outlook|proton|yahoo\smail|mail)/.test(s)) return 'email'
  if (/(steam|epic|playstation|xbox|nintendo|riot|blizzard|ubisoft|ea\.com)/.test(s)) return 'gaming'
  return 'other'
}
