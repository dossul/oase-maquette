<template>
  <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.95)">
    <v-card-text class="pa-8">
      <div class="text-center mb-6">
        <v-avatar color="warning" size="56" rounded="lg" class="mb-3">
          <v-icon icon="mdi-lock-reset" size="28" color="white" />
        </v-avatar>
        <h2 style="font-size:1.3rem;font-weight:700;color:#1A2332">Réinitialisation du mot de passe</h2>
      </div>

      <!-- Step 1: Request -->
      <div v-if="step === 1">
        <p class="text-body-2 text-medium-emphasis text-center mb-5">Saisissez votre adresse e-mail institutionnelle pour recevoir un lien de réinitialisation.</p>
        <v-text-field v-model="email" label="Adresse e-mail institutionnelle" prepend-inner-icon="mdi-email" :rules="[v => !!v || 'Requis', v => /.+@.+/.test(v) || 'Format invalide']" class="mb-4" />

        <v-alert v-if="sent" type="success" variant="tonal" rounded="lg" class="mb-4">
          Un lien a été envoyé à <strong>{{ maskedEmail }}</strong>. Valable 2 heures, usage unique.
        </v-alert>

        <v-btn color="primary" block size="large" rounded="lg" :loading="loading" @click="sendReset" prepend-icon="mdi-send">
          Envoyer le lien de réinitialisation
        </v-btn>
        <v-btn v-if="sent" color="primary" variant="text" block class="mt-2" @click="step = 2">
          J'ai reçu le lien →
        </v-btn>
      </div>

      <!-- Step 2: New password -->
      <div v-else-if="step === 2">
        <v-text-field v-model="newPwd" label="Nouveau mot de passe" :type="showPwd ? 'text' : 'password'" :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showPwd = !showPwd" prepend-inner-icon="mdi-lock" class="mb-3" />

        <!-- Strength indicator -->
        <div class="mb-4">
          <div class="d-flex ga-1 mb-2">
            <div v-for="i in 4" :key="i" :style="{ flex: 1, height: '4px', borderRadius: '2px', background: i <= strength ? strengthColor : '#E5E7EB', transition: 'background 0.3s' }" />
          </div>
          <div class="text-caption" :class="`text-${strengthColor.replace('#','')}`">Force : {{ strengthLabel }}</div>
          <div class="mt-2">
            <div v-for="c in criteria" :key="c.label" class="d-flex align-center ga-1 mb-1">
              <v-icon :icon="c.met ? 'mdi-check-circle' : 'mdi-circle-outline'" :color="c.met ? 'success' : 'default'" size="14" />
              <span class="text-caption" :class="c.met ? 'text-success' : 'text-medium-emphasis'">{{ c.label }}</span>
            </div>
          </div>
        </div>

        <v-text-field v-model="confirmPwd" label="Confirmation du mot de passe" :type="'password'" prepend-inner-icon="mdi-lock-check" :error-messages="confirmPwd && confirmPwd !== newPwd ? ['Les mots de passe ne correspondent pas'] : []" class="mb-4" />

        <v-btn color="primary" block size="large" rounded="lg" :loading="loading" @click="savePassword" prepend-icon="mdi-content-save">
          Enregistrer
        </v-btn>

        <v-alert v-if="success" type="success" variant="tonal" rounded="lg" class="mt-4">
          Mot de passe mis à jour ! Redirection dans 5s…
        </v-alert>
      </div>

      <v-btn variant="text" size="small" to="/login" prepend-icon="mdi-arrow-left" class="mt-4 d-block mx-auto" color="secondary">
        Retour à la connexion
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref(1)
const email = ref('')
const sent = ref(false)
const loading = ref(false)
const newPwd = ref('')
const confirmPwd = ref('')
const showPwd = ref(false)
const success = ref(false)

const maskedEmail = computed(() => {
  if (!email.value) return ''
  const [local, domain] = email.value.split('@')
  return `${local.slice(0,2)}***@${domain}`
})

const criteria = computed(() => [
  { label: '≥ 12 caractères', met: newPwd.value.length >= 12 },
  { label: 'Au moins une majuscule', met: /[A-Z]/.test(newPwd.value) },
  { label: 'Au moins un chiffre', met: /[0-9]/.test(newPwd.value) },
  { label: 'Caractère spécial (!@#$…)', met: /[^a-zA-Z0-9]/.test(newPwd.value) },
])

const strength = computed(() => criteria.value.filter(c => c.met).length)
const strengthLabel = computed(() => ['', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength.value])
const strengthColor = computed(() => ['', 'error', 'warning', 'info', 'success'][strength.value])

const sendReset = () => {
  loading.value = true
  setTimeout(() => { loading.value = false; sent.value = true }, 800)
}

const savePassword = () => {
  if (newPwd.value !== confirmPwd.value) return
  loading.value = true
  setTimeout(() => {
    loading.value = false
    success.value = true
    setTimeout(() => router.push('/login'), 5000)
  }, 800)
}
</script>
