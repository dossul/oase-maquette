<template>
  <div>
    <PageHeader
      title="Tableau de bord DSI / MEF"
      subtitle="Hébergement souverain, sécurité, APIs et continuité de service OASE"
      icon="mdi-server-security"
    >
      <template #actions>
        <v-chip :color="santeApi === 'ok' ? 'success' : santeApi === 'erreur' ? 'error' : 'secondary'" variant="tonal" size="small" prepend-icon="mdi-heart-pulse">
          API {{ santeApi === 'ok' ? 'opérationnelle' : santeApi === 'erreur' ? 'en erreur' : '…' }}
        </v-chip>
      </template>
    </PageHeader>

    <v-alert v-if="erreur" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ erreur }}</v-alert>

    <!-- KPIs réels (GET /connecteurs/status) -->
    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
            Interfaces SI — états réels (source : GET /connecteurs/status)
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="interfaces"
            :loading="chargement"
            hover
            density="compact"
            no-data-text="Aucun connecteur enregistré."
          >
            <template #item.statut="{ item }">
              <v-chip :color="statutColor(item.statutCode)" size="x-small" variant="tonal">{{ item.statutCode }}</v-chip>
            </template>
            <template #item.erreurs="{ item }">
              <v-chip :color="item.erreurs24h > 0 ? 'error' : 'success'" size="x-small" variant="tonal">
                {{ item.erreurs24h }} err / 24h
              </v-chip>
            </template>
            <template #item.heartbeat="{ item }">
              {{ item.dernierHeartbeat ? new Date(item.dernierHeartbeat).toLocaleString('fr-FR') : 'Jamais' }}
            </template>
          </v-data-table>
          <v-card-text class="pa-4 pt-2">
            <v-alert type="info" variant="tonal" rounded="lg" density="compact">
              Les interconnexions SYDONIA / E-TAX sont déclarées actives au registre ; les SI externes restent hors périmètre de recette à cette étape du projet (volonté client).
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Livrables Phase 2 visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Catalogue des interfaces" prepend-icon="mdi-api" />
            <v-list-item title="MCD / MLD des 9 entites et 11 referentiels" prepend-icon="mdi-database-edit-outline" />
            <v-list-item title="Matrice RACI et points focaux" prepend-icon="mdi-account-network-outline" />
            <v-list-item title="Plan de migration MRD 2024" prepend-icon="mdi-swap-horizontal-bold" />
            <v-list-item title="Spec workflow et signatures TSA" prepend-icon="mdi-signature-freehand" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Risque et conformite</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="API-first et versionning" prepend-icon="mdi-source-branch" />
            <v-list-item title="Sauvegardes chiffrees et restauration" prepend-icon="mdi-database-lock-outline" />
            <v-list-item title="Audits dev / test / prod" prepend-icon="mdi-shield-search-outline" />
            <v-list-item title="Journal securite et traces sensibles" prepend-icon="mdi-history" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { api, ApiError } from '../../services/api'
import { getConnecteursStatus, type ConnecteurStatusEntry } from '../../services/connecteurs'

const chargement = ref(false)
const erreur = ref('')
const santeApi = ref<'ok' | 'erreur' | 'inconnu'>('inconnu')
const statut = ref<{ jobsActifs: number; connecteurs: ConnecteurStatusEntry[] }>({ jobsActifs: 0, connecteurs: [] })

onMounted(async () => {
  chargement.value = true
  try {
    const [statusRes, healthRes] = await Promise.allSettled([
      getConnecteursStatus(),
      api<{ status: string }>('/health'),
    ])
    if (statusRes.status === 'fulfilled') {
      statut.value = { jobsActifs: statusRes.value.jobsActifs, connecteurs: statusRes.value.connecteurs }
    } else {
      erreur.value = statusRes.reason instanceof ApiError ? statusRes.reason.message : 'Impossible de charger les interfaces.'
    }
    if (healthRes.status === 'fulfilled') santeApi.value = healthRes.value.status === 'ok' ? 'ok' : 'erreur'
    else santeApi.value = 'erreur'
  } finally {
    chargement.value = false
  }
})

const interfaces = computed(() => statut.value.connecteurs)

const kpis = computed(() => {
  const actifs = interfaces.value.filter((c) => c.statutCode === 'actif').length
  const erreurs24h = interfaces.value.reduce((s, c) => s + (c.erreurs24h ?? 0), 0)
  return [
    { label: 'Interfaces déclarées', value: String(interfaces.value.length), icon: 'mdi-api', color: 'primary', subtitle: `${actifs} active(s) au registre` },
    { label: 'Erreurs d\'échange (24h)', value: String(erreurs24h), icon: 'mdi-alert-circle-outline', color: erreurs24h > 0 ? 'error' : 'success', subtitle: 'Journaux connecteurs réels' },
    { label: 'Jobs en file', value: String(statut.value.jobsActifs), icon: 'mdi-cog-sync-outline', color: 'info', subtitle: 'File d\'attente OASE' },
  ]
})

const headers = [
  { title: 'Interface', key: 'nom' },
  { title: 'Code', key: 'codeSysteme' },
  { title: 'Statut', key: 'statut' },
  { title: 'Erreurs', key: 'erreurs' },
  { title: 'Latence (ms)', key: 'latenceMs' },
  { title: 'Dernier heartbeat', key: 'heartbeat' },
]

const statutColor = (s: string) =>
  ({ actif: 'success', inactif: 'secondary', erreur: 'error', maintenance: 'warning' } as Record<string, string>)[s] || 'secondary'
</script>
