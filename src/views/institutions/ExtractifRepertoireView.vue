<template>
  <div>
    <PageHeader
      title="Répertoire minier"
      subtitle="Permis, titres et autorisations du secteur extractif — Annexe 1.1 ITIE (feuilles 16-17)"
      icon="mdi-map-marker-radius-outline"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-refresh" :loading="loading" @click="charger">Actualiser</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-card rounded="lg" elevation="1">
      <v-card-title class="pa-4 pb-0 d-flex flex-wrap align-center ga-3">
        <span class="text-body-1 font-weight-semibold flex-grow-1">Registre des permis</span>
        <v-select
          v-model="filtreType"
          :items="itemsType"
          label="Type de permis"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="max-width: 220px"
        />
        <v-select
          v-model="filtreStatut"
          :items="itemsStatut"
          label="Statut"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="max-width: 180px"
        />
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        hover
        no-data-text="Aucun permis enregistré pour ces critères."
        @click:row="(_, { item }) => ouvrirDetail(item.raw)"
      >
        <template #item.typePermis="{ item }">
          <v-chip :color="typeColor(item.typePermis)" size="x-small" variant="tonal">{{ libelleType(item.typePermis) }}</v-chip>
        </template>
        <template #item.statut="{ item }">
          <v-chip :color="statutColor(item.statut)" size="x-small" variant="outlined">{{ item.statut }}</v-chip>
        </template>
        <template #item.expiration="{ item }">
          <v-chip v-if="item.expireBientot" color="warning" size="x-small" variant="tonal" prepend-icon="mdi-alarm">{{ item.expiration }}</v-chip>
          <span v-else>{{ item.expiration }}</span>
        </template>
        <template #item.rapportEie="{ item }">
          <v-icon :color="item.rapportEiePublic ? 'success' : 'secondary'" size="small">
            {{ item.rapportEiePublic ? 'mdi-check-circle' : 'mdi-minus-circle-outline' }}
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <!-- Détail d'un permis (données réelles GET /permis-miniers) -->
    <v-dialog v-model="dialog" max-width="620">
      <v-card v-if="selection" rounded="lg">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
          <span class="text-body-1 font-weight-semibold">{{ selection.reference }}</span>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="dialog = false" />
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <div class="mb-3">
            <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">Titulaire</div>
            <div class="font-weight-semibold">{{ selection.contribuables?.raisonSociale ?? '—' }}</div>
            <div class="text-caption text-medium-emphasis">NIF {{ selection.contribuables?.nif ?? '—' }}</div>
          </div>
          <v-row dense>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Type</div><div>{{ libelleType(selection.typePermis) }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Substance</div><div>{{ selection.substance }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Date de demande</div><div>{{ formatDate(selection.dateDemande) }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Date d'octroi</div><div>{{ formatDate(selection.dateOctroi) }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Durée</div><div>{{ selection.dureeAnnees }} ans</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Expiration</div><div>{{ expiration(selection) }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Superficie</div><div>{{ selection.superficieKm2 != null ? `${selection.superficieKm2} km²` : '—' }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Localité</div><div>{{ selection.localite ?? '—' }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Coordonnées</div><div>{{ coords(selection) }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Mode d'octroi</div><div>{{ libelleMode(selection.modeOctroi) }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Statut</div><v-chip :color="statutColor(selection.statut)" size="x-small" variant="outlined">{{ selection.statut }}</v-chip></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Convention rattachée</div><div>{{ selection.conventions?.reference ?? '—' }}</div></v-col>
          </v-row>
          <div class="mt-3">
            <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">Rapport EIE</div>
            <div v-if="selection.rapportEiePublic && selection.lienRapportEie">
              <a :href="selection.lienRapportEie" target="_blank" rel="noopener">{{ selection.lienRapportEie }}</a>
            </div>
            <div v-else class="text-body-2">{{ selection.rapportEiePublic ? 'Public (lien non renseigné)' : 'Non public' }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { listerPermisMiniers, type PermisMinierApi } from '../../services/backoffice'

const loading = ref(false)
const error = ref<string | null>(null)
const permis = ref<PermisMinierApi[]>([])
const dialog = ref(false)
const selection = ref<PermisMinierApi | null>(null)
const filtreType = ref<string | null>(null)
const filtreStatut = ref<string | null>(null)

const itemsType = [
  { title: 'Recherche', value: 'recherche' },
  { title: 'Exploitation', value: 'exploitation' },
  { title: 'Carrière', value: 'carriere' },
]
const itemsStatut = ['actif', 'expire', 'suspendu', 'retire']

async function charger() {
  loading.value = true
  error.value = null
  try {
    permis.value = await listerPermisMiniers({
      typePermis: filtreType.value ?? undefined,
      statut: filtreStatut.value ?? undefined,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger le répertoire minier.'
  } finally {
    loading.value = false
  }
}

onMounted(charger)

// Recharge serveur-side quand un filtre change
watch([filtreType, filtreStatut], charger)

function ouvrirDetail(p: PermisMinierApi) {
  selection.value = p
  dialog.value = true
}

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')

// Expiration = date d'octroi + durée (le schéma ne porte pas de date de fin explicite)
function dateExpiration(p: PermisMinierApi): Date | null {
  if (!p.dateOctroi) return null
  const d = new Date(p.dateOctroi)
  d.setFullYear(d.getFullYear() + p.dureeAnnees)
  return d
}
const expiration = (p: PermisMinierApi) => {
  const d = dateExpiration(p)
  return d ? d.toLocaleDateString('fr-FR') : '—'
}
const DANS_24_MOIS = 2 * 365 * 24 * 3600 * 1000
const expireBientot = (p: PermisMinierApi) => {
  const d = dateExpiration(p)
  return p.statut === 'actif' && d != null && d.getTime() - Date.now() < DANS_24_MOIS
}

const kpis = computed(() => [
  { label: 'Permis enregistrés', value: String(permis.value.length), icon: 'mdi-map-marker-radius-outline', color: 'primary', subtitle: 'Source : API /permis-miniers' },
  { label: 'Exploitations actives', value: String(permis.value.filter((p) => p.typePermis === 'exploitation' && p.statut === 'actif').length), icon: 'mdi-pickaxe', color: 'secondary', subtitle: 'Permis d\'exploitation en cours' },
  { label: 'Expirations < 24 mois', value: String(permis.value.filter(expireBientot).length), icon: 'mdi-alarm', color: 'warning', subtitle: 'Permis actifs arrivant à terme' },
])

const headers = [
  { title: 'Référence', key: 'reference' },
  { title: 'Titulaire', key: 'titulaire' },
  { title: 'Type', key: 'typePermis' },
  { title: 'Substance', key: 'substance' },
  { title: 'Localité', key: 'localite' },
  { title: 'Expiration', key: 'expiration' },
  { title: 'EIE public', key: 'rapportEie' },
  { title: 'Statut', key: 'statut' },
]

const rows = computed(() =>
  permis.value.map((p) => ({
    reference: p.reference,
    titulaire: p.contribuables?.raisonSociale ?? '—',
    typePermis: p.typePermis,
    substance: p.substance,
    localite: p.localite ?? '—',
    expiration: expiration(p),
    expireBientot: expireBientot(p),
    rapportEiePublic: p.rapportEiePublic,
    statut: p.statut,
    raw: p,
  })),
)

const libelleType = (t: string) => ({ recherche: 'Recherche', exploitation: 'Exploitation', carriere: 'Carrière' } as Record<string, string>)[t] || t
const libelleMode = (m: string) =>
  ({ ao_ouvert: 'Appel d\'offres ouvert', ao_international: 'AO international', ao_restreint: 'AO restreint', gre_a_gre: 'Gré à gré', premier_venu: 'Premier venu' } as Record<string, string>)[m] || m
const typeColor = (t: string) => ({ recherche: 'info', exploitation: 'primary', carriere: 'secondary' } as Record<string, string>)[t] || 'secondary'
const statutColor = (s: string) => ({ actif: 'success', expire: 'error', suspendu: 'warning', retire: 'secondary' } as Record<string, string>)[s] || 'secondary'
const coords = (p: PermisMinierApi) => (p.longitude != null && p.latitude != null ? `${p.latitude}, ${p.longitude}` : '—')
</script>
