<template>
  <div>
    <PageHeader
      title="Supervision CDDI — Franchises douanières"
      subtitle="Processus n° 2 — Lecture consolidée depuis GESTEXO / SYDONIAWORLD"
      icon="mdi-ferry"
    >
      <template #actions>
        <v-chip color="success" variant="tonal" size="small" prepend-icon="mdi-check-circle">
          Circuit dématérialisé depuis 2022
        </v-chip>
        <v-chip color="info" variant="tonal" size="small" prepend-icon="mdi-api" class="ms-2">
          GESTEXO → OASE (lecture seule)
        </v-chip>
        <ExportButton
          label="Exporter"
          policy-label="Diffusion douanière"
          restriction-note="Export réservé aux habilitations douane et audit"
          :disabled-formats="['excel']"
          class="ms-2"
          @export="() => {}"
        />
      </template>
    </PageHeader>

    <!-- Bandeau positionnement OASE -->
    <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-5" prepend-icon="mdi-information-outline">
      <strong>OASE ne recrée pas ce circuit.</strong>
      Le traitement des franchises douanières est entièrement opéré dans <strong>SYDONIAWORLD</strong> (étapes 1–2d) et <strong>GESTEXO</strong> (liquidation, quittancement, reporting).
      OASE supervise, consolide et alerte — il lit les statuts depuis GESTEXO via API et détecte les anomalies de délai ou de traçabilité.
    </v-alert>

    <!-- KPIs -->
    <v-row class="mb-5">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <!-- Onglets principaux -->
    <v-card rounded="lg" elevation="1" class="mb-5">
      <v-tabs v-model="mainTab" color="primary" density="comfortable" class="px-2 pt-2">
        <v-tab value="accordees" prepend-icon="mdi-check-circle-outline">
          Accordées
          <v-chip size="x-small" color="success" variant="tonal" class="ms-2">{{ accordees.length }}</v-chip>
        </v-tab>
        <v-tab value="encours" prepend-icon="mdi-clock-outline">
          En cours d'instruction
          <v-chip size="x-small" color="warning" variant="tonal" class="ms-2">{{ enCours.length }}</v-chip>
        </v-tab>
        <v-tab value="rejets" prepend-icon="mdi-close-circle-outline">
          Rejetées / bloquées
          <v-chip size="x-small" color="error" variant="tonal" class="ms-2">{{ rejetes.length }}</v-chip>
        </v-tab>
        <v-tab value="alertes" prepend-icon="mdi-alarm">
          Alertes délai
          <v-chip size="x-small" color="error" variant="tonal" class="ms-2">{{ alertesDelai.length }}</v-chip>
        </v-tab>
      </v-tabs>
      <v-divider />

      <v-window v-model="mainTab">

        <!-- ── Onglet 1 : Accordées (données GESTEXO) ────────────────────── -->
        <v-window-item value="accordees">
          <v-card-text class="pa-4">
            <v-alert type="success" variant="tonal" rounded="lg" density="compact" class="mb-4" prepend-icon="mdi-database-check">
              Ces franchises ont franchi l'étape <strong>2d (Directeur CDDI)</strong> dans GESTEXO.
              La référence GESTEXO est la preuve formelle de l'exonération accordée et le point d'entrée du suivi financier OASE.
            </v-alert>
            <v-data-table :headers="headersAccordees" :items="accordees" hover>
              <template #item.refGestexo="{ item }">
                <span class="font-weight-medium text-success">{{ item.refGestexo }}</span>
              </template>
              <template #item.quittance="{ item }">
                <v-chip size="x-small" :color="item.quittance ? 'success' : 'warning'" variant="tonal">
                  {{ item.quittance ? item.quittance : 'En attente' }}
                </v-chip>
              </template>
              <template #item.montant="{ item }">
                <span class="font-weight-medium">{{ item.montant }}</span>
              </template>
              <template #item.regime="{ item }">
                <v-chip size="x-small" :color="regimeColor(item.regime)" variant="tonal">{{ item.regime }}</v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>

        <!-- ── Onglet 2 : En cours ────────────────────────────────────────── -->
        <v-window-item value="encours">
          <v-card-text class="pa-4">
            <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-4" prepend-icon="mdi-clock-alert">
              Circuit séquentiel : <strong>2a → 2b → 2c → 2d</strong> dans SYDONIAWORLD.
              Délai max cumulé : <strong>9 jours ouvrables</strong>. OASE surveille la progression et déclenche une alerte dès le dépassement.
            </v-alert>

            <!-- Pipeline visuel 2a/2b/2c/2d pour chaque dossier en cours -->
            <div v-for="dossier in enCours" :key="dossier.declaration" class="mb-4">
              <v-card variant="outlined" rounded="lg" class="pa-3" :color="dossier.joursEcoules > 9 ? 'error' : undefined">
                <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
                  <div>
                    <span class="text-body-2 font-weight-semibold">{{ dossier.declaration }}</span>
                    <v-chip size="x-small" :color="regimeColor(dossier.regime)" variant="tonal" class="ms-2">{{ dossier.regime }}</v-chip>
                    <v-chip v-if="dossier.joursEcoules > 9" size="x-small" color="error" variant="tonal" class="ms-1" prepend-icon="mdi-alarm">Délai dépassé</v-chip>
                  </div>
                  <div class="text-right text-caption text-medium-emphasis">
                    Déposé le {{ dossier.dateSaisie }} · <strong :class="dossier.joursEcoules > 9 ? 'text-error' : ''">J+{{ dossier.joursEcoules }}</strong>
                  </div>
                </div>
                <!-- Barre de progression 2a→2b→2c→2d -->
                <v-row dense>
                  <v-col v-for="(sous, idx) in sousEtapes" :key="sous.code" cols="3">
                    <v-card
                      :variant="getSousEtapeVariant(dossier, idx)"
                      :color="getSousEtapeColor(dossier, idx)"
                      rounded="lg"
                      class="pa-2 text-center"
                    >
                      <v-icon :icon="getSousEtapeIcon(dossier, idx)" size="16" class="mb-1" />
                      <div class="text-caption font-weight-bold">{{ sous.code }}</div>
                      <div class="text-caption text-medium-emphasis" style="font-size:0.65rem">{{ sous.acteur }}</div>
                    </v-card>
                  </v-col>
                </v-row>
                <div class="text-caption text-medium-emphasis mt-2">
                  <v-icon icon="mdi-information-outline" size="13" /> {{ dossier.remarque }}
                </div>
              </v-card>
            </div>
          </v-card-text>
        </v-window-item>

        <!-- ── Onglet 3 : Rejetées / bloquées ──────────────────────────── -->
        <v-window-item value="rejets">
          <v-card-text class="pa-4">
            <v-alert type="error" variant="tonal" rounded="lg" density="compact" class="mb-4" prepend-icon="mdi-alert-circle">
              Un rejet à n'importe quelle sous-étape renvoie le dossier au <strong>dépôt initial</strong>.
              Aucune régularisation en cours de chaîne n'est possible. Le bénéficiaire doit redéposer une déclaration corrigée.
            </v-alert>
            <v-data-table :headers="headersRejets" :items="rejetes" hover>
              <template #item.etapeRejet="{ item }">
                <v-chip size="x-small" color="error" variant="tonal">{{ item.etapeRejet }}</v-chip>
              </template>
              <template #item.motif="{ item }">
                <span class="text-caption text-error">{{ item.motif }}</span>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>

        <!-- ── Onglet 4 : Alertes délai ─────────────────────────────────── -->
        <v-window-item value="alertes">
          <v-card-text class="pa-4">
            <v-alert type="error" variant="tonal" rounded="lg" density="compact" class="mb-4" prepend-icon="mdi-alarm-light">
              Ces dossiers dépassent le plafond de <strong>9 jours ouvrables</strong> du circuit de validation séquentiel.
              OASE a déclenché une notification automatique vers le <strong>Directeur CDDI</strong>.
            </v-alert>
            <v-row dense>
              <v-col v-for="alerte in alertesDelai" :key="alerte.declaration" cols="12" md="6">
                <v-card variant="tonal" color="error" rounded="lg" class="pa-3 mb-2">
                  <div class="d-flex align-center justify-space-between mb-1">
                    <span class="text-body-2 font-weight-semibold">{{ alerte.declaration }}</span>
                    <v-chip size="x-small" color="error" variant="flat">J+{{ alerte.joursEcoules }}</v-chip>
                  </div>
                  <div class="text-caption">Bloqué à : <strong>{{ alerte.etapeBloquee }}</strong></div>
                  <div class="text-caption text-medium-emphasis mt-1">{{ alerte.motif }}</div>
                  <div class="d-flex ga-2 mt-2">
                    <v-btn size="x-small" variant="tonal" color="error" prepend-icon="mdi-bell-ring">Rappel envoyé</v-btn>
                    <v-btn size="x-small" variant="tonal" color="secondary" prepend-icon="mdi-eye">Voir dans GESTEXO</v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Schéma du circuit (référence) -->
    <v-card rounded="lg" elevation="1" class="mb-5">
      <v-card-title class="pa-4 pb-2 d-flex align-center ga-2 text-body-1 font-weight-semibold">
        <v-icon icon="mdi-sitemap" color="primary" size="20" />
        Circuit Processus n° 2 — Référence institutionnelle
        <v-spacer />
        <v-chip size="x-small" color="secondary" variant="tonal">Lecture seule — opéré dans SYDONIAWORLD + GESTEXO</v-chip>
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <v-row dense>
          <v-col v-for="etape in circuitComplet" :key="etape.id" cols="12" sm="6" md="4" lg="3">
            <v-card
              :variant="etape.highlight ? 'tonal' : 'outlined'"
              :color="etape.highlight ? etape.color : undefined"
              rounded="lg"
              class="pa-3 h-100"
            >
              <div class="d-flex align-center ga-2 mb-2">
                <v-chip :color="etape.color" size="x-small" variant="tonal" class="font-weight-bold">{{ etape.id }}</v-chip>
                <v-icon :icon="etape.icon" :color="etape.color" size="16" />
              </div>
              <div class="text-body-2 font-weight-semibold mb-1">{{ etape.titre }}</div>
              <div class="text-caption text-medium-emphasis mb-1">{{ etape.acteur }}</div>
              <v-chip size="x-small" :color="etape.systeme === 'GESTEXO' ? 'success' : 'info'" variant="outlined" class="mt-1">
                {{ etape.systeme }}
              </v-chip>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Consolidation budgétaire -->
    <v-card rounded="lg" elevation="1">
      <v-card-title class="pa-4 pb-2 d-flex align-center ga-2 text-body-1 font-weight-semibold">
        <v-icon icon="mdi-file-chart" color="secondary" size="20" />
        Consolidation budgétaire mensuelle — Reporting GESTEXO → DAS → DGBF
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <v-row>
          <v-col cols="12" md="8">
            <v-data-table :headers="headersReporting" :items="reportingMensuel" hover density="compact">
              <template #item.montant="{ item }">
                <span class="font-weight-medium">{{ item.montant }}</span>
              </template>
              <template #item.statut="{ item }">
                <v-chip size="x-small" :color="item.statut === 'Transmis DGBF' ? 'success' : 'warning'" variant="tonal">{{ item.statut }}</v-chip>
              </template>
            </v-data-table>
          </v-col>
          <v-col cols="12" md="4">
            <v-card variant="tonal" color="info" rounded="lg" class="pa-4">
              <div class="text-caption font-weight-bold mb-2 text-uppercase">Chaîne de reporting</div>
              <div class="d-flex flex-column ga-2">
                <div v-for="(node, i) in reportingChain" :key="node" class="d-flex align-center ga-2">
                  <v-chip size="x-small" color="info" variant="tonal">{{ node }}</v-chip>
                  <v-icon v-if="i < reportingChain.length - 1" icon="mdi-arrow-down" size="14" color="info" />
                </div>
              </div>
              <v-divider class="my-3" />
              <div class="text-caption text-medium-emphasis">
                OASE extrait l'historique des 3 dernières années depuis <strong>GESTEXO via API</strong>.
                Les données alimentent la colonne « exonérations douanières » des situations de recettes mensuelles de la DGBF.
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import ExportButton from '../../components/ExportButton.vue'

