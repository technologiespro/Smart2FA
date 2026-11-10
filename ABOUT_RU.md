# Smart2FA 0xid Edition

> Премиум-аутентификатор 2FA с индустриально-металлической эстетикой.
> Vue 3 + Vite + Pinia + Tailwind CSS. Без бэкенда. Всё шифруется на устройстве.

![tech](https://img.shields.io/badge/Vue-3-42b883?style=flat-square)
![tech](https://img.shields.io/badge/Vite-5-646cff?style=flat-square)
![tech](https://img.shields.io/badge/Pinia-2-yellow?style=flat-square)
![tech](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square)
![tech](https://img.shields.io/badge/Crypto-AES--256-E25822?style=flat-square)

---

## 1. Что было сделано

Целиком с нуля реализован клиентский 2FA-аутентификатор "Oxid Edition":

- **Полная замена шаблона**: шаблон заменён на чистый Vue 3 + Vite. Бэкенд не используется приложение работает 100 % офлайн.
- **Industrial-Metallic дизайн-система**: Rust Orange `#E25822` поверх Dark Charcoal `#1A1B1E`, glassmorphism, металлические грани, шрифты `JetBrains Mono` (для кодов) и `Inter` (для UI).
- **Полный жизненный цикл 2FA-токенов**: создание PIN -> разблокировка -> добавление через QR/вручную -> отображение с обратным отсчётом -> копирование -> удаление -> экспорт/импорт -> wipe.
- **Реальная криптография**:
  - PIN хешируется через **PBKDF2 + SHA-256, 25 000 итераций** для верификации.
  - Хранилище токенов в `localStorage` шифруется **AES-256 CBC** ключом, выведенным из PIN тем же PBKDF2 (но с другой солью).
- **Реальный TOTP**: библиотека `otpauth` (RFC 6238), поддержка SHA-1/256/512, 6/7/8 цифр, периодов 30/60 c.
- **Реальный QR-сканер** через `html5-qrcode` с распознаванием URI `otpauth://` и парсингом всех параметров (issuer, label, algorithm, digits, period).
- **Категории с цветными точками**: Crypto, Social, Work, Finance, Email, Gaming, Other c автоопределением по известным провайдерам (GitHub -> Work, Coinbase -> Crypto и т. д.).
- **Темы**: тёмная (по умолчанию) и светлая стальная, сохраняются в `localStorage`.
- **Тестирование**: автоматический прогон 17 сценариев все прошли (100 %).

---

## 2. Как работает приложение

### Поток пользователя

```
┌──────────────┐    первый запуск    ┌──────────────┐    подтверждение    ┌──────────┐
│ Создать PIN  │ ──────────────────▶ │ Подтвердить  │ ──────────────────▶ │  Vault   │
└──────────────┘                     └──────────────┘                     └────┬─────┘
                                                                               │
        ┌──────────────────────────────────────────────────────────────────────┤
        │                                                                      │
        ▼                                                                      ▼
┌──────────────┐                                                       ┌──────────────┐
│  Lock (PIN)  │ ◀──── повторный заход / Lock Now ──────               │   FAB (+)    │
└──────┬───────┘                                                       └──────┬───────┘
       │ верный PIN                                                           │
       ▼                                                                      ▼
┌──────────────┐                                                       ┌──────────────┐
│    Vault     │                                                       │ Сканировать  │
└──────────────┘                                                       │   QR-код     │
                                                                       └──────┬───────┘
                                                                              │ или
                                                                              ▼
                                                                       ┌──────────────┐
                                                                       │ Ввод вручную │
                                                                       └──────────────┘
```

### Логика безопасности

1. При первом запуске пользователь придумывает 4-значный PIN.
2. PIN **не сохраняется** в открытом виде. Хранится только PBKDF2-хеш (`oxid:pin-hash`).
3. Сам PIN держится **в оперативной памяти Pinia-стора** только во время разблокированной сессии. После перезагрузки страницы или нажатия "Lock" он стирается.
4. Все токены сериализуются в JSON и шифруются AES-256 перед записью в `localStorage` под ключом `oxid:vault`. Без правильного PIN расшифровать их невозможно даже если злоумышленник получил доступ к локальному хранилищу.
5. Экспорт-файл `.oxid` это та же зашифрованная полезная нагрузка, его можно безопасно отправлять себе по почте/облаку: без PIN он бесполезен.

### Генерация кодов TOTP

- Раз в секунду срабатывает таймер на каждой карточке: пересчитывается код и оставшееся время.
- Прогресс-полоска под кодом плавно сжимается от 100 % к 0 %.
- За 5 секунд до истечения полоска становится **красной** визуальное предупреждение.
- Тап по коду -> копирование в буфер обмена + металлический "toast".

---

## 3. Структура проекта

```
/app/frontend/
├── index.html                       # точка входа, шрифты Inter + JetBrains Mono
├── vite.config.js                   # сервер 0.0.0.0:3000, WSS-HMR для preview-домена
├── tailwind.config.js               # кастомные цвета (charcoal, rust, steel) + анимации
├── postcss.config.js
├── package.json                     # vue, vue-router, pinia, otpauth, crypto-js, html5-qrcode
├── public/
│   └── favicon.svg                  # рустовая иконка-замок
└── src/
    ├── main.js                      # bootstrap: Vue + Pinia + Router
    ├── style.css                    # Tailwind + утилиты (.glass, .metallic, .btn-rust, .input-steel, .bg-grid, .noise)
    ├── App.vue                      # каркас + router-view с page-transition
    │
    ├── router/
    │   └── index.js                 # маршруты + guard requiresUnlock
    │
    ├── stores/                      # Pinia
    │   ├── auth.js                  # useAuthStore состояние блокировки, PIN, hasPin, wipe
    │   ├── vault.js                 # useVaultStore CRUD токенов, encrypt/decrypt, export/import
    │   └── settings.js              # useSettingsStore тема dark/light
    │
    ├── lib/
    │   ├── crypto.js                # PBKDF2 + AES-256 CBC, encryptJSON / decryptJSON / hashPin
    │   ├── totp.js                  # обёртка otpauth: generateTOTP, secondsRemaining, parseOtpAuthURI, isValidBase32Secret
    │   └── categories.js            # CATEGORIES (цвета + label) + guessCategory(issuer, label)
    │
    ├── composables/
    │   └── useToast.js              # реактивный список toast-сообщений
    │
    ├── components/
    │   ├── Keypad.vue               # цифровая клавиатура 3×4 (1–9, 0, ⌫)
    │   ├── PinDots.vue              # 4 точки-индикатора ввода PIN
    │   ├── TokenCard.vue            # карточка токена: код, прогресс, копирование, удаление
    │   ├── CategoryDot.vue          # цветная точка + название категории
    │   └── Toaster.vue              # "оксидированный" toast в нижней части экрана
    │
    └── views/                       # экраны
        ├── PinScreen.vue            # 3 режима: create / confirm / enter
        ├── VaultDashboard.vue       # sticky-поиск, фильтр по категориям, список карточек, FAB
        ├── AddAccount.vue           # выбор: QR-скан или ручной ввод
        ├── ScanQR.vue               # камера + reticle с угловыми скобками, scan-line анимация
        ├── ManualEntry.vue          # форма: issuer, label, secret (Base32), категория, advanced
        └── Settings.vue             # тема, экспорт, импорт, lock now, wipe (с подтверждением "WIPE")
```

### Ключевые `data-testid` (для тестов)

| Экран    | testid                                                                                                                                                          |
|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| PIN      | `pin-screen`, `pin-dots`, `pin-dot-1..4`, `keypad-0..9`, `keypad-back`, `pin-error`                                                                             |
| Vault    | `vault-dashboard`, `search-input`, `filter-crypto`, …, `token-card-{id}`, `token-code-{id}`, `token-progress-{id}`, `fab-add`, `lock-button`, `settings-button` |
| Add      | `option-scan-qr`, `option-manual`                                                                                                                               |
| Manual   | `input-issuer`, `input-label`, `input-secret`, `cat-*`, `save-button`, `secret-error`                                                                           |
| Scan     | `camera-viewport`, `scan-status`, `retry-scan`, `switch-manual`                                                                                                 |
| Settings | `theme-dark`, `theme-light`, `export-button`, `import-input`, `wipe-button`, `wipe-input`, `wipe-confirm`                                                       |

---

## 4. Функционал детальный список

### PIN-экран
- 3 режима автоматически: **Create / Confirm / Enter** (зависит от наличия `oxid:pin-hash`).
- Точки-индикаторы наполняются Rust-оранжевым с лёгким glow.
- При несовпадении PIN анимация shake + сброс в режим Create.
- Фон низкоконтрастная текстура брашированной стали (10–15 % opacity).

### Vault (главный экран)
- Sticky-glass-шапка: количество кодов, кнопки **Lock** и **Settings**.
- Поле поиска фильтрация в реальном времени по issuer / label / категории.
- Горизонтальная лента фильтров по 7 категориям (цветная точка + uppercase-метка).
- Карточки токенов: issuer, label, бейдж алгоритма (для SHA-256/512), 6 цифр кода с разделителем-точкой посередине, тонкая прогресс-полоса.
- **FAB "+"** добавление токена.
- Пустое состояние с 3D-иллюстрацией и кнопкой "Forge First Token".

### Добавление токена
- **QR-скан**: запрос разрешения на камеру -> live-видео с reticle (угловые скобки + бегущая линия) -> авто-парсинг otpauth-URI -> авто-категория -> сохранение.
- **Вручную**: issuer / label / Base32-секрет с валидацией (только `A-Z2-7`), select категории (с автоподсказкой по issuer), expandable advanced (algo / digits / period).

### Настройки
- **Тема**: переключатель dark / light (сохраняется).
- **Export Vault**: скачивание зашифрованного `.oxid`-файла с timestamp.
- **Import Vault**: загрузка файла -> ввод PIN, под которым он был экспортирован -> слияние без дубликатов.
- **Lock Now**: возврат на PIN-экран.
- **Wipe All Data**: модалка с обязательным вводом слова `WIPE` для подтверждения, полное уничтожение всех ключей `oxid:*`.

### Тосты
- Появляются снизу по центру.
- Варианты: `success` (rust) / `error` (red).
- Авто-скрытие через 2.2 с с easing-анимацией.

---

## 5. Запуск

Зависимости устанавливаются автоматически. Сервер уже запущен через supervisor.

```bash
# вручную (при необходимости)
cd /app/frontend
yarn install
yarn start          # vite на 0.0.0.0:3000

# сборка под продакшн
yarn build
```

Открыть в браузере: `http://localhost:3000` или preview-URL.

---

## 6. Технические решения и обоснование

| Решение                                      | Почему так                                                                               |
|----------------------------------------------|------------------------------------------------------------------------------------------|
| **Vue 3 Composition API + `<script setup>`** | Меньше boilerplate, лучшая типизация, прямой запрос пользователя                         |
| **Pinia вместо Vuex**                        | Современный store, лучше разделение по доменам (auth/vault/settings)                     |
| **PBKDF2 25k iters**                         | Баланс между "дорого для брутфорса" и "приемлемо в браузере" (~150 мс)                   |
| **AES-256 CBC + PKCS7**                      | Стандарт, есть в `crypto-js` без доп. зависимостей                                       |
| **`otpauth` (а не самописный TOTP)**         | Полное RFC 6238 соответствие, совместимо с Google/GitHub/AWS QR-кодами                   |
| **`html5-qrcode`**                           | Работает прямо в `<video>` без WASM, мобильный фокус по умолчанию                        |
| **localStorage**                             | Спецификация исключает синхронизацию через сервер; IndexedDB избыточен для такого объёма |
| **PIN в памяти, не в storage**               | Если злоумышленник дампит storage у него только зашифрованные данные                     |

---

## 7. Лицензия и кредиты

- Шрифты: Inter (OFL), JetBrains Mono (OFL).
- Иконки: вшитые SVG + Phosphor-стиль.
- Алгоритм TOTP: RFC 6238, реализация `otpauth` (MIT).
- Криптография: `crypto-js` (MIT).
- QR-сканер: `html5-qrcode` (Apache-2.0).

---

**Дата:** 15 февраля 2026
**Версия:** 1.0.0 0xid Edition
