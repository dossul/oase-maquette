<template>
  <v-container fluid class="py-8 px-4 px-md-8" style="background:linear-gradient(135deg,#0A2540 0%,#0E3A6B 100%);min-height:100vh">
    <!-- En-tête démo -->
    <div class="text-center mb-6">
      <div class="d-inline-flex align-center ga-2 px-3 py-1 rounded-pill mb-3"
        style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3)">
        <v-icon icon="mdi-television-play" color="white" size="18" />
        <span style="font-size:0.85rem;font-weight:600;color:#fff;letter-spacing:0.08em;text-transform:uppercase">
          Mode démo / développeur
        </span>
      </div>
      <h1 class="text-h4 text-white font-weight-bold mb-2">Catalogue des profils OASE</h1>
      <div style="font-size:0.9rem;color:rgba(255,255,255,0.78);max-width:680px;margin:0 auto">
        Découverte des profils, espaces personnalisés et dashboards dédiés.
        Cette page n'est accessible qu'en mode démo ou développeur — jamais en production.
      </div>
    </div>

    <!-- Row 1 : Espaces métier | Espaces transverses -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.95);backdrop-filter:blur(20px)">
          <v-card-text class="pa-5">
            <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-3 d-flex align-center ga-2">
              <v-icon icon="mdi-briefcase-outline" size="16" />
              Espaces métier
            </div>
            <v-row dense>
              <v-col v-for="p in metierPersonas" :key="p.route" cols="6" sm="4">
                <v-btn :to="p.route" block variant="tonal" size="small" :color="p.color" class="text-none">
                  {{ p.label }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.95);backdrop-filter:blur(20px)">
          <v-card-text class="pa-5">
            <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-3 d-flex align-center ga-2">
              <v-icon icon="mdi-earth" size="16" />
              Espaces transverses et publics
            </div>
            <v-row dense>
              <v-col v-for="p in transversePersonas" :key="p.route" cols="6" sm="4">
                <v-btn :to="p.route" block variant="tonal" size="small" :color="p.color" class="text-none">
                  {{ p.label }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Row 2 : Parcours de démo recommandés -->
    <v-row class="mt-2">
      <v-col cols="12">
        <v-card rounded="xl" elevation="0" style="background:rgba(255,255,255,0.95);backdrop-filter:blur(20px)">
          <v-card-text class="pa-5">
            <div class="d-flex align-center ga-2 mb-4">
              <v-icon icon="mdi-map-marker-path" color="primary" size="20" />
              <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis">Parcours de démo recommandés</span>
              <v-chip size="x-small" color="success" variant="tonal">{{ parcours.length }} parcours</v-chip>
            </div>
            <v-row dense>
              <v-col v-for="(p, i) in parcours" :key="i" cols="12" md="6">
                <v-card variant="outlined" rounded="lg" class="mb-2" :color="p.color">
                  <v-card-text class="pa-3">
                    <div class="d-flex align-start ga-2">
                      <v-icon :icon="p.icon" :color="p.color" size="20" class="mt-1 flex-shrink-0" />
                      <div class="flex-grow-1">
                        <div class="text-body-2 font-weight-semibold mb-1" :style="`color:var(--v-theme-${p.color})`">
                          {{ p.titre }}
                        </div>
                        <div class="text-caption text-medium-emphasis" style="white-space:normal;line-height:1.55">
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
                            class="text-none"
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

    <!-- Footer retour login -->
    <div class="text-center mt-6">
      <v-btn variant="text" color="white" prepend-icon="mdi-arrow-left" to="/login" class="text-none">
        Retour à la connexion
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
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
    description: 'Décideur (UPF/MEF) consulte le registre central à 360° par contribuable → Analyse sectorielle par régime et impôt → Simulation prospective de l\'impact de réforme → Rapport annuel automatisé vers DGBF → Publication open data pour la transparence fiscale',
    liens: [
      { label: 'Décideur', route: '/decideur/dashboard' },
      { label: 'Registre central', route: '/decideur/registre-central' },
      { label: 'Simulation', route: '/decideur/simulation' },
      { label: 'Open Data', route: '/opendata' },
    ],
  },
]
</script>