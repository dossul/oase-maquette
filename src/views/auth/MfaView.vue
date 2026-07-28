<template>
  <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.95)">
    <v-card-text class="pa-8">
      <div class="text-center mb-6">
        <v-avatar color="primary" size="64" rounded="lg" class="mb-4">
          <v-icon icon="mdi-shield-lock" size="32" color="white" />
        </v-avatar>
        <h2 style="font-size:1.3rem;font-weight:700;color:#1A2332">Vérification en 2 étapes</h2>
        <p class="text-medium-emphasis text-body-2 mt-1">
          Un code a été envoyé sur votre {{ channel === 'sms' ? 'numéro' : 'application TOTP' }}
          <strong>{{ channel === 'sms' ? '+228 *** *** 84' : 'TOTP configurée' }}</strong>
        </p>
      </div>

      <!-- Channel indicator -->
      <div class="d-flex justify-center ga-2 mb-5">
        <v-chip :color="channel === 'sms' ? 'primary' : 'default'" variant="tonal" size="small" @click="channel = 'sms'" prepend-icon="mdi-message-text">SMS</v-chip>
        <v-chip :color="channel === 'totp' ? 'primary' : 'default'" variant="tonal" size="small" @click="channel = 'totp'" prepend-icon="mdi-application-cog">TOTP App</v-chip>
      </div>

      <!-- OTP input -->
      <v-otp-input
        v-model="otp"
        :length="6"
        type="number"
        autofocus
        @finish="handleOtp"
        class="mb-4"
      />

      <!-- Timer -->
      <div class="text-center mb-4">
        <v-chip v-if="timer > 0" color="info" variant="tonal" size="small" prepend-icon="mdi-timer">
          Ce code expire dans {{ Math.floor(timer/60) }}:{{ String(timer%60).padStart(2,'0') }}
        </v-chip>
        <v-btn v-else variant="text" size="small" color="primary" @click="resendCode">Renvoyer le code</v-btn>
      </div>

      <v-alert v-if="otpError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-4">
        Code incorrect. Vérifiez et réessayez.
      </v-alert>

      <v-btn color="primary" block size="large" rounded="lg" :loading="loading" @click="handleOtp">
        Vérifier
      </v-btn>

      <div class="d-flex justify-space-between mt-4">
        <v-checkbox v-model="remember" label="Se souvenir de cet appareil (30 jours)" hide-details density="compact" style="font-size:0.78rem" />
        <v-btn variant="text" size="small" color="secondary">Clé de récupération</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { getDefaultRouteForRole } from '../../composables/useDefaultRoute'

const router = useRouter()
const auth = useAuthStore()
const otp = ref('')
// OASE [BUG #11] fix : canal réel renvoyé par POST /auth/login (stocké en sessionStorage)
const channel = ref<'sms'|'totp'>((sessionStorage.getItem('oase_mfa_canal') as 'sms'|'totp') || 'totp')
const timer = ref(272)
const loading = ref(false)
const otpError = ref(false)
const remember = ref(false)

let interval: ReturnType<typeof setInterval>
onMounted(() => { interval = setInterval(() => { if (timer.value > 0) timer.value-- }, 1000) })
onUnmounted(() => clearInterval(interval))

// OASE [BUG #11] fix : vraie vérification POST /auth/mfa/verify (auparavant : mock
// qui redirigeait sans appel API après 700 ms — n'importe quel code « passait »).
const handleOtp = async () => {
  otpError.value = false
  const mfaToken = sessionStorage.getItem('oase_mfa_token')
  if (!mfaToken || otp.value.length !== 6) {
    otpError.value = true
    return
  }
  loading.value = true
  try {
    const res = await api<{ access_token: string; user: any }>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ mfa_token: mfaToken, code: otp.value, canal: channel.value }),
    })
    auth.setSession(res.access_token, res.user)
    sessionStorage.removeItem('oase_mfa_token')
    sessionStorage.removeItem('oase_mfa_canal')
    router.push(getDefaultRouteForRole(res.user.role))
  } catch {
    otpError.value = true
  } finally {
    loading.value = false
  }
}

const resendCode = () => { timer.value = 120 }
</script>
