<template>
  <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.95)">
    <v-card-text class="pa-8">
      <div class="text-center mb-4">
        <v-avatar color="success" size="56" rounded="lg" class="mb-3">
          <v-icon icon="mdi-account-check" size="28" color="white" />
        </v-avatar>
        <h2 style="font-size:1.3rem;font-weight:700;color:#1A2332">Activation de votre compte</h2>
        <p class="text-medium-emphasis text-body-2 mt-1">Bienvenue, <strong>{{ profile.prenom }}</strong> — {{ profile.structure }}</p>
      </div>

      <!-- Stepper -->
      <v-stepper v-model="step" :items="steps" flat class="mb-4" style="box-shadow:none">
        <template #item.1>
          <div class="pa-2">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="profile.prenom" label="Prénom" prepend-inner-icon="mdi-account" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="profile.nom" label="Nom" prepend-inner-icon="mdi-account" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="profile.poste" label="Poste / Fonction" prepend-inner-icon="mdi-briefcase" class="mb-3" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="profile.tel" label="Téléphone de service" prepend-inner-icon="mdi-phone" class="mb-3" />
              </v-col>
            </v-row>
          </div>
        </template>

        <template #item.2>
          <div class="pa-2">
            <v-text-field v-model="newPwd" label="Mot de passe" :type="showPwd ? 'text' : 'password'" :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showPwd = !showPwd" prepend-inner-icon="mdi-lock" class="mb-3" />
            <div class="d-flex ga-1 mb-3">
              <div v-for="i in 4" :key="i" :style="{ flex:1, height:'4px', borderRadius:'2px', background: i <= strength ? strengthColors[strength-1] : '#E5E7EB' }" />
            </div>
            <v-text-field v-model="confirmPwd" label="Confirmer le mot de passe" type="password" prepend-inner-icon="mdi-lock-check" :error-messages="confirmPwd && confirmPwd !== newPwd ? ['Ne correspond pas'] : []" />
          </div>
        </template>

        <template #item.3>
          <div class="pa-2">
            <v-alert type="info" variant="tonal" rounded="lg" class="mb-4">
              L'authentification à deux facteurs renforce la sécurité de votre compte.
            </v-alert>
            <v-radio-group v-model="mfaMethod">
              <v-radio value="sms" label="SMS sur mon téléphone de service" />
              <v-radio value="totp" label="Application d'authentification (TOTP)" />
              <v-radio value="skip" label="Configurer plus tard (déconseillé)" />
            </v-radio-group>
            <v-text-field v-if="mfaMethod === 'sms'" v-model="profile.tel" label="Numéro de téléphone" prepend-inner-icon="mdi-phone" class="mt-2" />
          </div>
        </template>

        <template #item.4>
          <div class="pa-2">
            <v-alert type="warning" variant="tonal" rounded="lg" class="mb-4">
              Veuillez lire et accepter les conditions d'utilisation avant d'activer votre compte.
            </v-alert>
            <v-card variant="outlined" rounded="lg" class="mb-4 pa-4" style="max-height:150px;overflow-y:auto;font-size:0.8rem;color:#555">
              Les utilisateurs de la plateforme OASE s'engagent à utiliser le système uniquement dans le cadre de leurs fonctions officielles. Toute action est journalisée et peut faire l'objet d'un contrôle. L'accès non autorisé à des données confidentielles est passible de sanctions disciplinaires et pénales conformément à la législation togolaise en vigueur.
            </v-card>
            <v-checkbox v-model="accepted" label="J'ai lu et j'accepte les Conditions d'utilisation et la Politique de confidentialité" :rules="[v => !!v || 'Obligatoire']" />
          </div>
        </template>
      </v-stepper>

      <div class="d-flex ga-3 justify-end">
        <v-btn v-if="step > 1" variant="tonal" @click="step--">Précédent</v-btn>
        <v-btn v-if="step < 4" color="primary" @click="step++">Suivant</v-btn>
        <v-btn v-else color="success" :disabled="!accepted" :loading="loading" @click="activate" prepend-icon="mdi-check-circle">
          Activer mon compte
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref(1)
const steps = ['Profil', 'Mot de passe', 'MFA', 'Conditions']
const profile = ref({ prenom: 'Kofi', nom: 'ABALO', poste: 'Agent instructeur', tel: '+228 90 00 00 00', structure: 'OTR Douanes' })
const newPwd = ref('')
const confirmPwd = ref('')
const showPwd = ref(false)
const mfaMethod = ref('sms')
const accepted = ref(false)
const loading = ref(false)
const strengthColors = ['#C62828', '#E65100', '#0277BD', '#1B8F4C']

const strength = computed(() => {
  let s = 0
  if (newPwd.value.length >= 12) s++
  if (/[A-Z]/.test(newPwd.value)) s++
  if (/[0-9]/.test(newPwd.value)) s++
  if (/[^a-zA-Z0-9]/.test(newPwd.value)) s++
  return s
})

const activate = () => {
  loading.value = true
  setTimeout(() => router.push('/portail/dashboard'), 1000)
}
</script>