const mainTab = ref('accordees')

// ── Données mock — représentent ce qui est lu depuis GESTEXO ────────────────
const allDossiers = [
  { declaration: 'SW-2026-00482', regime: 'Zone Franche', montant: '84 500 000 FCFA', dateSaisie: '15/05/2026', joursEcoules: 6, etapeActuelle: 2, statut: 'accorde', refGestexo: 'GEST-2026-00482', quittance: 'QUIT-2026-1422', remarque: 'Liquidation enregistrée dans GESTEXO — quittancement émis.' },
  { declaration: 'SW-2026-00483', regime: 'Diplomatique', montant: '12 400 000 FCFA', dateSaisie: '17/05/2026', joursEcoules: 4, etapeActuelle: 1, statut: 'encours', refGestexo: null, quittance: null, remarque: 'Bloqué en 2b — en attente validation Chef de subdivision.' },
  { declaration: 'SW-2026-00484', regime: 'ONG / Projet', montant: '31 900 000 FCFA', dateSaisie: '10/05/2026', joursEcoules: 11, etapeActuelle: 2, statut: 'alerte', refGestexo: null, quittance: null, remarque: 'Délai 9j dépassé — bloqué en 2c depuis 3 jours ouvrables.', etapeBloquee: '2c — Chef de bureau', motif: 'Pièce complémentaire demandée non fournie (Autorisation MAE).' },
  { declaration: 'SW-2026-00485', regime: 'Zone Franche', montant: '22 750 000 FCFA', dateSaisie: '20/05/2026', joursEcoules: 1, etapeActuelle: 0, statut: 'encours', refGestexo: null, quittance: null, remarque: 'Entrée en 2a — vérification technique initiale en cours.' },
  { declaration: 'SW-2026-00480', regime: 'Extractif', montant: '156 200 000 FCFA', dateSaisie: '02/05/2026', joursEcoules: 8, etapeActuelle: 3, statut: 'accorde', refGestexo: 'GEST-2026-00480', quittance: 'QUIT-2026-1398', remarque: 'Toutes les étapes validées — référence GESTEXO générée en étape 2d.' },
  { declaration: 'SW-2026-00479', regime: 'Diplomatique', montant: '8 100 000 FCFA', dateSaisie: '28/04/2026', joursEcoules: 2, etapeActuelle: -1, statut: 'rejete', refGestexo: null, quittance: null, etapeRejet: '2a — Vérificateur', motif: 'Déclaration SYDONIAWORLD incomplète — données tarifaires manquantes. À redéposer.', remarque: '' },
  { declaration: 'SW-2026-00478', regime: 'ONG / Projet', montant: '14 300 000 FCFA', dateSaisie: '25/04/2026', joursEcoules: 13, etapeActuelle: 1, statut: 'alerte', refGestexo: null, quittance: null, etapeBloquee: '2b — Chef de subdivision', motif: 'Dossier incomplet — BL introuvable dans SYDONIAWORLD.', remarque: 'Alerte J+9 envoyée au Directeur CDDI le 06/05/2026.' },
]

