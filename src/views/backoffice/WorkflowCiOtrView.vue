<template>
  <div>
    <PageHeader
      title="Workflow CI / OTR"
      subtitle="Instruction des exonérations sur impôts intérieurs avec délais cibles 5j / 10j / 15j"
      icon="mdi-timeline-check"
    >
      <template #actions>
        <v-chip color="warning" variant="tonal" size="small" prepend-icon="mdi-timer-alert">SLA visibles</v-chip>
        <ExportButton
          label="Exporter le parcours"
          policy-label="Diffusion workflow"
          restriction-note="Export nominatif reserve aux profils OTR habilites"
          :disabled-formats="['excel']"
          class="ms-2"
          @export="() => {}"
        />
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Parcours normé du dossier</v-card-title>
      <v-stepper model-value="4" alt-labels>
        <v-stepper-header>
          <v-stepper-item title="1. Dépôt" subtitle="Bénéficiaire → CI" value="1" />
          <v-stepper-item title="2. Vérification" subtitle="< 5 jours" value="2" />
          <v-stepper-item title="3. Étude juridique" subtitle="Contentieux" value="3" />
          <v-stepper-item title="4. Validation DGE/DME" subtitle="Cumul < 10 jours" value="4" />
          <v-stepper-item title="5. Décision" subtitle="Attestation CI < 15j" value="5" />
          <v-stepper-item title="6. Exécution" subtitle="Guichet compétent" value="6" />
          <v-stepper-item title="7. Suivi" subtitle="E-TAX → DLFC → DAS" value="7" />
          <v-stepper-item title="8. Reporting" subtitle="SIGFiP / DLFC → DGBF" value="8" />
        </v-stepper-header>
      </v-stepper>
    </v-card>

    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice standard OTR en 8 etapes</v-card-title>
      <v-data-table :headers="processHeaders" :items="processMatrix" hover />
    </v-card>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Étapes détaillées et délais</v-card-title>
          <v-data-table :headers="headers" :items="rows" hover>
            <template #item.delai="{ item }">
              <v-chip :color="delayColor(item.delai)" size="x-small" variant="tonal">{{ item.delai }}</v-chip>
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="outlined">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Checklists documentaires arrêté 148</v-card-title>
          <v-tabs v-model="tab" color="primary" density="compact" class="px-4 pt-2">
            <v-tab value="lucratif">Lucratif</v-tab>
            <v-tab value="nonlucratif">Non lucratif</v-tab>
            <v-tab value="public">Public / projet</v-tab>
          </v-tabs>
          <v-window v-model="tab">
            <v-window-item value="lucratif">
              <v-list density="compact" class="pa-3">
                <v-list-item v-for="item in lucratif" :key="item" :title="item" prepend-icon="mdi-check-circle-outline" />
              </v-list>
            </v-window-item>
            <v-window-item value="nonlucratif">
              <v-list density="compact" class="pa-3">
                <v-list-item v-for="item in nonLucratif" :key="item" :title="item" prepend-icon="mdi-check-circle-outline" />
              </v-list>
            </v-window-item>
            <v-window-item value="public">
              <v-list density="compact" class="pa-3">
                <v-list-item v-for="item in publicItems" :key="item" :title="item" prepend-icon="mdi-check-circle-outline" />
              </v-list>
            </v-window-item>
          </v-window>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Variantes CI par regime</v-card-title>
          <v-tabs v-model="regimeTab" color="primary" density="compact" class="px-4 pt-2">
            <v-tab value="cgi">CGI / LFI</v-tab>
            <v-tab value="invest">Code investissements</v-tab>
            <v-tab value="textile">Textile 2022-021</v-tab>
            <v-tab value="special">ONG / accords / publics</v-tab>
          </v-tabs>
          <v-window v-model="regimeTab">
            <v-window-item v-for="regime in regimeVariants" :key="regime.value" :value="regime.value">
              <v-card-text class="pa-4">
                <div class="text-body-2 font-weight-bold mb-2">{{ regime.title }}</div>
                <div class="text-caption text-medium-emphasis mb-3">{{ regime.subtitle }}</div>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-list density="compact" class="pa-0">
                      <v-list-item v-for="item in regime.points" :key="item" :title="item" prepend-icon="mdi-check-circle-outline" />
                    </v-list>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-3">
                      <strong>Autorite / circuit :</strong> {{ regime.circuit }}
                    </v-alert>
                    <v-alert type="warning" variant="tonal" rounded="lg" density="compact">
                      <strong>Vigilance :</strong> {{ regime.vigilance }}
                    </v-alert>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Statuts visibles en maquette</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Déposée" prepend-icon="mdi-tray-arrow-up" />
            <v-list-item title="En instruction" prepend-icon="mdi-file-search-outline" />
            <v-list-item title="En étude juridique" prepend-icon="mdi-scale-balance" />
            <v-list-item title="Attestation émise" prepend-icon="mdi-file-sign" />
            <v-list-item title="Liquidée" prepend-icon="mdi-cash-check" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Pieces transversales CI</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Base légale" prepend-icon="mdi-gavel" />
            <v-list-item title="Demande d'attestation" prepend-icon="mdi-file-document-outline" />
            <v-list-item title="Lettre d'exonération annuelle" prepend-icon="mdi-email-outline" />
            <v-list-item title="État modèle A carburant" prepend-icon="mdi-gas-station-outline" />
            <v-list-item title="Factures / relevés bancaires / actes" prepend-icon="mdi-file-multiple-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import ExportButton from '../../components/ExportButton.vue'

