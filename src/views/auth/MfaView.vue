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

const router = useRouter()
const otp = ref('')
const channel = ref<'sms'|'totp'>('sms')
const timer = ref(272)
const loading = ref(false)
const otpError = ref(false)
const remember = ref(false)

let interval: ReturnType<typeof setInterval>
onMounted(() => { interval = setInterval(() => { if (timer.value > 0) timer.value-- }, 1000) })
onUnmounted(() => clearInterval(interval))

const handleOtp = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    router.push('/portail/dashboard')
  }, 700)
}

const resendCode = () => { timer.value = 120 }
</script>
