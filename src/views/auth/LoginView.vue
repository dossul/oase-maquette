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

  <!-- ─── Section démo ──────────────────────────────────────────────────────── -->
  <div>
    <!-- En-tête démo -->
    <div class="text-center mb-4">
      <div class="d-inline-flex align-center ga-2 px-3 py-1 rounded-pill mb-2"
        style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3)">
        <v-icon icon="mdi-television-play" color="white" size="16" />
        <span style="font-size:0.78rem;font-weight:600;color:#fff;letter-spacing:0.08em;text-transform:uppercase">
          Accès rapide maquette (démo)
        </span>
      </div>
      <div style="font-size:0.78rem;color:rgba(255,255,255,0.75)">
        Découverte des profils, espaces personnalisés et dashboards dédiés
      </div>
    </div>

    <!-- Row 1 : Espaces métier | Espaces transverses -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.88);height:100%">
          <v-card-text class="pa-4">
            <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-3 d-flex align-center ga-1">
              <v-icon icon="mdi-briefcase-outline" size="14" />
              Espaces métier
            </div>
            <v-row dense>
              <v-col v-for="p in metierPersonas" :key="p.route" cols="6" sm="4">
                <v-btn :to="p.route" block variant="tonal" size="x-small" :color="p.color">
                  {{ p.label }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.88);height:100%">
          <v-card-text class="pa-4">
            <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-3 d-flex align-center ga-1">
              <v-icon icon="mdi-earth" size="14" />
              Espaces transverses et publics
            </div>
            <v-row dense>
              <v-col v-for="p in transversePersonas" :key="p.route" cols="6" sm="4">
                <v-btn :to="p.route" block variant="tonal" size="x-small" :color="p.color">
                  {{ p.label }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 2 : Parcours de démo recommandés -->
    <v-row class="mt-1">
      <v-col cols="12">
        <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.88)">
          <v-card-text class="pa-4">
            <div class="d-flex align-center ga-2 mb-3">
              <v-icon icon="mdi-map-marker-path" color="primary" size="18" />
              <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Parcours de démo recommandés</span>
              <v-chip size="x-small" color="success" variant="tonal">6 parcours</v-chip>
            </div>
            <v-row dense>
              <v-col v-for="(p, i) in parcours" :key="i" cols="12" md="6">
                <v-card variant="outlined" rounded="lg" class="mb-2" :color="p.color">
                  <v-card-text class="pa-3">
                    <div class="d-flex align-start ga-2">
                      <v-icon :icon="p.icon" :color="p.color" size="18" class="mt-1 flex-shrink-0" />
                      <div>
                        <div class="text-body-2 font-weight-semibold mb-1" :style="`color:var(--v-theme-${p.color})`">
                          {{ p.titre }}
                        </div>
                        <div class="text-caption text-medium-emphasis" style="white-space:normal;line-height:1.5">
                          {{ p.description }}
                        </div>
                        <div class="d-flex flex-wrap ga-1 mt-2">
                          <v-btn
                            v-for="lien in p.liens"
                            :key="lien.route"
                            :to="lien.route"
                            size="x-small"
                            variant="tonal"
                            :color="p.color"
                          >{{ lien.label }}</v-btn>
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref()
const email = ref('k.abalo@otr.tg')
const password = ref('••••••••')
const showPass = ref(false)
const loading = ref(false)
const loginError = ref(false)
const locked = ref(false)
const lockTimer = ref(60)
const attempts = ref(0)
const lang = ref('fr')

const handleLogin = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  loading.value = true
  loginError.value = false
  attempts.value++

  try {
    const res = await api<{ accessToken?: string; mfaRequired?: boolean; user?: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    if (res.mfaRequired) {
      localStorage.setItem('mfa_pending', 'true')
      return router.push('/mfa')
    }

    if (res.accessToken && res.user) {
      auth.setSession(res.accessToken, res.user)
      return router.push('/')
    }

    loginError.value = true
  } catch (e) {
    loginError.value = true
  } finally {
    loading.value = false
  }
}

const metierPersonas = [
  { label: 'Contribuable', route: '/portail/dashboard', color: 'info' },
  { label: 'Agent OTR', route: '/backoffice/dashboard', color: 'primary' },
  { label: 'DGBF', route: '/backoffice/budget', color: 'secondary' },
  { label: 'DGTCP / GUDEF', route: '/tresor/dashboard', color: 'indigo' },
  { label: 'Agence ZF', route: '/agences/dashboard', color: 'success' },
  { label: 'Ministère', route: '/ministeres/dashboard', color: 'cyan-darken-1' },
  { label: 'MAE', route: '/mae/accords-siege', color: 'blue-grey' },
  { label: 'Extractif', route: '/extractif/dashboard', color: 'brown' },
  { label: 'Décideur', route: '/decideur/dashboard', color: 'warning' },
  { label: 'Auditeur', route: '/audit/dashboard', color: 'error' },
]