const tab = ref('lucratif')
const regimeTab = ref('cgi')
const kpis = [
  { label: 'Dossiers CI en cours', value: '86', icon: 'mdi-file-document-edit-outline', color: 'primary', subtitle: 'Campagne courante' },
  { label: 'SLA < 5 jours', value: '73%', icon: 'mdi-clock-outline', color: 'info', subtitle: 'Vérification initiale' },
  { label: 'SLA < 15 jours', value: '61%', icon: 'mdi-timer-check-outline', color: 'warning', subtitle: 'Attestations émises' },
  { label: 'Alertes de dépassement', value: '9', icon: 'mdi-alert-circle-outline', color: 'error', subtitle: 'Escalade active' },
]

const headers = [
  { title: 'Étape', key: 'etape' },
  { title: 'Acteur', key: 'acteur' },
  { title: 'Action', key: 'action' },
  { title: 'Délai', key: 'delai' },
  { title: 'Statut', key: 'statut' },
]

const rows = [
  { etape: '1', acteur: 'Bénéficiaire', action: 'Dépôt dossier complet → CI service gestionnaire', delai: '—', statut: 'Terminé' },
  { etape: '2', acteur: 'CI / Service gestionnaire', action: 'Vérification administrative complétude', delai: '< 5 jours', statut: 'En cours' },
  { etape: '3', acteur: 'CI / Service contentieux', action: 'Étude base juridique applicable (CGI / texte habilitant)', delai: '—', statut: 'À venir' },
  { etape: '4', acteur: 'DGE / DME', action: 'Validation hiérarchique', delai: 'Cumul < 10 jours', statut: 'À venir' },
  { etape: '5', acteur: 'Direction CI', action: 'Décision formelle : émission attestation signée', delai: 'Cumul < 15 jours', statut: 'À venir' },
  { etape: '6', acteur: 'Bénéficiaire', action: 'Présentation attestation au guichet compétent (faire valoir droits)', delai: '—', statut: 'À venir' },
  { etape: '7', acteur: 'OTR', action: 'Suivi financier : comptabilisation E-TAX → DLFC → DAS', delai: 'Continu', statut: 'À venir' },
  { etape: '8', acteur: 'OTR → DGBF', action: 'Reporting mensuel via SIGFiP + DLFC (colonne exonérations)', delai: 'Mensuel', statut: 'À venir' },
]

const processHeaders = [
  { title: 'Etape', key: 'etape' },
  { title: 'Vue CI / OTR', key: 'ci' },
  { title: 'Point de vigilance OASE', key: 'vigilance' },
]