const accordees  = computed(() => allDossiers.filter(d => d.statut === 'accorde'))
const enCours    = computed(() => allDossiers.filter(d => d.statut === 'encours'))
const rejetes    = computed(() => allDossiers.filter(d => d.statut === 'rejete'))
const alertesDelai = computed(() => allDossiers.filter(d => d.statut === 'alerte'))

// ── Sous-étapes du circuit séquentiel ───────────────────────────────────────
const sousEtapes = [
  { code: '2a', acteur: 'Vérificateur', systeme: 'SYDONIAWORLD' },
  { code: '2b', acteur: 'Chef subdivision', systeme: 'SYDONIAWORLD' },
  { code: '2c', acteur: 'Chef bureau', systeme: 'SYDONIAWORLD' },
  { code: '2d', acteur: 'Directeur CDDI', systeme: 'GESTEXO' },
]

function getSousEtapeVariant(dossier: typeof allDossiers[0], idx: number) {
  if (idx < dossier.etapeActuelle) return 'tonal'
  if (idx === dossier.etapeActuelle) return 'tonal'
  return 'outlined'
}
function getSousEtapeColor(dossier: typeof allDossiers[0], idx: number) {
  if (idx < dossier.etapeActuelle) return 'success'
  if (idx === dossier.etapeActuelle) return dossier.joursEcoules > 9 ? 'error' : 'warning'
  return undefined
}
function getSousEtapeIcon(dossier: typeof allDossiers[0], idx: number) {
  if (idx < dossier.etapeActuelle) return 'mdi-check-circle'
  if (idx === dossier.etapeActuelle) return dossier.joursEcoules > 9 ? 'mdi-alarm' : 'mdi-clock-outline'
  return 'mdi-circle-outline'
}

