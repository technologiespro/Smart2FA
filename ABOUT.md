# Smart2FA 0xid Edition

> Premium 2FA authenticator with an industrial-metallic aesthetic.
> Vue 3 + Vite + Pinia + Tailwind CSS. Backend-free. Everything is encrypted on-device.

![tech](https://img.shields.io/badge/Vue-3-42b883?style=flat-square)
![tech](https://img.shields.io/badge/Vite-5-646cff?style=flat-square)
![tech](https://img.shields.io/badge/Pinia-2-yellow?style=flat-square)
![tech](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square)
![tech](https://img.shields.io/badge/Crypto-AES--256-E25822?style=flat-square)

---

## 1. What Has Been Done

A client-side 2FA authenticator "Oxid Edition" built entirely from scratch:

- **Complete Template Replacement**: The template has been replaced with clean Vue 3 + Vite. No backend is used — the application works 100% offline.
- **Industrial-Metallic Design System**: Rust Orange `#E25822` over Dark Charcoal `#1A1B1E`, glassmorphism, metallic bevels, `JetBrains Mono` fonts (for codes) and `Inter` (for UI).
- **Full 2FA Token Lifecycle**: Create PIN -> Unlock -> Add via QR/Manual -> Display with countdown -> Copy -> Delete -> Export/Import -> Wipe.
- **Real Cryptography**:
  - PIN is hashed using **PBKDF2 + SHA-256, 25,000 iterations** for verification.
  - Token storage in `localStorage` is encrypted with **AES-256 CBC** using a key derived from the PIN via the same PBKDF2 (with a different salt).
- **Real TOTP**: `otpauth` library (RFC 6238), supporting SHA-1/256/512, 6/7/8 digits, 30/60 s periods.
- **Real QR Scanner** via `html5-qrcode` supporting `otpauth://` URI recognition and parsing of all parameters (issuer, label, algorithm, digits, period).
- **Categories with Color Dots**: Crypto, Social, Work, Finance, Email, Gaming, Other with auto-detection for popular providers (GitHub -> Work, Coinbase -> Crypto, etc.).
- **Themes**: Dark (default) and Light Steel, persisted in `localStorage`.
- **Testing**: Automated execution of 17 test scenarios — all passed (100%).

---

## 2. How the Application Works

### User Flow

```
┌──────────────┐    First Launch     ┌──────────────┐    Confirmation     ┌──────────┐
│  Create PIN  │ ──────────────────▶ │ Confirm PIN  │ ──────────────────▶ │  Vault   │
└──────────────┘                     └──────────────┘                     └────┬─────┘
                                                                               │
        ┌──────────────────────────────────────────────────────────────────────┤
        │                                                                      │
        ▼                                                                      ▼
┌──────────────┐                                                       ┌──────────────┐
│  Lock (PIN)  │ ◀──── Return visit / Lock Now ─────────               │   FAB (+)    │
└──────┬───────┘                                                       └──────┬───────┘
       │ Correct PIN                                                          │
       ▼                                                                      ▼
┌──────────────┐                                                       ┌──────────────┐
│    Vault     │                                                       │   Scan QR    │
└──────────────┘                                                       │     Code     │
                                                                       └──────┬───────┘
                                                                              │ or
                                                                              ▼
                                                                       ┌──────────────┐
                                                                       │ Manual Entry │
                                                                       └──────────────┘
```

### Security Logic

1. On first launch, the user creates a 4-digit PIN.
2. The PIN is **never stored** in plaintext. Only the PBKDF2 hash (`oxid:pin-hash`) is preserved.
3. The PIN itself is kept **in volatile memory of the Pinia store** only during an unlocked session. Upon page refresh or pressing "Lock", it is cleared.
4. All tokens are serialized into JSON and encrypted with AES-256 before being written to `localStorage` under the `oxid:vault` key. Without the correct PIN, it is impossible to decrypt them, even if an attacker gains access to local storage.
5. The `.oxid` export file is the exact same encrypted payload; it can be safely sent via email or cloud storage: without the PIN, it is useless.

### TOTP Code Generation

- A 1-second timer runs on each token card, recalculating the code and remaining seconds.
- The progress bar beneath the code shrinks smoothly from 100% to 0%.
- 5 seconds before expiration, the bar turns **red** as a visual warning.
- Tapping a code copies it to the clipboard and triggers a metallic toast notification.

---

## 3. Project Structure

```
/app/frontend/
├── index.html                       # Entry point, Inter + JetBrains Mono fonts
├── vite.config.js                   # Server 0.0.0.0:3000, WSS-HMR for preview domain
├── tailwind.config.js               # Custom colors (charcoal, rust, steel) + animations
├── postcss.config.js
├── package.json                     # vue, vue-router, pinia, otpauth, crypto-js, html5-qrcode
├── public/
│   └── favicon.svg                  # Rust lock icon
└── src/
    ├── main.js                      # Bootstrap: Vue + Pinia + Router
    ├── style.css                    # Tailwind + utilities (.glass, .metallic, .btn-rust, .input-steel, .bg-grid, .noise)
    ├── App.vue                      # Shell + router-view with page-transition
    │
    ├── router/
    │   └── index.js                 # Routes + requiresUnlock guard
    │
    ├── stores/                      # Pinia
    │   ├── auth.js                  # useAuthStore: lock state, PIN, hasPin, wipe
    │   ├── vault.js                 # useVaultStore: token CRUD, encrypt/decrypt, export/import
    │   └── settings.js              # useSettingsStore: dark/light theme
    │
    ├── lib/
    │   ├── crypto.js                # PBKDF2 + AES-256 CBC, encryptJSON / decryptJSON / hashPin
    │   ├── totp.js                  # otpauth wrapper: generateTOTP, secondsRemaining, parseOtpAuthURI, isValidBase32Secret
    │   └── categories.js            # CATEGORIES (colors + labels) + guessCategory(issuer, label)
    │
    ├── composables/
    │   └── useToast.js              # Reactive toast notification list
    │
    ├── components/
    │   ├── Keypad.vue               # 3×4 numeric keypad (1–9, 0, ⌫)
    │   ├── PinDots.vue              # 4 PIN input indicator dots
    │   ├── TokenCard.vue            # Token card: code, progress, copy, delete
    │   ├── CategoryDot.vue          # Color dot + category name
    │   └── Toaster.vue              # "Oxidized" toast at bottom of screen
    │
    └── views/                       # Screens
        ├── PinScreen.vue            # 3 modes: create / confirm / enter
        ├── VaultDashboard.vue       # Sticky search, category filter, card list, FAB
        ├── AddAccount.vue           # Choice: QR scan or manual entry
        ├── ScanQR.vue               # Camera + reticle with corner brackets, scan-line animation
        ├── ManualEntry.vue          # Form: issuer, label, secret (Base32), category, advanced
        └── Settings.vue             # Theme, export, import, lock now, wipe (with "WIPE" confirmation)
```

### Key `data-testid` Attributes (for Testing)

| Screen   | testid                                                                                                                                                          |
|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| PIN      | `pin-screen`, `pin-dots`, `pin-dot-1..4`, `keypad-0..9`, `keypad-back`, `pin-error`                                                                             |
| Vault    | `vault-dashboard`, `search-input`, `filter-crypto`, …, `token-card-{id}`, `token-code-{id}`, `token-progress-{id}`, `fab-add`, `lock-button`, `settings-button` |
| Add      | `option-scan-qr`, `option-manual`                                                                                                                               |
| Manual   | `input-issuer`, `input-label`, `input-secret`, `cat-*`, `save-button`, `secret-error`                                                                           |
| Scan     | `camera-viewport`, `scan-status`, `retry-scan`, `switch-manual`                                                                                                 |
| Settings | `theme-dark`, `theme-light`, `export-button`, `import-input`, `wipe-button`, `wipe-input`, `wipe-confirm`                                                       |

---

## 4. Detailed Feature List

### PIN Screen
- 3 automatic modes: **Create / Confirm / Enter** (determined by presence of `oxid:pin-hash`).
- Indicator dots fill with Rust Orange and a subtle glow.
- On PIN mismatch: shake animation + reset to Create mode.
- Background: low-contrast brushed steel texture (10–15% opacity).

### Vault (Main Dashboard)
- Sticky glass header: token counter, **Lock** and **Settings** buttons.
- Search bar: real-time filtering by issuer / label / category.
- Horizontal filter ribbon with 7 categories (color dot + uppercase label).
- Token cards: issuer, label, algorithm badge (for SHA-256/512), 6-digit code with dot separator in the middle, slim progress bar.
- **FAB "+"**: add token.
- Empty state with 3D illustration and "Forge First Token" button.

### Adding Tokens
- **QR Scan**: camera permission request -> live video feed with reticle (corner brackets + sweep line) -> auto-parse otpauth URI -> auto-categorization -> save.
- **Manual Entry**: issuer / label / Base32 secret with validation (`A-Z2-7` only), category selector (with auto-suggestion by issuer), expandable advanced settings (algo / digits / period).

### Settings
- **Theme**: dark / light toggle (persisted).
- **Export Vault**: download encrypted timestamped `.oxid` backup file.
- **Import Vault**: file upload -> enter the PIN used when exporting -> merge without duplicates.
- **Lock Now**: lock session and return to PIN screen.
- **Wipe All Data**: confirmation modal requiring typing `WIPE` to permanently delete all `oxid:*` keys.

### Toast Notifications
- Appear at bottom-center of the screen.
- Variants: `success` (rust) / `error` (red).
- Auto-dismiss after 2.2s with easing animation.

---

## 5. Getting Started

Dependencies are installed automatically. The server is already managed via supervisor.

```bash
# Manual (if needed)
cd /app/frontend
yarn install
yarn start          # vite on 0.0.0.0:3000

# Production build
yarn build
```

Open in browser: `http://localhost:3000` or preview URL.

---

## 6. Technical Decisions and Rationale

| Decision                                     | Why                                                                                      |
|----------------------------------------------|------------------------------------------------------------------------------------------|
| **Vue 3 Composition API + `<script setup>`** | Less boilerplate, better type inference, direct user requirement                         |
| **Pinia over Vuex**                          | Modern store, cleaner domain separation (auth/vault/settings)                            |
| **PBKDF2 25k iters**                         | Balance between brute-force resistance and in-browser responsiveness (~150 ms)           |
| **AES-256 CBC + PKCS7**                      | Standard encryption, available in `crypto-js` without extra dependencies                 |
| **`otpauth` (instead of custom TOTP)**       | Full RFC 6238 compliance, compatible with Google/GitHub/AWS QR codes                     |
| **`html5-qrcode`**                           | Runs directly inside `<video>` without WASM, mobile autofocus by default                 |
| **localStorage**                             | Specification excludes server-side sync; IndexedDB is overkill for this data volume      |
| **PIN in memory, not in storage**            | If an attacker dumps storage, they only get encrypted data                               |

---

## 7. License and Credits

- Fonts: Inter (OFL), JetBrains Mono (OFL).
- Icons: embedded SVG + Phosphor style.
- TOTP Algorithm: RFC 6238, implemented via `otpauth` (MIT).
- Cryptography: `crypto-js` (MIT).
- QR Scanner: `html5-qrcode` (Apache-2.0).

---

**Date:** February 15, 2026
**Version:** 1.0.0 0xid Edition
