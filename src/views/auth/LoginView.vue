<template>
  <!-- ─── Formulaire de connexion (centré, limité à 440px) ─────────────────── -->
  <v-card rounded="xl" elevation="0" class="mx-auto mb-6"
    style="background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);max-width:440px">
    <v-card-text class="pa-8">
      <div class="text-center mb-6">
        <h2 style="font-size:1.3rem;font-weight:700;color:#1A2332">Connexion à OASE</h2>
        <p class="text-medium-emphasis text-body-2 mt-1">Espace sécurisé — Réservé aux agents habilités</p>
      </div>

      <!-- Language selector -->
      <div class="d-flex justify-end mb-4">
        <v-btn-toggle v-model="lang" density="compact" rounded="pill" variant="outlined" mandatory>
          <v-btn value="fr" size="x-small">FR</v-btn>
          <v-btn value="en" size="x-small">EN</v-btn>
        </v-btn-toggle>
      </div>

      <!-- Lock alert after 5 attempts -->
      <v-alert v-if="locked" type="error" variant="tonal" rounded="lg" class="mb-4" title="Compte temporairement verrouillé">
        Trop de tentatives échouées. Réessayez dans <strong>{{ lockTimer }}s</strong>.
      </v-alert>

      <v-form ref="formRef" @submit.prevent="handleLogin">
        <v-text-field
          v-model="email"
          label="Identifiant (e-mail institutionnel ou RCCM)"
          prepend-inner-icon="mdi-account"
          :rules="[v => !!v || 'Champ requis', v => /.+@.+\..+/.test(v) || 'Format e-mail invalide']"
          class="mb-3"
          autofocus
        />
        <v-text-field
          v-model="password"
          label="Mot de passe"
          :type="showPass ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPass = !showPass"
          :rules="[v => !!v || 'Champ requis']"
          class="mb-2"
        />

        <div class="d-flex justify-space-between mb-4">
          <v-btn variant="text" size="small" color="primary" to="/reset-password">Mot de passe oublié ?</v-btn>
          <v-btn variant="text" size="small" color="primary" to="/activate">Première connexion</v-btn>
        </div>

        <v-alert v-if="loginError" type="error" variant="tonal" rounded="lg" class="mb-4" density="compact">
          Identifiant ou mot de passe incorrect. Tentative {{ attempts }}/5.
        </v-alert>

        <!-- Erreur technique (serveur injoignable, 5xx) : JAMAIS présentée comme
             un mot de passe incorrect et ne compte pas dans les 5 tentatives. -->
        <v-alert v-if="serverError" type="warning" variant="tonal" rounded="lg" class="mb-4" density="compact">
          Service temporairement indisponible ou connexion interrompue. Vérifiez votre connexion et réessayez dans quelques instants.
        </v-alert>

        <v-alert v-if="validationError" type="error" variant="tonal" rounded="lg" class="mb-4" density="compact">
          {{ validationError }}
        </v-alert>

        <v-btn type="submit" color="primary" block size="large" rounded="lg" :loading="loading" prepend-icon="mdi-login">
          Se connecter
        </v-btn>
      </v-form>

      <!-- Legal banner -->
      <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mt-4" style="font-size:0.72rem">
        Accès réservé aux agents habilités. Toute connexion est journalisée conformément à la politique de sécurité MEF/DSI.
      </v-alert>
    </v-card-text>
  </v-card>

  <!-- ─── Bouton accès démo (uniquement en mode démo / développeur) ────────── -->
  <div v-if="isDemoMode" class="text-center mt-4">
    <v-btn
      to="/demo"
      variant="tonal"
      color="white"
      rounded="pill"
      size="small"
      prepend-icon="mdi-television-play"
    >
      Accès rapide maquette (démo)
    </v-btn>
    <div class="mt-2" style="font-size:0.72rem;color:rgba(255,255,255,0.65)">
      Découverte des profils, espaces personnalisés et dashboards dédiés
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, ApiError } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { useDemoMode } from '../../composables/useDemoMode'
import { getDefaultRouteForRole } from '../../composables/useDefaultRoute'

