<template>
  <div>
    <PageHeader title="Journal d'audit inaltérable" subtitle="Traçabilité complète de toutes les actions — Lecture seule absolue" icon="mdi-shield-lock">
      <template #actions>
        <v-chip color="error" variant="tonal" size="small" prepend-icon="mdi-lock" class="me-2">Inaltérable</v-chip>
        <ExportButton
          label="Export certifié"
          policy-label="Politique de diffusion"
          restriction-note="Format bloqué hors habilitation audit renforcée"
          :disabled-formats="['excel']"
          :formats="[
            {value:'csv',label:'CSV signé numériquement',icon:'mdi-file-delimited'},
            {value:'pdf',label:'PDF avec empreinte',icon:'mdi-file-pdf-box'},
            {value:'excel',label:'Excel nominatif',icon:'mdi-microsoft-excel'}
          ]"
          @export="() => {}"
        />
      </template>
    </PageHeader>
    <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-4">
      Ce journal est en lecture seule. Aucune modification, suppression ou édition n'est possible. Toute consultation est elle-même journalisée.
    </v-alert>
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1">
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12" md="4"><v-text-field v-model="search" label="Référence dossier, utilisateur, action…" prepend-inner-icon="mdi-magnify" hide-details clearable/></v-col>
              <v-col cols="6" md="2"><v-select v-model="filterAction" :items="['VALIDATION','REJET','DEMANDE_COMPLEMENT','EXPORT','CREATION_COMPTE','VISA','Toutes']" label="Action" hide-details/></v-col>
              <v-col cols="6" md="2"><v-select v-model="filterStructure" :items="['OTR Douanes','OTR Impôts','DGBF','UPF','IGF','DSI/MEF','Toutes']" label="Structure" hide-details/></v-col>
              <v-col cols="6" md="2"><v-text-field v-model="dateDebut" label="Du" type="date" hide-details/></v-col>
              <v-col cols="6" md="2"><v-text-field v-model="dateFin" label="Au" type="date" hide-details/></v-col>
            </v-row>
          </v-card-text>
          <v-data-table :headers="headers" :items="logs" :search="search" hover density="comfortable">
            <template #item.horodatage="{ item }">
              <span class="text-caption font-weight-medium">{{ item.horodatage }}</span>
            </template>
            <template #item.action="{ item }">
              <v-chip :color="actionColor(item.action)" size="x-small" variant="tonal" class="font-weight-bold">{{ item.action }}</v-chip>
            </template>
            <template #item.sensible="{ item }">
              <v-icon v-if="item.action==='REJET'||item.action==='VALIDATION'||item.action==='EXPORT_RAPPORT'" icon="mdi-alert-circle" color="warning" size="16"/>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Cas ultra-spécifiques tracés</v-card-title>
          <v-card-text class="pa-4 pt-2">
            <v-tabs v-model="caseTab" color="primary" density="compact" class="mb-3">
              <v-tab value="diplomatique">Diplomatique</v-tab>
              <v-tab value="extractif">Extractif</v-tab>
              <v-tab value="textile">Textile</v-tab>
            </v-tabs>
            <v-window v-model="caseTab">
              <v-window-item v-for="item in specialCases" :key="item.value" :value="item.value">
                <div class="text-caption text-medium-emphasis mb-2">{{ item.subtitle }}</div>
                <v-list density="compact" class="pa-0">
                  <v-list-item v-for="point in item.points" :key="point" :title="point" prepend-icon="mdi-shield-check-outline" />
                </v-list>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Chaîne de preuve</v-card-title>
          <v-card-text class="pa-4">
            <div class="text-body-2 mb-2"><strong>Empreinte du lot :</strong> `ab42...91c8`</div>
            <div class="text-body-2 mb-2"><strong>Dernier scellement :</strong> 01/06/2026 23:08 UTC</div>
            <div class="text-body-2 mb-2"><strong>Autorité :</strong> PKI souveraine MEF</div>
            <div class="text-body-2"><strong>Diffusion :</strong> export nominatif reserve aux profils audit renforces</div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Evenements sensibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="item in sensitiveEvents" :key="item.title" :title="item.title" :subtitle="item.subtitle" rounded="lg">
              <template #prepend><v-icon :icon="item.icon" :color="item.color" /></template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Axes de preuve transverse</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Accès dossiers confidentiels et diffusion restreinte" prepend-icon="mdi-eye-lock-outline" />
            <v-list-item title="Hash documentaire, TSA et scellement de lot" prepend-icon="mdi-lock-check-outline" />
            <v-list-item title="Exports bloqués, autorisés ou contre-signés" prepend-icon="mdi-file-export-outline" />
            <v-list-item title="Références dossier, convention, accord et registre central croisées" prepend-icon="mdi-source-merge" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import ExportButton from '../../components/ExportButton.vue'
import { mockAuditLogs } from '../../mock/data'
const search = ref('')
const filterAction = ref('Toutes')
const filterStructure = ref('Toutes')
const dateDebut = ref('')
const dateFin = ref('')
const caseTab = ref('diplomatique')
const headers = [
  { title: '⚠', key: 'sensible', sortable: false, width: 40 },
  { title: 'Horodatage', key: 'horodatage' },
  { title: 'Utilisateur', key: 'utilisateur' },
  { title: 'Structure', key: 'structure' },
  { title: 'Rôle', key: 'role' },
  { title: 'Action', key: 'action' },
  { title: 'Entité', key: 'entite' },
  { title: 'Ancienne valeur', key: 'ancienneValeur' },
  { title: 'Nouvelle valeur', key: 'nouvelleValeur' },
  { title: 'IP', key: 'ip' },
]
const logs = mockAuditLogs
const actionColor = (a: string) => ({ VALIDATION: 'success', REJET: 'error', DEMANDE_COMPLEMENT: 'warning', EXPORT_RAPPORT: 'info', CREATION_COMPTE: 'secondary', VISA: 'primary' }[a] || 'default')
const sensitiveEvents = [
  { title: 'Export nominatif bloque', subtitle: 'Absence d habilitation audit renforcee', icon: 'mdi-download-lock-outline', color: 'warning' },
  { title: 'Consultation dossier confidentiel', subtitle: 'Evenement journalise avec IP et session', icon: 'mdi-eye-lock-outline', color: 'error' },
  { title: 'Validation avec contre-signature', subtitle: 'Double approbation tracee dans le journal', icon: 'mdi-pen-lock', color: 'success' },
]
const specialCases = [
  {
    value: 'diplomatique',
    subtitle: 'Traçabilité des accords de siège, listes personnel et consultations restreintes.',
    points: ['Journal des consultations MAE / OTR', 'Contrôle des diffusions restreintes', 'Rattachement note verbale, liste personnel et véhicules'],
  },
  {
    value: 'extractif',
    subtitle: 'Suivi des conventions minières et pétrolières, par phase et par avantage.',
    points: ['Historique des phases recherche / exploitation / production', 'Rapprochement ITIE / DGMG / CONEDEF', 'Scellement des conventions et annexes techniques'],
  },
  {
    value: 'textile',
    subtitle: 'Suivi des cas sectoriels textile / habillement avec obligations export et emploi.',
    points: ['Alertes sur échéances loi 2022-021', 'Blocage d export nominatif hors habilitation', 'Croisement avec engagements et conventions sectorielles'],
  },
]
</script>
