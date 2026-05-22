## Android

debug on device

```
npx cap run android
```


```
npm install @capacitor/cli @capacitor/core
npx cap init --web-dir dist --app-name Smart2FA --package-id com.smart2fa.app
npx cap add android
```

```
"scripts": {
  "cap:android": "npm run build && npx cap sync android && npx cap open android",
  "cap:build:release": "npm run build && npx cap sync android && cd android && gradlew assembleRelease"
}
```


### icons
folder resources should be placed in `assets` folder, then run:
```
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --android
```

## Tauri

```
pnpm tauri icon resources/icon.png
```

```
"scripts": {
  "tauri:dev": "pnpm tauri dev",
  "tauri:build": "pnpm tauri build"
}
```


## Linux

# 1. Системные зависимости
sudo apt update
sudo apt install -y curl wget libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# 2. Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Rust (если не установлен)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# 4. Tauri CLI
cargo install tauri-cli

# 5. Клон репы и установка зависимостей
git clone <твой-репозиторий>
cd Smart2FA-v2
npm install

# 6. Билд
npm run tauri:build