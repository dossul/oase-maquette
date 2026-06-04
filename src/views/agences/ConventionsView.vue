<template>
  <div>
    <PageHeader title="Gestion des conventions" subtitle="Registre des conventions ZFI, ZES et Code des investissements" icon="mdi-file-certificate">
      <template #actions>
        <ExportButton size="small" @export="() => {}"/>
      </template>
    </PageHeader>
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="12" md="5"><v-text-field v-model="search" label="Rechercher…" prepend-inner-icon="mdi-magnify" hide-details clearable/></v-col>
              <v-col cols="6" md="3"><v-select v-model="filterRegime" :items="regimes" label="Régime" hide-details clearable/></v-col>
              <v-col cols="6" md="4"><v-select v-model="filterStatut" :items="['active','suspendue','resiliee','expiree']" label="Statut" hide-details clearable/></v-col>
            </v-row>
          </v-card-text>
          <v-data-table :headers="headers" :items="filteredConventions" :search="search" hover @click:row="(_, {item}) => selectedConvention=item">
            <template #item.statut="{ item }">
              <v-chip :color="{'active':'success','suspendue':'warning','resiliee':'error','expiree':'default'}[item.statut]" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #item.montantEstime="{ item }">{{ (item.montantEstime/1e9).toFixed(2) }} Mds</template>
            <template #item.actions="{ item }">
              <v-btn size="x-small" color="primary" variant="tonal" class="me-1" @click="selectedConvention=item">Fiche</v-btn>
              <v-btn size="x-small" color="info" variant="tonal" @click="notifDialog=true">Notifier OTR</v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card v-if="selectedConvention" rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">{{ selectedConvention.reference }}</v-card-title>
          <v-card-text class="pa-4">
            <div class="mb-3"><div class="label-micro text-medium-emphasis">Bénéficiaire</div><div class="font-weight-semibold">{{ selectedConvention.beneficiaire }}</div></div>
            <div class="mb-3"><div class="label-micro text-medium-emphasis">Régime</div><div>{{ selectedConvention.regime }}</div></div>
            <div class="mb-3"><div class="label-micro text-medium-emphasis">Durée</div><div>{{ formatDate(selectedConvention.dateDebut) }} → {{ formatDate(selectedConvention.dateFin) }}</div></div>
            <div class="mb-3"><div class="label-micro text-medium-emphasis">Montant estimé</div><div class="font-weight-bold text-primary">{{ (selectedConvention.montantEstime/1e9).toFixed(2) }} Mds FCFA</div></div>
            <div class="mb-3"><div class="label-micro text-medium-emphasis">Confidentialité</div><div>{{ conventionMeta(selectedConvention).confidentialite }}</div></div>
            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Engagements emploi</div>
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>Créés: {{ selectedConvention.emploisCrees }}</span>
                <span class="text-medium-emphasis">/ Engagés: {{ selectedConvention.emploisEngages }}</span>
              </div>
              <v-progress-linear :model-value="(selectedConvention.emploisCrees/selectedConvention.emploisEngages)*100" color="success" rounded height="8"/>
            </div>
            <div class="d-flex ga-2 flex-wrap">
              <v-btn color="primary" size="small" variant="tonal" prepend-icon="mdi-eye" @click="previewDialog=true">Prévisualiser</v-btn>
              <v-btn color="info" size="small" variant="tonal" prepend-icon="mdi-bell-ring" @click="notifDialog=true">Notifier OTR</v-btn>
              <v-btn color="warning" size="small" variant="tonal" prepend-icon="mdi-pause">Suspendre</v-btn>
              <v-btn color="error" size="small" variant="tonal" prepend-icon="mdi-close">Résilier</v-btn>
            </div>
          </v-card-text>
        </v-card>
        <v-card v-if="selectedConvention" rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Synthèse O2 et preuves</v-card-title>
          <v-card-text class="pa-0">
            <v-table density="compact">
              <tbody>
                <tr v-for="item in o2Rows(selectedConvention)" :key="item.label">
                  <td class="text-caption font-weight-semibold" style="width: 42%;">{{ item.label }}</td>
                  <td class="text-caption">{{ item.value }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
        <v-card v-if="selectedConvention" rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Cas spécialisés</v-card-title>
          <v-card-text class="pa-4 pt-2">
            <v-tabs v-model="specialTab" color="primary" density="compact" class="mb-3">
              <v-tab value="zf">Zone franche</v-tab>
              <v-tab value="ci">Investissement</v-tab>
              <v-tab value="textile">Textile</v-tab>
            </v-tabs>
            <v-window v-model="specialTab">
              <v-window-item v-for="item in specialCases" :key="item.value" :value="item.value">
                <div class="text-caption text-medium-emphasis mb-2">{{ item.subtitle }}</div>
                <v-list density="compact" class="pa-0">
                  <v-list-item v-for="point in item.points" :key="point" :title="point" prepend-icon="mdi-check-circle-outline" />
                </v-list>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
        <v-card v-else rounded="lg" elevation="0" color="surface-light" class="pa-6 text-center">
          <v-icon icon="mdi-cursor-pointer" size="36" color="secondary" class="mb-2"/>
          <div class="text-body-2 text-medium-emphasis">Sélectionnez une convention pour voir la fiche détail</div>
        </v-card>
      </v-col>
    </v-row>
    <!-- Convention type preview with DocumentViewer -->
    <v-dialog v-model="previewDialog" fullscreen transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar color="secondary" density="compact">
          <v-btn icon="mdi-close" @click="previewDialog=false"/>
          <v-toolbar-title class="text-body-2">
            Convention type — {{ selectedConvention?.reference }} · {{ selectedConvention?.beneficiaire }}
          </v-toolbar-title>
          <v-spacer/>
          <v-btn prepend-icon="mdi-download" size="small" variant="tonal" color="white" class="me-2">Télécharger</v-btn>
        </v-toolbar>
        <div style="height:calc(100vh - 48px)">
          <DocumentViewer
            :filename="`Convention_${selectedConvention?.reference}.pdf`"
            :total-pages="3"
            @download="previewDialog=false"
          />
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="notifDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Notifier l'OTR</v-card-title>
        <v-card-text class="pa-5">
          <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-3">Cette action enverra automatiquement la notification via le connecteur OASE → SYDONIA/SIGTAS.</v-alert>
          <v-checkbox label="Notifier SYDONIA (Douanes)" model-value="true" hide-details/>
          <v-checkbox label="Notifier SIGTAS (Impôts)" model-value="true" hide-details/>
        </v-card-text>
        <v-card-actions class="pa-4"><v-spacer/><v-btn variant="text" @click="notifDialog=false">Annuler</v-btn><v-btn color="info" @click="notifDialog=false">Envoyer</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import ExportButton from '../../components/ExportButton.vue'
import DocumentViewer from '../../components/DocumentViewer.vue'
import { mockConventions } from '../../mock/data'
import type { Convention } from '../../types'
const search = ref('')
const filterRegime = ref(null)
const filterStatut = ref(null)
const notifDialog = ref(false)
const previewDialog = ref(false)
const specialTab = ref('zf')
const selectedConvention = ref<Convention | null>(null)
const regimes = ['Zone Franche Industrielle','Zone Économique Spéciale','Code des investissements']
const headers = [
  { title: 'Référence', key: 'reference' }, { title: 'Bénéficiaire', key: 'beneficiaire' },
  { title: 'Régime', key: 'regime' }, { title: 'Statut', key: 'statut' },
  { title: 'Montant estimé', key: 'montantEstime' }, { title: 'Actions', key: 'actions', sortable: false },
]
const filteredConventions = computed(() => mockConventions.filter(c => {
  if (filterStatut.value && c.statut !== filterStatut.value) return false
  return true
}))
const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')
const conventionMeta = (item: Convention) => ({
  codeAdditionnel: item.regime.includes('Zone') ? 'DOU-ZF-2026-14' : 'FISC-CI-2026-05',
  confidentialite: item.regime.includes('investissements') ? 'Interne' : 'Restreint',
  piece: item.regime.includes('Zone') ? 'convention_zf.pdf / 5de4...cc21' : 'convention_ci.pdf / 3bf1...aa02',
})
const o2Rows = (item: Convention) => [
  { label: 'id_mesure / id_decision', value: `${item.reference} / DEC-${item.reference}` },
  { label: 'beneficiaire / regime', value: `${item.beneficiaire} / ${item.regime}` },
  { label: 'code additionnel / SI', value: `${conventionMeta(item).codeAdditionnel} / Sydonia + E-TAX + GUDEF` },
  { label: 'montant estime / emplois', value: `${(item.montantEstime/1e9).toFixed(2)} Mds FCFA / ${item.emploisEngages}` },
  { label: 'piece probante / hash', value: conventionMeta(item).piece },
  { label: 'confidentialite / diffusion', value: `${conventionMeta(item).confidentialite} / partage restreint journalisé` },
]
const specialCases = [
  {
    value: 'zf',
    subtitle: 'Conventions de zone franche avec quotas, intrants et contrôles d export.',
    points: ['Suivre les quotas et obligations export', 'Tracer les intrants et équipements exonérés', 'Rattacher la convention aux contrôles SAZOF / OTR'],
  },
  {
    value: 'ci',
    subtitle: 'Conventions d investissement avec CAPEX, emplois et échéances d agrément.',
    points: ['Relier CAPEX et engagements d emplois', 'Afficher durée, renouvellement et sanctions', 'Rapprocher la convention avec DGBF et registre central'],
  },
  {
    value: 'textile',
    subtitle: 'Cas spécialisé textile / habillement 2022-021 avec régime sectoriel dédié.',
    points: ['Rattacher le texte sectoriel 2022-021', 'Suivre emplois, export et chaîne textile', 'Afficher une diffusion adaptée aux données sensibles'],
  },
]
</script>
