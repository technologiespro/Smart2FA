<template>
  <div class="min-h-screen flex flex-col px-6 pt-20 pb-10" data-testid="add-account-screen">
    <div class="mb-8">
      <button class="label flex items-center gap-1 text-zinc-400 hover:text-rust transition-colors" @click="$router.back()" data-testid="back-button">
        ← Back
      </button>
      <div class="label mt-4">NEW TOKEN</div>
      <h1 class="font-mono font-black text-3xl tracking-tighter">Forge Account</h1>
      <p class="text-sm text-zinc-400 mt-1.5">Choose how to add your 2FA secret.</p>
    </div>

    <div class="flex flex-col gap-3">
      <button
        type="button"
        class="metallic rounded-lg p-5 text-left flex items-center gap-4 hover:border-rust/60 transition-all group"
        @click="$router.push({ name: 'scan' })"
        data-testid="option-scan-qr"
      >
        <div class="w-12 h-12 rounded-md flex items-center justify-center" style="background-color:#E25822">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1B1E" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14h1M14 20h1M17 17h4v4"/></svg>
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-mono font-bold tracking-tight">SCAN QR</div>
          <div class="text-xs text-zinc-400">Point your camera at a 2FA setup code</div>
        </div>
        <span class="text-rust text-xl">›</span>
      </button>

      <button
        type="button"
        class="metallic rounded-lg p-5 text-left flex items-center gap-4 hover:border-rust/60 transition-all group"
        @click="$router.push({ name: 'manual' })"
        data-testid="option-manual"
      >
        <div class="w-12 h-12 rounded-md metallic flex items-center justify-center border-rust/40" style="border-color: rgba(226,88,34,0.45)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E25822" stroke-width="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-mono font-bold tracking-tight">MANUAL ENTRY</div>
          <div class="text-xs text-zinc-400">Type the secret key directly</div>
        </div>
        <span class="text-rust text-xl">›</span>
      </button>
    </div>

    <div class="mt-auto pt-8">
      <div class="metallic rounded-md px-4 py-3 text-xs text-zinc-400 flex gap-3">
        <span class="text-rust">⌬</span>
        <span>All secrets are encrypted with AES-256 derived from your PIN. Nothing ever leaves this device.</span>
      </div>
    </div>
  </div>
</template>
