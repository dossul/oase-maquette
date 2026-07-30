<template>
  <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.95)">
    <v-card-text class="pa-8">
      <div class="text-center mb-6">
        <v-avatar color="warning" size="56" rounded="lg" class="mb-3">
          <v-icon icon="mdi-lock-reset" size="28" color="white" />
        </v-avatar>
        <h2 style="font-size:1.3rem;font-weight:700;color:#1A2332">Réinitialisation du mot de passe</h2>
      </div>

      <!-- Étape 1 : demande du code par e-mail -->
      <div v-if="step === 1">
        <p class="text-body-2 text-medium-emphasis text-center mb-5">
          Saisissez votre adresse e-mail. Si un compte actif y correspond, un code de réinitialisation vous sera envoyé (valable 15 minutes).
        </p>
        <v-text-field v-model="email" label="Adresse e-mail" prepend-inner-icon="mdi-email"
          :rules="[v => !!v || 'Requis', v => /.+@.+\..+/.test(v) || 'Format invalide']"
          :disabled="sent" class="mb-4" @keyup.enter="sendReset" />

        <v-alert v-if="sent" type="success" variant="tonal" rounded="lg" class="mb-4">
          {{ messageSucces }}
        </v-alert>
        <v-alert v-if="erreur" type="error" variant="tonal" rounded="lg" class="mb-4">{{ erreur }}</v-alert>

        <v-btn v-if="!sent" color="primary" block size="large" rounded="lg" :loading="loading"
          :disabled="!/.+@.+\..+/.test(email)" @click="sendReset" prepend-icon="mdi-send">
          Envoyer le code de réinitialisation
        </v-btn>
        <template v-else>
          <v-btn color="primary" block size="large" rounded="lg" @click="step = 2" prepend-icon="mdi-arrow-right">
            J'ai reçu le code
          </v-btn>
          <v-btn variant="text" block class="mt-2" :loading="loading" @click="sendReset">
            Renvoyer le code
          </v-btn>
        </template>
      </div>

      <!-- Étape 2 : code + nouveau mot de passe -->
      <div v-else-if="step === 2">
        <v-text-field v-model="code" label="Code à 6 chiffres reçu par e-mail" prepend-inner-icon="mdi-numeric"
          maxlength="6" :rules="[v => /^\d{6}$/.test(v) || '6 chiffres requis']" class="mb-3" />

        <v-text-field v-model="newPwd" label="Nouveau mot de passe" :type="showPwd ? 'text' : 'password'"
          :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showPwd = !showPwd"
          prepend-inner-icon="mdi-lock" class="mb-3" />

        <!-- Indicateur de force — règles alignées sur le backend (min 10, 1 maj, 1 chiffre, 1 spécial) -->
        <div class="mb-4">
          <div class="d-flex ga-1 mb-2">
            <div v-for="i in 4" :key="i" :style="{ flex: 1, height: '4px', borderRadius: '2px', background: i <= strength ? strengthColor : '#E5E7EB', transition: 'background 0.3s' }" />
          </div>
          <div class="mt-2">
            <div v-for="c in criteria" :key="c.label" class="d-flex align-center ga-1 mb-1">
              <v-icon :icon="c.met ? 'mdi-check-circle' : 'mdi-circle-outline'" :color="c.met ? 'success' : 'default'" size="14" />
              <span class="text-caption" :class="c.met ? 'text-success' : 'text-medium-emphasis'">{{ c.label }}</span>
            </div>
          </div>
        </div>

        <v-text-field v-model="confirmPwd" label="Confirmation du mot de passe" type="password"
          prepend-inner-icon="mdi-lock-check"
          :error-messages="confirmPwd && confirmPwd !== newPwd ? ['Les mots de passe ne correspondent pas'] : []"
          class="mb-4" @keyup.enter="savePassword" />

        <v-alert v-if="erreur" type="error" variant="tonal" rounded="lg" class="mb-4">{{ erreur }}</v-alert>

        <v-btn color="primary" block size="large" rounded="lg" :loading="loading"
          :disabled="!formValide" @click="savePassword" prepend-icon="mdi-content-save">
          Enregistrer le nouveau mot de passe
        </v-btn>
        <v-btn variant="text" block class="mt-2" @click="step = 1; erreur = ''">
          ← Modifier l'adresse e-mail
        </v-btn>
      </div>

      <!-- Étape 3 : succès -->
      <div v-else class="text-center">
        <v-icon icon="mdi-check-circle" color="success" size="56" class="mb-3" />
        <p class="text-body-1 mb-2"><strong>Mot de passe réinitialisé avec succès.</strong></p>
        <p class="text-body-2 text-medium-emphasis mb-4">Toutes vos sessions ont été fermées. Connectez-vous avec votre nouveau mot de passe.</p>
        <v-btn color="primary" rounded="lg" to="/login" prepend-icon="mdi-login">Aller à la connexion</v-btn>
      </div>

      <v-btn v-if="step !== 3" variant="text" size="small" to="/login" prepend-icon="mdi-arrow-left" class="mt-4 d-block mx-auto" color="secondary">
        Retour à la connexion
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api, ApiError } from '../../services/api'

const step = ref(1)
const email = ref('')
const sent = ref(false)
const loading = ref(false)
const code = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const showPwd = ref(false)
const erreur = ref('')
const messageSucces = ref('')

// Règles strictement identiques au DTO backend (min 10 + maj + chiffre + spécial)
const criteria = computed(() => [
  { label: 'Au moins 10 caractères', met: newPwd.value.length >= 10 },
  { label: 'Au moins une majuscule', met: /[A-Z]/.test(newPwd.value) },
  { label: 'Au moins un chiffre', met: /[0-9]/.test(newPwd.value) },
  { label: 'Caractère spécial (!@#$…)', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPwd.value) },
])

const strength = computed(() => criteria.value.filter(c => c.met).length)
const strengthColor = computed(() => ['', 'error', 'warning', 'info', 'success'][strength.value])
const formValide = computed(() =>
  /^\d{6}$/.test(code.value) &&
  criteria.value.every(c => c.met) &&
  confirmPwd.value === newPwd.value,
)

const sendReset = async () => {
  loading.value = true
  erreur.value = ''
  try {
    const res = await api<{ data: { message: string } }>('/auth/password/reset-request', {
      method: 'POST',
      body: JSON.stringify({ email: email.value.trim() }),
    })
    messageSucces.value = res.data.message
    sent.value = true
  } catch (e) {
    erreur.value = e instanceof ApiError ? e.message : 'Erreur réseau — réessayez.'
  } finally {
    loading.value = false
  }
}

const savePassword = async () => {
  if (!formValide.value) return
  loading.value = true
  erreur.value = ''
  try {
    await api('/auth/password/reset-confirm', {
      method: 'POST',
      body: JSON.stringify({
        email: email.value.trim(),
        code: code.value,
        newPassword: newPwd.value,
        newPasswordConfirm: confirmPwd.value,
      }),
    })
    step.value = 3
  } catch (e) {
    erreur.value = e instanceof ApiError ? e.message : 'Erreur réseau — réessayez.'
  } finally {
    loading.value = false
  }
}
</script>
