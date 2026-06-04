<template>
  <v-main class="auth-bg d-flex align-center justify-center" style="min-height:100vh">
    <!-- Background pattern -->
    <div class="auth-overlay" />
    <v-container max-width="960" class="py-6">
      <!-- Logo area -->
      <div class="text-center mb-8">
        <div class="d-flex align-center justify-center ga-3 mb-2">
          <div class="oase-logo">
            <v-icon icon="mdi-shield-check" color="white" size="28" />
          </div>
          <div class="text-left">
            <div style="font-size:1.4rem;font-weight:700;color:#fff;letter-spacing:-0.02em">OASE</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.75);letter-spacing:0.1em;text-transform:uppercase">République Togolaise · MEF</div>
          </div>
        </div>
      </div>
      <slot />
      <div class="text-center mt-6">
        <span style="font-size:0.72rem;color:rgba(255,255,255,0.5)">
          © 2026 PERFODEV
        </span>
      </div>
    </v-container>
  </v-main>
</template>

<style scoped>
.auth-bg {
  background: linear-gradient(135deg, #1A3A5C 0%, #2774AE 50%, #1B8F4C 100%);
  position: relative;
}
.auth-overlay {
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.oase-logo {
  width: 52px;
  height: 52px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}
</style>