// ── Circuit complet (référence institutionnelle) ────────────────────────────
const circuitComplet = [
  { id: 'Entrée', titre: 'Saisie déclaration SYDONIAWORLD', acteur: 'Bénéficiaire / Transitaire', systeme: 'SYDONIAWORLD', icon: 'mdi-keyboard', color: 'primary', highlight: false },
  { id: 'Étape 1', titre: 'Contrôle des pièces justificatives', acteur: 'CDDI / Agent de bureau', systeme: 'SYDONIAWORLD', icon: 'mdi-file-search', color: 'primary', highlight: false },
  { id: 'Étape 2', titre: 'Vérification conformité juridique', acteur: 'CDDI / Service juridique', systeme: 'SYDONIAWORLD', icon: 'mdi-gavel', color: 'primary', highlight: false },
  { id: '2a', titre: 'Validation — Vérificateur', acteur: 'Agent vérificateur', systeme: 'SYDONIAWORLD', icon: 'mdi-account-check', color: 'warning', highlight: true },
  { id: '2b', titre: 'Validation — Chef subdivision', acteur: 'Chef de subdivision', systeme: 'SYDONIAWORLD', icon: 'mdi-account-check', color: 'warning', highlight: true },
  { id: '2c', titre: 'Validation — Chef de bureau', acteur: 'Chef de bureau douanier', systeme: 'SYDONIAWORLD', icon: 'mdi-account-check', color: 'warning', highlight: true },
  { id: '2d', titre: 'Validation finale + réf. GESTEXO', acteur: 'Directeur CDDI', systeme: 'GESTEXO', icon: 'mdi-check-decagram', color: 'success', highlight: true },
  { id: 'Étape 3', titre: 'Liquidation droits et taxes', acteur: 'CDDI', systeme: 'GESTEXO', icon: 'mdi-calculator', color: 'success', highlight: false },
  { id: 'Étape 4', titre: 'Émission du quittancement', acteur: 'CDDI', systeme: 'GESTEXO', icon: 'mdi-receipt-text-check', color: 'success', highlight: false },
  { id: 'Reporting', titre: 'Reporting mensuel consolidé', acteur: 'OTR / CDDI', systeme: 'GESTEXO → DAS → DGBF', icon: 'mdi-file-chart', color: 'secondary', highlight: false },
]