const processMatrix = [
  { etape: 'Entree', ci: 'Depot dossier complet → CI service gestionnaire', vigilance: 'Reference unique du dossier' },
  { etape: 'Niveau 1', ci: 'Verification administrative completude (< 5 jours)', vigilance: 'Service gestionnaire CI trace' },
  { etape: 'Niveau 2', ci: 'Etude base juridique CGI/texte habilitant (contentieux)', vigilance: 'Reference juridique rattachee' },
  { etape: 'Niveau 3', ci: 'Validation hierarchique DGE/DME (cumul < 10 jours)', vigilance: 'Journal des validations' },
  { etape: 'Decision', ci: 'Attestation exoneration emise/signee Direction CI (cumul < 15 jours)', vigilance: 'Reference unique attestation + delai cumule' },
  { etape: 'Execution', ci: 'Beneficiaire presente attestation au guichet competent', vigilance: 'Preuve de presentation pour faire valoir droits' },
  { etape: 'Suivi', ci: 'OTR comptabilise montant exonere E-TAX → Base DLFC → DAS', vigilance: 'Lien attestation → execution SI' },
  { etape: 'Reporting', ci: 'OTR reporte mensuellement → DGBF via SIGFiP + Base DLFC', vigilance: 'Alimentation colonne exonerations situations recettes' },
]

const lucratif = [
  'Quitus fiscal OTR',
  'Récépissé dépôt états financiers 3 derniers exercices',
  "Carte d'immatriculation fiscale en cours de validité",
  'Récépissé DAS 3 derniers exercices',
  'PV dernière réunion CA/AG',
  'Quitus social',
  'Fiche signalétique de suivi des agréments — dûment remplie et visée par le Ministère de tutelle (si exonération sur agrément)',
]
const nonLucratif = [
  'Récépissé états financiers 3 ans',
  "Carte d'immatriculation fiscale",
  'Récépissé DAS 3 ans',
  'Quitus social',
]
const publicItems = [
  'Attestation de régularité fiscale selon cas',
  'Récépissé DAS 3 ans',
]

const regimeVariants = [
  {
    value: 'cgi',
    title: 'Mesures CGI / LFI classiques',
    subtitle: 'Parcours standard pour exonerations fiscales internes rattachees a une base legale explicite.',
    circuit: 'Beneficiaire -> CI -> contentieux -> DGE/DME -> liquidation SI',
    vigilance: 'Verifier la reference article / exercice et la duree exacte de validite.',
    points: ['Reference explicite article CGI ou LFI', 'Montant brut taxable et taux applique saisis', 'Attestation annuelle et reconduction tracees'],
  },
  {
    value: 'invest',
    title: 'Code des investissements',
    subtitle: 'Mesures liees aux agrements, engagements et objectifs d investissement.',
    circuit: 'Beneficiaire -> agence / ministere -> OTR -> decideur budgetaire',
    vigilance: 'Relier l attestation aux engagements emplois / investissements et a la date de debut d agrement.',
    points: ['Numero agrement rattache', 'Pieces second rang emplois / CAPEX', 'Controle echeance agrement et renouvellement'],
  },
  {
    value: 'textile',
    title: 'Regime textile / habillement 2022-021',
    subtitle: 'Traitement des mesures specifiques du nouveau regime sectoriel textile.',
    circuit: 'Beneficiaire -> structure sectorielle -> OTR -> budget / suivi sectoriel',
    vigilance: 'Verifier perimetre textile eligible et coherence avec les textes sectoriels actualises.',
    points: ['Reference loi 2022-021', 'Suivi emplois export et intrants', 'Lien avec reporting sectoriel ministeriel'],
  },
  {
    value: 'special',
    title: 'ONG / accords de siege / projets publics',
    subtitle: 'Parcours specifiques a faible logique lucrative ou a statut institutionnel particulier.',
    circuit: 'MAE ou autorite sectorielle -> OTR -> visa selon cas',
    vigilance: 'Appliquer le bon niveau de confidentialite et differencier les pieces premier rang obligatoires.',
    points: ['Carte consulaire ou acte de reconnaissance', 'Liste personnel / projet / financement', 'Regime de diffusion restreinte et journalisee'],
  },
]

const delayColor = (value: string) => (value.includes('5') ? 'info' : value.includes('10') ? 'warning' : value.includes('15') ? 'error' : 'secondary')
const statusColor = (value: string) => ({ 'Terminé': 'success', 'En cours': 'info', 'À venir': 'secondary' } as Record<string, string>)[value] || 'secondary'
</script>
