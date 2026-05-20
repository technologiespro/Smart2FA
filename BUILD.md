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