const router = useRouter()
const auth = useAuthStore()
const { isDemoMode } = useDemoMode()
const formRef = ref()
// Identifiants volontairement vides : OASE-112 [QA][Phase 2] - aucun email/password
// pré-rempli en prod (cf. plan purge OASE / checklist go-live).
// En mode démo (`VITE_DEMO_MODE=true`), les comptes de test sont affichés sur
// la page d'accueil (cf. DemoView) et copiables à la main.
const email = ref('')
const password = ref('')
const showPass = ref(false)
const loading = ref(false)
const loginError = ref(false)
const serverError = ref(false)
const validationError = ref('')
const locked = ref(false)
const lockTimer = ref(60)
const attempts = ref(0)
const lang = ref('fr')

let lockInterval: ReturnType<typeof setInterval> | undefined

function verrouillerLocalement() {
  // Verrou cosmétique côté UI (le vrai verrou est appliqué par le backend :
  // securite.verrouillage.tentatives_max=5, duree_minutes=15). Après 5 échecs
  // RÉELS d'identifiants, on bloque le formulaire 60 s pour décourager le forcing.
  locked.value = true
  lockTimer.value = 60
  lockInterval = setInterval(() => {
    lockTimer.value--
    if (lockTimer.value <= 0) {
      clearInterval(lockInterval)
      locked.value = false
      attempts.value = 0
    }
  }, 1000)
}

const handleLogin = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  if (locked.value) return
  loading.value = true
  loginError.value = false
  serverError.value = false
  validationError.value = ''

  try {
    const res = await api<{ access_token?: string; refresh_token?: string; mfa_required?: boolean; mfa_token?: string; canal?: string; user?: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    // Succès : le compteur de tentatives repart à zéro
    attempts.value = 0

    // OASE [BUG #11] fix : le backend renvoie { mfa_required, mfa_token, canal } SANS
    // champ user — l'ancienne condition (res.mfa_required && res.user) n'était jamais
    // vraie et l'utilisateur MFA recevait « identifiants incorrects ». On stocke le
    // mfa_token temporaire pour la page /mfa (pas de session tant que le code n'est
    // pas vérifié).
    if (res.mfa_required && res.mfa_token) {
      sessionStorage.setItem('oase_mfa_token', res.mfa_token)
      sessionStorage.setItem('oase_mfa_canal', res.canal ?? 'totp')
      return router.push('/mfa')
    }

    if (res.access_token && res.user) {
      auth.setSession(res.access_token, res.user)
      // OASE [BUG #2] fix : on redirige vers le dashboard par défaut du rôle
      // de l'utilisateur (ex: admin → /admin/utilisateurs, agent_otr → /backoffice/dashboard).
      // Auparavant, on pushait '/' qui redirigeait inconditionnellement vers /login → cercle vicieux.
      const target = getDefaultRouteForRole(res.user.role)
      return router.push(target)
    }

    loginError.value = true
  } catch (e) {
    // [Recette 29/07] Distinction honnête des causes d'échec :
    // - 401 = identifiants rejetés → SEUL cas qui incrémente le compteur de tentatives
    // - 400 = validation (format) → message métier, pas de « mot de passe incorrect »
    // - réseau / 5xx = erreur technique → message dédié, compteur inchangé
    // (avant ce fix, une coupure serveur pendant un redéploiement affichait
    // « Identifiant ou mot de passe incorrect. Tentative X/5 » à tort).
    if (e instanceof ApiError && e.status === 401) {
      attempts.value++
      loginError.value = true
      if (attempts.value >= 5) {
        loginError.value = false
        verrouillerLocalement()
      }
    } else if (e instanceof ApiError && e.status === 400) {
      validationError.value = e.message || 'Requête invalide — vérifiez les champs saisis.'
    } else {
      serverError.value = true
    }
  } finally {
    loading.value = false
  }
}
</script>
