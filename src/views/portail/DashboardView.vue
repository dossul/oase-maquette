<template>
  <div>
    <PageHeader title="Mon Tableau de bord" subtitle="Vue d'ensemble de vos demandes d'exonération" icon="mdi-view-dashboard" >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" to="/portail/nouvelle-demande" size="small">
          Nouvelle demande
        </v-btn>
      </template>
    </PageHeader>

    <!-- Alert: expiring soon — calculée sur les échéances réelles des demandes -->
    <AlertBanner
      v-if="expirationsProches.length > 0"
      type="warning"
      title="Exonération arrivant à expiration"
      :text="`${expirationsProches.length} demande(s) arrivent à échéance dans moins de 30 jours (prochaine : ${expirationsProches[0].reference}, le ${formatDate(expirationsProches[0].dateEcheance)}). Pensez à demander un renouvellement.`"
    />

    <!-- KPI cards -->
    <v-row class="mb-6">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>

    <!-- Quick filter -->
    <div class="d-flex align-center ga-2 mb-4 flex-wrap">
      <span class="text-body-2 font-weight-medium text-medium-emphasis me-1">Filtrer :</span>
      <v-btn
        v-for="f in filters"
        :key="f.value"
        :color="activeFilter === f.value ? 'primary' : 'default'"
        variant="tonal"
        size="small"
        rounded="pill"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
      </v-btn>
    </div>

    <!-- Recent requests list -->
    <v-card rounded="lg" elevation="1">
      <v-card-title class="pa-4 pb-0 text-body-1 font-weight-semibold">Mes demandes récentes</v-card-title>
      <v-card-text class="pa-0">
        <v-list lines="two" class="pa-0">
          <v-list-item
            v-for="(d, i) in filteredDemandes"
            :key="d.id"
            :to="`/portail/demandes/${d.id}`"
            :divider="i < filteredDemandes.length - 1"
            rounded="0"
            class="py-3 px-4"
          >
            <template #prepend>
              <v-avatar color="surface-light" size="40" rounded="lg" class="me-3">
                <v-icon :icon="typeIcon(d.type)" color="primary" size="20" />
              </v-avatar>
            </template>
            <template #title>
              <div class="d-flex align-center ga-2 flex-wrap">
                <span class="font-weight-semibold text-body-2">{{ d.reference }}</span>
                <StatusChip :statut="d.statut" />
              </div>
            </template>
            <template #subtitle>
              <span class="text-caption">{{ EXO_TYPE_LABELS[d.type] }} · {{ d.secteur }} · Déposé le {{ formatDate(d.dateDepot) }}</span>
            </template>
            <template #append>
              <div class="text-end">
                <div class="font-weight-semibold text-body-2 text-primary">{{ formatMontant(d.montantFCFA) }}</div>
                <div class="text-caption text-medium-emphasis">{{ d.etapeActuelle }}</div>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Feed — notifications réelles (GET /notifications) -->
    <v-card rounded="lg" elevation="1" class="mt-4">
      <v-card-title class="pa-4 pb-0 text-body-1 font-weight-semibold">Notifications récentes</v-card-title>
      <v-card-text class="pa-0">
        <v-list v-if="recentNotifs.length > 0" density="compact" class="pa-0">
          <v-list-item v-for="n in recentNotifs" :key="n.id" :prepend-icon="notifIcon(n.type)" :subtitle="formatDate(n.date)" class="py-2">
            <template #title><span class="text-body-2">{{ n.message }}</span></template>
          </v-list-item>
        </v-list>
        <div v-else class="pa-4 text-center text-medium-emphasis text-body-2">
          Aucune notification récente
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import StatusChip from '../../components/StatusChip.vue'
import AlertBanner from '../../components/AlertBanner.vue'
import { listerDemandes } from '../../services/demandes'
import { listerNotifications, mapTypeNotification } from '../../services/notifications'
import { EXO_TYPE_LABELS } from '../../types'
import type { ExoType } from '../../types'

const activeFilter = ref('all')
// OASE [Recette E2E] : valeurs alignées sur les statuts CANONIQUES de l'API
// (approuve, en_instruction, action_requise, archive — et non 'accordee'/'archivee').
const filters = [
  { label: 'Toutes', value: 'all' },
  { label: 'Actives', value: 'approuve' },
  { label: 'En instruction', value: 'en_instruction' },
  { label: 'Action requise', value: 'action_requise' },
  { label: 'Archivées', value: 'archive' },
]

const demandesApi = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

interface NotifRecente {
  id: string
  type: 'action' | 'info' | 'alerte' | 'systeme'
  message: string
  date: string
}
const recentNotifs = ref<NotifRecente[]>([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await listerDemandes()
    demandesApi.value = res.data.map((d) => ({
      ...d,
      statut: d.statutCode,
      montantFCFA: Number(d.montantFcfa),
      dateDepot: d.dateDepot ? new Date(d.dateDepot).toISOString() : '',
      etapeActuelle: d.etapeActuelle || d.statutCode,
      type: d.type || 'fiscale_tva',
    }))
  } catch (e) {
    error.value = 'Impossible de charger les demandes'
  } finally {
    loading.value = false
  }
  try {
    const notifs = await listerNotifications()
    recentNotifs.value = notifs.slice(0, 4).map((n) => ({
      id: n.id,
      type: mapTypeNotification(n.typeNotificationCode),
      message: n.corps || n.titre,
      date: n.createdAt,
    }))
  } catch { /* flux de notifications indisponible : état vide affiché */ }
})

const filteredDemandes = computed(() =>
  activeFilter.value === 'all' ? demandesApi.value : demandesApi.value.filter(d => d.statut === activeFilter.value)
)

/** Demandes dont l'échéance réelle intervient dans moins de 30 jours. */
const expirationsProches = computed(() => {
  const dans30j = Date.now() + 30 * 24 * 3600 * 1000
  return demandesApi.value
    .filter(d => d.dateEcheance && new Date(d.dateEcheance).getTime() > Date.now() && new Date(d.dateEcheance).getTime() <= dans30j)
    .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime())
})

const kpis = computed(() => [
  { label: 'Demandes en cours', value: demandesApi.value.filter(d => ['soumis', 'en_instruction'].includes(d.statut)).length, icon: 'mdi-clock-outline', color: 'info' },
  { label: 'Demandes approuvées actives', value: demandesApi.value.filter(d => d.statut === 'approuve').length, icon: 'mdi-check-circle', color: 'success', subtitle: expirationsProches.value.length > 0 ? `${expirationsProches.value.length} expire(nt) dans 30j` : undefined, to: '/portail/exonerations-actives' },
  { label: 'Actions requises', value: demandesApi.value.filter(d => d.statut === 'action_requise').length, icon: 'mdi-alert-circle', color: 'warning' },
  { label: 'Expirées / Clôturées', value: demandesApi.value.filter(d => ['archive', 'rejete', 'expire'].includes(d.statut)).length, icon: 'mdi-archive', color: 'secondary', to: '/portail/exonerations-actives' },
])

const typeIcon = (type: ExoType) => {
  const m: Record<ExoType, string> = { douaniere: 'mdi-truck', fiscale_is: 'mdi-bank', fiscale_tva: 'mdi-percent', zone_franche: 'mdi-factory', code_investissement: 'mdi-handshake', sectorielle: 'mdi-domain' }
  return m[type]
}
const notifIcon = (t: string) => ({ action: 'mdi-alert-circle', info: 'mdi-information', alerte: 'mdi-bell-alert', systeme: 'mdi-cog' }[t] || 'mdi-bell')
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
const formatMontant = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(v)
</script>
