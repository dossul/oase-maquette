<template>
  <div>
    <PageHeader
      title="Requetes dynamiques"
      subtitle="Constructeur transverse de requetes, exports et jeux de colonnes selon le role et la confidentialite"
      icon="mdi-table-search"
    >
      <template #actions>
        <v-btn color="primary" size="small" prepend-icon="mdi-refresh" :loading="loading" @click="executer">Executer</v-btn>
      </template>
    </PageHeader>

    <v-row>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Constructeur</v-card-title>
          <v-card-text>
            <v-select :items="['Registre central', 'Archives', 'Rapprochements', 'Rapports CONEDEF']" label="Source" density="compact" class="mb-2" />
            <v-select :items="['Mesure', 'Contribuable', 'Regime', 'Secteur', 'Montant exonere', 'Qualite donnee']" label="Colonnes visibles" multiple chips closable-chips density="compact" class="mb-2" />
            <v-select :items="['Public', 'Interne', 'Restreint', 'Confidentiel']" label="Niveau de confidentialite" density="compact" class="mb-2" />
            <v-textarea label="Filtres logiques" rows="4" density="compact" placeholder="ex: statut = 'approuve' AND secteur = 'Industrie textile'" />
            <div class="text-caption text-medium-emphasis mt-2">
              La previsualisation execute une requete reelle sur le registre (GET /demandes).
            </div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Bibliotheque officielle</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Annexe LFI par impôt / fonction budgétaire" prepend-icon="mdi-briefcase-outline" />
            <v-list-item title="Liste mesures temporaires a echeance 90 jours" prepend-icon="mdi-calendar-alert-outline" />
            <v-list-item title="Rapport qualite de donnees par institution" prepend-icon="mdi-file-chart-outline" />
            <v-list-item title="Preparation rapport CONEDEF" prepend-icon="mdi-chart-box-outline" />
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Resultat de previsualisation (donnees reelles)
            <v-chip size="x-small" color="primary" variant="tonal">{{ rows.length }} ligne(s)</v-chip>
          </v-card-title>
          <v-alert v-if="loadError" type="error" variant="tonal" density="compact" rounded="lg" class="ma-3">{{ loadError }}</v-alert>
          <v-data-table :headers="headers" :items="rows" :loading="loading" hover>
            <template #item.montant="{ item }">
              {{ item.montant }}
            </template>
            <template #no-data>
              <div class="text-center pa-6 text-medium-emphasis">
                <v-icon icon="mdi-table-off" size="36" class="mb-2 opacity-40"/>
                <div class="text-body-2">Aucun dossier dans le registre.</div>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Regles de sortie</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Exports selon role et confidentialite" prepend-icon="mdi-shield-account-outline" />
            <v-list-item title="Historique des requetes partagees" prepend-icon="mdi-history" />
            <v-list-item title="Colonnes masquees si niveau sensible" prepend-icon="mdi-eye-off-outline" />
            <v-list-item title="Formats CSV / XLSX / PDF / API" prepend-icon="mdi-file-export-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { listerDemandesApi } from '../../services/demandes'

const headers = [
  { title: 'Reference', key: 'reference' },
  { title: 'Contribuable', key: 'contribuable' },
  { title: 'NIF', key: 'nif' },
  { title: 'Secteur', key: 'secteur' },
  { title: 'Statut', key: 'statut' },
  { title: 'Montant exonere', key: 'montant' },
]

interface Row {
  reference: string
  contribuable: string
  nif: string
  secteur: string
  statut: string
  montant: string
}

const rows = ref<Row[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)

async function executer() {
  loading.value = true
  loadError.value = null
  try {
    const res = await listerDemandesApi()
    rows.value = res.data.map(d => ({
      reference: d.reference,
      contribuable: d.contribuable?.raisonSociale ?? '—',
      nif: d.contribuable?.nif ?? '—',
      secteur: d.secteur ?? '—',
      statut: d.statutCode,
      montant: `${Number(d.montantFcfa).toLocaleString('fr-FR')} FCFA`,
    }))
  } catch (e) {
    rows.value = []
    loadError.value = e instanceof Error ? e.message : 'Erreur lors de l\'execution de la requete'
  } finally {
    loading.value = false
  }
}

onMounted(executer)
</script>
