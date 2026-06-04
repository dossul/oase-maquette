<template>
  <div>
    <PageHeader title="Référentiels OASE" subtitle="Textes juridiques, nomenclatures et référentiels normés alimentant OASE" icon="mdi-shape-plus">
      <template #actions>
        <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="addDialog=true">Ajouter un texte</v-btn>
      </template>
    </PageHeader>
    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <v-card rounded="lg" elevation="1">
          <v-card-text class="pa-4">
            <div class="text-caption text-medium-emphasis">{{ kpi.label }}</div>
            <div class="text-h6 font-weight-bold">{{ kpi.value }}</div>
            <div class="text-caption">{{ kpi.subtitle }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" density="compact" class="mb-3">
      <v-tab value="juridique" prepend-icon="mdi-gavel">Juridique</v-tab>
      <v-tab value="normes" prepend-icon="mdi-table-column-plus-after">11 référentiels</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="juridique">
        <v-card rounded="lg" elevation="1">
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12" md="5"><v-text-field v-model="search" label="Recherche full-text dans les textes…" prepend-inner-icon="mdi-magnify" hide-details clearable/></v-col>
              <v-col cols="6" md="3"><v-select v-model="filterType" :items="typeTextes" label="Type de texte" hide-details clearable/></v-col>
              <v-col cols="6" md="2"><v-select v-model="filterStatut" :items="['En vigueur','Abrogé']" label="Statut" hide-details clearable/></v-col>
            </v-row>
          </v-card-text>
          <v-data-table :headers="headers" :items="filteredTextes" :search="search" hover>
            <template #item.statut="{ item }">
              <v-chip :color="item.statut==='En vigueur'?'success':'error'" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #item.alerte="{ item }">
              <v-chip v-if="item.statut==='Abrogé' && item.dossiersActifs>0" color="error" size="x-small" variant="tonal" prepend-icon="mdi-alert">
                {{ item.dossiersActifs }} dossier(s) actif(s)
              </v-chip>
            </template>
            <template #item.actions>
              <v-btn size="x-small" variant="tonal" color="primary" class="me-1">Modifier</v-btn>
              <v-btn size="x-small" variant="tonal" color="secondary">Historique</v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <v-window-item value="normes">
        <v-card rounded="lg" elevation="1">
          <v-data-table :headers="refHeaders" :items="referentielsNormes" hover>
            <template #item.statut="{ item }">
              <v-chip :color="item.statut === 'A jour' ? 'success' : 'warning'" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #item.couverture="{ item }">
              <div class="d-flex align-center ga-3">
                <v-progress-linear :model-value="item.couverture" color="primary" rounded height="8" style="max-width: 140px" />
                <span class="text-caption font-weight-semibold">{{ item.couverture }}%</span>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>
    <v-dialog v-model="addDialog" max-width="600">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Ajouter un texte juridique</v-card-title>
        <v-card-text class="pa-5">
          <v-row>
            <v-col cols="12" md="6"><v-select :items="typeTextes" label="Type de texte"/></v-col>
            <v-col cols="12" md="6"><v-text-field label="Numéro / Référence"/></v-col>
            <v-col cols="12"><v-text-field label="Titre du texte"/></v-col>
            <v-col cols="12" md="6"><v-text-field label="Date de publication" type="date"/></v-col>
            <v-col cols="12" md="6"><v-select :items="['En vigueur','Abrogé']" label="Statut"/></v-col>
            <v-col cols="12"><v-textarea label="Articles concernés" rows="2"/></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4"><v-spacer/><v-btn variant="text" @click="addDialog=false">Annuler</v-btn><v-btn color="primary" @click="addDialog=false">Enregistrer</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
const search = ref('')
const filterType = ref(null)
const filterStatut = ref(null)
const addDialog = ref(false)
const tab = ref('juridique')
const typeTextes = ['Code général des impôts','Code des douanes','Loi de finances','Décret','Arrêté','Convention internationale','Code sectoriel']
const kpis = [
  { label: 'Référentiels normés', value: '11', subtitle: 'Nomenclatures OASE' },
  { label: 'Textes en vigueur', value: '148', subtitle: 'Base juridique active' },
  { label: 'Référentiels à revoir', value: '3', subtitle: 'Couverture < 80%' },
  { label: 'Versions historisées', value: '27', subtitle: 'Traçabilité des changements' },
]
const headers = [
  { title: 'Type', key: 'type' }, { title: 'Référence', key: 'reference' },
  { title: 'Titre', key: 'titre' }, { title: 'Publication', key: 'date' },
  { title: 'Statut', key: 'statut' }, { title: 'Alerte dossiers', key: 'alerte', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]
const refHeaders = [
  { title: 'Référentiel', key: 'nom' },
  { title: 'Description', key: 'description' },
  { title: 'Point focal', key: 'pointFocal' },
  { title: 'Couverture', key: 'couverture' },
  { title: 'Statut', key: 'statut' },
]
const textes = [
  { type: 'Code général des impôts', reference: 'CGI 2024', titre: 'Art. 215 — Exonérations douanières permanentes', date: '01/01/2024', statut: 'En vigueur', dossiersActifs: 0 },
  { type: 'Loi de finances', reference: 'LFI 2026 Art. 45', titre: 'Exonérations TVA secteur agricole', date: '01/01/2026', statut: 'En vigueur', dossiersActifs: 0 },
  { type: 'Code sectoriel', reference: 'Code minier 2012 Art.78', titre: 'Exonérations IS sur extraction minière', date: '15/06/2012', statut: 'Abrogé', dossiersActifs: 3 },
  { type: 'Décret', reference: 'Décret 2018-042', titre: 'Régime ZFI — Avantages fiscaux et douaniers', date: '12/04/2018', statut: 'En vigueur', dossiersActifs: 0 },
  { type: 'Code des investissements', reference: 'CI 2017 Art.14', titre: 'Exonérations globales agréments investissement', date: '01/01/2017', statut: 'En vigueur', dossiersActifs: 0 },
]
const referentielsNormes = [
  { nom: 'R_FAMILLE_TEXTE', description: 'Famille de texte et hiérarchie juridique', pointFocal: 'UPF', couverture: 91, statut: 'A jour' },
  { nom: 'R_TYPE_ACTE', description: 'Loi, décret, convention, accord, arrêté, agrément', pointFocal: 'UPF', couverture: 93, statut: 'A jour' },
  { nom: 'R_NATURE_MESURE', description: 'Exonération, franchise, report, suspension, taux réduit', pointFocal: 'UPF', couverture: 87, statut: 'A jour' },
  { nom: 'R_IMPOT_TAXE', description: 'TVA, IS, IRPP, DD, RS, TPI, ADA, DAPP, TSR', pointFocal: 'OTR', couverture: 89, statut: 'A jour' },
  { nom: 'R_TYPE_BENEFICIAIRE', description: 'Entreprise, ONG, OI, corps diplomatique, projet public', pointFocal: 'MEF / MAE', couverture: 84, statut: 'A jour' },
  { nom: 'R_SECTEUR_BRANCHE', description: 'Secteur et branche NES', pointFocal: 'INSEED', couverture: 69, statut: 'A revoir' },
  { nom: 'R_OBJECTIF_POLITIQUE', description: 'Objectif fiscal, économique, social, sectoriel, ODD', pointFocal: 'UPF', couverture: 74, statut: 'A revoir' },
  { nom: 'R_ORGANE', description: 'Organe attributaire, gestionnaire et de contrôle', pointFocal: 'MEF / OTR', couverture: 88, statut: 'A jour' },
  { nom: 'R_SYSTEME_INFORMATION', description: 'Sydonia, E-TAX, DAS, GUDEF, SIGFiP, SIGTAS', pointFocal: 'DSI/MEF', couverture: 81, statut: 'A jour' },
  { nom: 'R_PORTEE_DUREE', description: 'Temporaire, permanente, renouvelable, par phase', pointFocal: 'UPF', couverture: 77, statut: 'A revoir' },
  { nom: 'R_FONCTION_BUDGETAIRE', description: 'Rattachement budgétaire et fonction de politique publique', pointFocal: 'DGBF', couverture: 72, statut: 'A revoir' },
]
const filteredTextes = computed(() => textes.filter(t => {
  if (filterStatut.value && t.statut !== filterStatut.value) return false
  if (filterType.value && t.type !== filterType.value) return false
  return true
}))
</script>