const transversePersonas = [
  { label: 'CONEDEF', route: '/conedef/dashboard', color: 'pink-darken-1' },
  { label: 'DSI / MEF', route: '/dsi/dashboard', color: 'grey-darken-2' },
  { label: 'Open Data', route: '/opendata', color: 'teal' },
  { label: 'Mobile MVP', route: '/mobile/mvp', color: 'light-blue-darken-2' },
  { label: 'Admin DSI', route: '/admin/utilisateurs', color: 'deep-purple' },
  { label: 'Registre central', route: '/decideur/registre-central', color: 'blue-grey' },
  { label: 'Requêtes', route: '/admin/requetes-dynamiques', color: 'green-darken-1' },
  { label: 'Notifications', route: '/notifications', color: 'orange' },
]

const parcours = [
  {
    titre: 'Processus n°1 — Exonération impôts intérieurs',
    icon: 'mdi-receipt-text-check',
    color: 'primary',
    description: 'Contribuable dépose une demande de franchise TVA/IS → Upload des pièces via modals contextuels → Agent OTR instruit le dossier → Validation hiérarchique CI/DGE → Attestation émise dans E-TAX en < 15 jours',
    liens: [
      { label: 'Nouvelle demande', route: '/portail/nouvelle-demande' },
      { label: 'Workflow CI/OTR', route: '/backoffice/workflow-ci-otr' },
      { label: 'Validation', route: '/backoffice/dossiers/1/validation' },
    ],
  },
  {
    titre: 'Processus n°2 — Franchise douanière CDDI',
    icon: 'mdi-ferry',
    color: 'info',
    description: 'Contribuable saisit une déclaration SYDONIAWORLD (maritime ou aérien) → Documents contextuels BL/LTA + factures fiche 34 → Circuit de validation séquentiel 4 sous-étapes (2a Vérificateur → 2d Directeur CDDI) → Liquidation GESTEXO → Quittancement émis',
    liens: [
      { label: 'Nouvelle demande (CDDI)', route: '/portail/nouvelle-demande' },
      { label: 'Workflow CDDI', route: '/backoffice/workflow-cddi' },
    ],
  },
  {
    titre: 'Processus n°3 — Régime Zone Franche (API-ZF)',
    icon: 'mdi-factory',
    color: 'success',
    description: 'Promoteur dépose demande d\'agrément ZF → API-ZF évalue critères (investissement, emplois, export) → Agrément provisoire (11-33j) puis définitif (52-107j) → NIF mappé E-TAX + SYDONIAWORLD → Contrôle annuel des engagements → Alerte J-90 avant expiration',
    liens: [
      { label: 'Agréments ZF', route: '/agences/agrements' },
      { label: 'Engagements', route: '/agences/engagements' },
      { label: 'Registre central', route: '/decideur/registre-central' },
    ],
  },
  {
    titre: 'Processus n°4 — Code des Investissements (API-ZF / OTR)',
    icon: 'mdi-domain',
    color: 'indigo',
    description: 'Investisseur dépose dossier auprès de l\'API-ZF → Évaluation grille de classement (zone 1-5, secteur, montant, emplois) → Arrêté de classement signé par le Ministère (régime A/B/C) → NIF mappé E-TAX + CIBIM + DLFC → Suivi des conditions → Alerte J-90 expiration',
    liens: [
      { label: 'Agences dashboard', route: '/agences/dashboard' },
      { label: 'Conventions', route: '/agences/conventions' },
      { label: 'Registre central', route: '/decideur/registre-central' },
    ],
  },
  {
    titre: 'Processus n°6 — Accords de siège (OI / Ambassades)',
    icon: 'mdi-flag',
    color: 'blue-grey',
    description: 'MAE notifie l\'OTR avec bases juridiques multiples (Convention de Vienne, Accord ONU-Togo 1968, CGI, conventions bilatérales) → Application TVA/IRPP par CI et franchises douanières CDDI → Mise à jour annuelle listes personnel → Alerte J-90 expiration accord',
    liens: [
      { label: 'Accords de siège', route: '/mae/accords-siege' },
      { label: 'Workflow CDDI', route: '/backoffice/workflow-cddi' },
      { label: 'Audit anomalies', route: '/audit/anomalies' },
    ],
  },
  {
    titre: 'Pilotage décisionnel et transparence budgétaire',
    icon: 'mdi-chart-areaspline',
    color: 'warning',
    description: 'Décideur (UPF/MEF) consulte le registre central à 360° par bénéficiaire → Analyse sectorielle par régime et impôt → Simulation prospective de l\'impact de réforme → Rapport annuel automatisé vers DGBF → Publication open data pour la transparence fiscale',
    liens: [
      { label: 'Décideur', route: '/decideur/dashboard' },
      { label: 'Registre central', route: '/decideur/registre-central' },
      { label: 'Simulation', route: '/decideur/simulation' },
      { label: 'Open Data', route: '/opendata' },
    ],
  },
]
</script>
