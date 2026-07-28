<template>
  <div>
    <v-container style="max-width:1280px" class="py-8">
      <PageHeader title="Bibliothèque des rapports publiés" subtitle="Rapports officiels sur les dépenses fiscales — République Togolaise / MEF" icon="mdi-bookshelf"/>
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model="search" label="Rechercher dans les rapports…" prepend-inner-icon="mdi-magnify" hide-details clearable/></v-col>
            <v-col cols="6" md="3"><v-select v-model="filterAnnee" :items="annees" label="Année" hide-details clearable/></v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
      <v-alert v-else-if="error" type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>
      <v-alert v-else-if="!filteredRapports.length" type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
        Aucun rapport publié pour le moment.
      </v-alert>
      <v-row>
        <v-col v-for="r in filteredRapports" :key="r.id" cols="12" md="6" lg="4">
          <v-card rounded="lg" elevation="1" hover class="h-100">
            <v-card-text class="pa-5">
              <div class="d-flex align-start ga-4">
                <v-avatar color="error" size="48" rounded="lg">
                  <v-icon icon="mdi-file-pdf-box" color="white" size="24"/>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="font-weight-bold text-body-1 mb-1">{{ r.titre }}</div>
                  <v-chip :color="r.typeColor" size="x-small" variant="tonal" class="mb-2">{{ r.type }}</v-chip>
                  <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                    <v-icon icon="mdi-calendar" size="12"/>{{ r.datePublication }}
                    <template v-if="r.taille"><v-icon icon="mdi-weight" size="12" class="ms-2"/>{{ r.taille }}</template>
                  </div>
                </div>
              </div>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
              <v-btn v-if="r.fichierUrl" color="primary" variant="tonal" prepend-icon="mdi-download" size="small" block :href="r.fichierUrl" :download="r.nomFichier">Télécharger</v-btn>
              <v-chip v-else size="small" variant="tonal" color="warning" class="mx-auto">Fichier indisponible</v-chip>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { listerRapports, labelTypeRapport, tailleDataUri, type RapportApi } from '../../services/rapports'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const search = ref('')
const filterAnnee = ref<string | null>(null)

// Rapports réels (GET /rapports). Endpoint AUTHENTIFIÉ : en accès anonyme on n'appelle
// PAS l'API (un appel sans session produirait un 401 garanti — détecté par la recette
// TC-P6-04) et on affiche l'état « connexion requise » à la place.
const loading = ref(false)
const error = ref<string | null>(null)
const rapports = ref<RapportApi[]>([])

onMounted(async () => {
  if (!auth.isAuthenticated) {
    error.value = 'La bibliothèque de rapports n\'est pas accessible sans connexion.'
    return
  }
  loading.value = true
  try {
    rapports.value = await listerRapports()
  } catch {
    error.value = 'La bibliothèque de rapports n\'est pas accessible sans connexion.'
    rapports.value = []
  } finally {
    loading.value = false
  }
})

const annees = computed(() =>
  [...new Set(rapports.value.map((r) => r.periodeAnnee).filter((a): a is number => !!a))].map(String).sort().reverse(),
)

const rows = computed(() =>
  rapports.value.map((r) => ({
    id: r.id,
    titre: `${labelTypeRapport(r.typeRapportCode)}${r.periodeAnnee ? ` ${r.periodeAnnee}` : ''}${r.periodeMois ? ` — ${String(r.periodeMois).padStart(2, '0')}` : ''}`,
    type: labelTypeRapport(r.typeRapportCode),
    typeColor: r.statutCode === 'completed' ? 'primary' : 'warning',
    datePublication: r.dateFin ? new Date(r.dateFin).toLocaleDateString('fr-FR') : '—',
    taille: tailleDataUri(r.fichierUrl),
    annee: r.periodeAnnee ? String(r.periodeAnnee) : null,
    fichierUrl: r.statutCode === 'completed' ? r.fichierUrl : null,
    nomFichier: `oase-rapport-${r.typeRapportCode}-${r.periodeAnnee ?? 'nd'}.json`,
  })),
)

const filteredRapports = computed(() => rows.value.filter(r => {
  if (filterAnnee.value && r.annee !== filterAnnee.value) return false
  if (search.value && !r.titre.toLowerCase().includes(search.value.toLowerCase())) return false
  return true
}))
</script>