// ── KPIs ────────────────────────────────────────────────────────────────────
const kpis = [
  { label: 'Franchises accordées', value: String(accordees.value.length + 2), icon: 'mdi-check-circle', color: 'success', subtitle: 'Référence GESTEXO générée' },
  { label: 'En cours d\'instruction', value: String(enCours.value.length), icon: 'mdi-clock-outline', color: 'warning', subtitle: 'Circuit 2a–2d en cours' },
  { label: 'Alertes délai (> 9j)', value: String(alertesDelai.value.length), icon: 'mdi-alarm', color: 'error', subtitle: 'Notification Directeur CDDI' },
  { label: 'Délai moyen circuit', value: '7.2 j', icon: 'mdi-timer-outline', color: 'info', subtitle: 'Cible ≤ 9 j ouvrables' },
]

// ── Headers tables ───────────────────────────────────────────────────────────
const headersAccordees = [
  { title: 'Déclaration SYDONIAWORLD', key: 'declaration' },
  { title: 'Régime', key: 'regime' },
  { title: 'Référence GESTEXO', key: 'refGestexo' },
  { title: 'Montant exonéré', key: 'montant' },
  { title: 'Quittance', key: 'quittance' },
  { title: 'Date saisie', key: 'dateSaisie' },
]

const headersRejets = [
  { title: 'Déclaration', key: 'declaration' },
  { title: 'Régime', key: 'regime' },
  { title: 'Étape de rejet', key: 'etapeRejet' },
  { title: 'Motif', key: 'motif' },
  { title: 'Date', key: 'dateSaisie' },
]

const headersReporting = [
  { title: 'Mois', key: 'mois' },
  { title: 'Nb franchises', key: 'nbFranchises' },
  { title: 'Montant total exonéré', key: 'montant' },
  { title: 'Statut transmission', key: 'statut' },
]

const reportingMensuel = [
  { mois: 'Mai 2026', nbFranchises: 18, montant: '1 240 000 000 FCFA', statut: 'Transmis DGBF' },
  { mois: 'Avril 2026', nbFranchises: 22, montant: '1 850 000 000 FCFA', statut: 'Transmis DGBF' },
  { mois: 'Mars 2026', nbFranchises: 15, montant: '980 000 000 FCFA', statut: 'Transmis DGBF' },
  { mois: 'Fév. 2026', nbFranchises: 19, montant: '1 120 000 000 FCFA', statut: 'En attente DAS' },
]

const reportingChain = ['GESTEXO', 'OTR / CDDI', 'DAS', 'DGBF', 'Situations recettes mensuelles']

const regimeColor = (r: string) => ({ 'Zone Franche': 'teal', 'Diplomatique': 'blue-grey', 'Extractif': 'brown', 'ONG / Projet': 'indigo' } as Record<string, string>)[r] || 'primary'
</script>
