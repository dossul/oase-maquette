<template>
  <div>
    <PageHeader
      title="Gouvernance des donnees"
      subtitle="Qualite, campagnes de mise a jour, referentiels et points focaux OASE"
      icon="mdi-database-cog"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-file-chart">Rapport qualite</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-plus-circle">Nouvelle campagne</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" density="compact" class="mb-3">
      <v-tab value="qualite" prepend-icon="mdi-shield-check">Qualite</v-tab>
      <v-tab value="campagnes" prepend-icon="mdi-calendar-sync">Campagnes</v-tab>
      <v-tab value="referentiels" prepend-icon="mdi-shape-outline">Referentiels</v-tab>
      <v-tab value="pointsfocaux" prepend-icon="mdi-account-group">Points focaux</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="qualite">
        <v-row>
          <v-col cols="12" md="7">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Controle de completude par domaine</v-card-title>
              <v-card-text>
                <div v-for="item in qualityItems" :key="item.label" class="mb-3">
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span>{{ item.label }}</span>
                    <span class="font-weight-bold">{{ item.value }}%</span>
                  </div>
                  <v-progress-linear :model-value="item.value" :color="qualityColor(item.value)" rounded height="10" />
                  <div class="text-caption text-medium-emphasis mt-1">{{ item.hint }}</div>
                </div>
              </v-card-text>
            </v-card>

            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Anomalies de donnees prioritaires</v-card-title>
              <v-data-table :headers="anomalyHeaders" :items="anomalies" hover>
                <template #item.severite="{ item }">
                  <v-chip :color="severityColor(item.severite)" size="x-small" variant="tonal">{{ item.severite }}</v-chip>
                </template>
                <template #item.statut="{ item }">
                  <v-chip :color="item.statut === 'Ouverte' ? 'error' : 'success'" size="x-small" variant="outlined">{{ item.statut }}</v-chip>
                </template>
              </v-data-table>
            </v-card>
          </v-col>

          <v-col cols="12" md="5">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Etat des flux de certification</v-card-title>
              <v-list density="comfortable" class="pa-2">
                <v-list-item v-for="flow in certificationFlows" :key="flow.title" :title="flow.title" :subtitle="flow.subtitle" rounded="lg">
                  <template #prepend><v-avatar :color="flow.color" size="34" rounded="lg"><v-icon :icon="flow.icon" color="white" size="18" /></v-avatar></template>
                  <template #append><v-chip :color="flow.color" size="x-small" variant="tonal">{{ flow.badge }}</v-chip></template>
                </v-list-item>
              </v-list>
            </v-card>

            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Rappels V2 a maquetter</v-card-title>
              <v-list density="compact" class="pa-2">
                <v-list-item title="Distinction brut / corrige / certifie" prepend-icon="mdi-layers-triple-outline" />
                <v-list-item title="Fraicheur par SI source" prepend-icon="mdi-timer-sand" />
                <v-list-item title="Validation de lot avant publication" prepend-icon="mdi-stamp" />
                <v-list-item title="Rapports de completude par institution" prepend-icon="mdi-file-chart-outline" />
                <v-list-item title="Journal des relances points focaux" prepend-icon="mdi-history" />
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <v-window-item value="campagnes">
        <v-card rounded="lg" elevation="1">
          <v-data-table :headers="campagneHeaders" :items="campagnes" hover>
            <template #item.avancement="{ item }">
              <div class="d-flex align-center ga-3">
                <v-progress-linear :model-value="item.avancement" color="primary" rounded height="8" style="max-width: 140px" />
                <span class="text-caption font-weight-semibold">{{ item.avancement }}%</span>
              </div>
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="statutCampagneColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <v-window-item value="referentiels">
        <v-row>
          <v-col v-for="refItem in referentiels" :key="refItem.nom" cols="12" md="6" lg="4">
            <v-card rounded="lg" elevation="1" class="h-100">
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-body-2 font-weight-semibold">{{ refItem.nom }}</div>
                  <v-chip :color="refItem.statut === 'A jour' ? 'success' : 'warning'" size="x-small" variant="tonal">{{ refItem.statut }}</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis mb-3">{{ refItem.description }}</div>
                <div class="text-caption mb-1"><strong>Point focal :</strong> {{ refItem.pointFocal }}</div>
                <div class="text-caption mb-3"><strong>Derniere revue :</strong> {{ refItem.revue }}</div>
                <v-progress-linear :model-value="refItem.couverture" color="primary" rounded height="8" class="mb-1" />
                <div class="text-caption text-medium-emphasis">Couverture exploitable : {{ refItem.couverture }}%</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <v-window-item value="pointsfocaux">
        <v-card rounded="lg" elevation="1">
          <v-data-table :headers="pointHeaders" :items="pointsFocaux" hover>
            <template #item.score="{ item }">
              <v-chip :color="qualityColor(item.score)" size="x-small" variant="tonal">{{ item.score }}%</v-chip>
            </template>
            <template #item.relances="{ item }">
              <v-chip :color="item.relances > 2 ? 'warning' : 'success'" size="x-small" variant="outlined">{{ item.relances }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

const tab = ref('qualite')

const kpis = [
  { label: 'Completude moyenne', value: '84 %', icon: 'mdi-check-decagram', color: 'success', subtitle: '17 attributs cibles' },
  { label: 'Lots a certifier', value: '12', icon: 'mdi-stamp', color: 'warning', subtitle: 'UPF / DGBF / OTR' },
  { label: 'Referentiels normes', value: '11', icon: 'mdi-shape-plus', color: 'info', subtitle: 'Nomenclatures officielles OASE' },
  { label: 'Points focaux actifs', value: '5 / 5', icon: 'mdi-account-check', color: 'primary', subtitle: 'Campagne 2026' },
]

const qualityItems = [
  { label: 'Identifiants mesure / decision', value: 96, hint: 'Tres bon niveau sur les dossiers pilotes' },
  { label: 'Montants et bases taxables', value: 71, hint: 'Ecarts encore visibles sur les fichiers anciens' },
  { label: 'Pieces justificatives 1er rang', value: 82, hint: 'Controle obligatoire avant soumission cible' },
  { label: 'Liens systemes sources', value: 68, hint: 'DAS et GUDEF restent a consolider' },
  { label: 'References budgetaires', value: 74, hint: 'A completer avant synchronisation annexe LFI' },
]

const anomalies = [
  { domaine: 'Annee d’adoption', volume: 554, severite: 'Elevee', statut: 'Ouverte' },
  { domaine: 'Libelles juridiques heterogenes', volume: 67, severite: 'Moyenne', statut: 'En traitement' },
  { domaine: 'Pieces 1er rang absentes', volume: 29, severite: 'Elevee', statut: 'Ouverte' },
  { domaine: 'Correspondance GUDEF manquante', volume: 18, severite: 'Critique', statut: 'Ouverte' },
]

const anomalyHeaders = [
  { title: 'Domaine', key: 'domaine' },
  { title: 'Volume', key: 'volume' },
  { title: 'Severite', key: 'severite' },
  { title: 'Statut', key: 'statut' },
]

const certificationFlows = [
  { title: 'Lot MRD 2024 consolide', subtitle: 'Pret pour arbitrage UPF', badge: 'Certification J+2', icon: 'mdi-database-check', color: 'success' },
  { title: 'Flux accords de siege', subtitle: 'Pieces et listes personnel a regulariser', badge: 'Relance active', icon: 'mdi-flag-outline', color: 'warning' },
  { title: 'Rapprochement GUDEF / SIGFiP', subtitle: 'Controle croise DGTCP en attente', badge: 'En ecart', icon: 'mdi-source-branch-sync', color: 'error' },
]

const campagnes = [
  { nom: 'Campagne fiabilisation annees d’adoption', pilote: 'UPF', perimetre: '554 mesures', avancement: 62, statut: 'En cours' },
  { nom: 'Uniformisation bases juridiques', pilote: 'UPF / OTR', perimetre: '326 mesures CGI', avancement: 44, statut: 'En cours' },
  { nom: 'Sous-registre accords de siege', pilote: 'MAE / OTR', perimetre: '398 mesures', avancement: 28, statut: 'Critique' },
  { nom: 'Qualification references budgetaires', pilote: 'DGBF / DGTCP', perimetre: 'Annexe LFI 2026', avancement: 83, statut: 'Validee' },
]

const campagneHeaders = [
  { title: 'Campagne', key: 'nom' },
  { title: 'Pilote', key: 'pilote' },
  { title: 'Perimetre', key: 'perimetre' },
  { title: 'Avancement', key: 'avancement' },
  { title: 'Statut', key: 'statut' },
]

const referentiels = [
  { nom: 'R_FAMILLE_TEXTE', description: 'Familles de textes, codes, lois de finances, conventions et accords', pointFocal: 'UPF', revue: '31/05/2026', couverture: 91, statut: 'A jour' },
  { nom: 'R_SYSTEME_INFORMATION', description: 'Sydonia, E-TAX, DAS, GUDEF, SIGFiP, SIGTAS', pointFocal: 'DSI/MEF', revue: '29/05/2026', couverture: 81, statut: 'A jour' },
  { nom: 'R_TYPE_ACTE', description: 'Loi, decret, convention, accord, arrete, agrement', pointFocal: 'UPF', revue: '28/05/2026', couverture: 93, statut: 'A jour' },
  { nom: 'R_NATURE_MESURE', description: 'Exoneration, franchise, taux reduit, report, credit, suspension', pointFocal: 'UPF', revue: '26/05/2026', couverture: 86, statut: 'A jour' },
  { nom: 'R_IMPOT_TAXE', description: 'TVA, IS, IRPP, DD, RS, TPI, ADA, DAPP, TSR et autres taxes', pointFocal: 'OTR', revue: '30/05/2026', couverture: 89, statut: 'A jour' },
  { nom: 'R_TYPE_BENEFICIAIRE', description: 'Entreprise, ONG, organisme international, diplomatique, projet public', pointFocal: 'MEF / MAE', revue: '27/05/2026', couverture: 83, statut: 'A jour' },
  { nom: 'R_SECTEUR_BRANCHE', description: 'Nomenclature sectorielle et branche NES', pointFocal: 'INSEED', revue: '15/05/2026', couverture: 69, statut: 'A revoir' },
  { nom: 'R_ORGANE', description: 'Structures attributrices, gestionnaires et de controle', pointFocal: 'MEF / OTR', revue: '31/05/2026', couverture: 88, statut: 'A jour' },
  { nom: 'R_PORTEE_DUREE', description: 'Temporaire, permanente, renouvelable, par phase', pointFocal: 'UPF', revue: '23/05/2026', couverture: 77, statut: 'A revoir' },
  { nom: 'R_OBJECTIF_POLITIQUE', description: 'Objectif fiscal, economique, social, sectoriel', pointFocal: 'UPF / DGEAE', revue: '27/05/2026', couverture: 74, statut: 'A revoir' },
  { nom: 'R_FONCTION_BUDGETAIRE', description: 'Fonction de politique publique et rattachement budgetaire', pointFocal: 'DGBF', revue: '25/05/2026', couverture: 72, statut: 'A revoir' },
]

const pointsFocaux = [
  { structure: 'UPF', responsable: 'Cellule juridique', referentiel: 'Base juridique / type acte', score: 94, relances: 0 },
  { structure: 'OTR / DGI', responsable: 'Controle impots', referentiel: 'Impots interieurs / E-TAX', score: 88, relances: 1 },
  { structure: 'OTR / DGD', responsable: 'CDDI / Sydonia', referentiel: 'Douanes / code additionnel', score: 86, relances: 1 },
  { structure: 'SAZOF', responsable: 'Service conventions', referentiel: 'Zone franche / agrements', score: 79, relances: 2 },
  { structure: 'DGMG', responsable: 'Cellule conventions', referentiel: 'Conventions minieres', score: 63, relances: 4 },
]

const pointHeaders = [
  { title: 'Structure', key: 'structure' },
  { title: 'Responsable', key: 'responsable' },
  { title: 'Referentiel', key: 'referentiel' },
  { title: 'Score qualite', key: 'score' },
  { title: 'Relances', key: 'relances' },
]

const qualityColor = (value: number) => {
  if (value >= 90) return 'success'
  if (value >= 75) return 'warning'
  return 'error'
}

const severityColor = (value: string) => ({ Critique: 'error', Elevee: 'warning', Moyenne: 'info' } as Record<string, string>)[value] || 'secondary'
const statutCampagneColor = (value: string) => ({ Validee: 'success', 'En cours': 'info', Critique: 'error' } as Record<string, string>)[value] || 'secondary'
</script>
