<template>
  <div>
    <PageHeader title="Supervision des connecteurs SI" subtitle="Monitorer les flux API avec SYDONIA, SIGTAS, SIGFiP et GUDEF" icon="mdi-api">
      <template #actions>
        <v-chip :color="allOk ? 'success' : 'error'" variant="tonal" size="small" :prepend-icon="allOk ? 'mdi-check-circle' : 'mdi-alert-circle'">
          {{ allOk ? 'Tous actifs' : 'Incidents en cours' }}
        </v-chip>
      </template>
    </PageHeader>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"/>
    <v-alert v-if="loadError" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">
      {{ loadError }}
    </v-alert>

    <v-row class="mb-4">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k"/></v-col>
    </v-row>

    <div v-if="!loading && connecteurs.length === 0 && !loadError" class="text-center pa-10 text-medium-emphasis mb-4">
      <v-icon icon="mdi-api-off" size="48" class="mb-3 opacity-40"/>
      <div class="text-body-1 font-weight-semibold mb-1">Aucun connecteur configuré</div>
      <div class="text-caption">L'API ne retourne aucun connecteur SI pour le moment.</div>
    </div>

    <v-row v-else>
      <v-col v-for="c in connecteurs" :key="c.id" cols="12" md="6">
        <ConnectorStatusCard :connector="c" @show-logs="showLogs"/>
      </v-col>
    </v-row>

    <!-- API Logs -->
    <v-card rounded="lg" elevation="1" class="mt-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between flex-wrap ga-2">
        <span>Journal des flux API (GET /connecteurs/:id/logs)</span>
        <div class="d-flex align-center ga-2">
          <v-select
            v-model="logsConnecteurId"
            :items="connecteurs"
            item-title="nom"
            item-value="id"
            label="Connecteur"
            density="compact"
            hide-details
            style="min-width:220px"
            :disabled="connecteurs.length === 0"
            @update:model-value="chargerLogs"
          />
          <v-btn size="x-small" variant="tonal" prepend-icon="mdi-refresh" :loading="logsLoading" @click="chargerLogs">Rafraîchir</v-btn>
        </div>
      </v-card-title>
      <v-progress-linear v-if="logsLoading" indeterminate color="primary"/>
      <v-alert v-else-if="logsError" type="error" variant="tonal" density="compact" rounded="lg" class="ma-3">
        {{ logsError }}
      </v-alert>
      <div v-else-if="logs.length === 0" class="text-center pa-8 text-medium-emphasis">
        <v-icon icon="mdi-text-search" size="40" class="mb-2 opacity-40"/>
        <div class="text-body-2">Aucun log d'échange pour ce connecteur.</div>
        <div class="text-caption">Les échanges entrants/sortants seront journalisés ici dès qu'ils auront lieu.</div>
      </div>
      <v-table v-else density="compact" hover>
        <thead>
          <tr>
            <th class="text-left">Horodatage</th>
            <th class="text-left">Direction</th>
            <th class="text-left">Opération</th>
            <th class="text-right">HTTP</th>
            <th class="text-right">Durée</th>
            <th class="text-left">Erreur</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td class="text-caption">{{ new Date(log.createdAt).toLocaleString('fr-FR', { hour12: false }) }}</td>
            <td>
              <v-chip size="x-small" variant="tonal" :color="log.direction === 'sortant' ? 'info' : 'secondary'">
                {{ log.direction }}
              </v-chip>
            </td>
            <td class="text-caption">{{ log.operation }}</td>
            <td class="text-right text-caption">{{ log.statutHttp ?? '—' }}</td>
            <td class="text-right text-caption">{{ log.dureeMs != null ? `${log.dureeMs} ms` : '—' }}</td>
            <td>
              <v-tooltip v-if="log.estErreur" :text="log.messageErreur || 'Erreur'" location="left">
                <template #activator="{ props }">
                  <v-chip v-bind="props" size="x-small" color="error" variant="tonal" prepend-icon="mdi-alert-circle">Erreur</v-chip>
                </template>
              </v-tooltip>
              <span v-else class="text-caption text-medium-emphasis">—</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import ConnectorStatusCard from '../../components/ConnectorStatusCard.vue'
import type { Connecteur } from '../../types'
import {
  listerConnecteurs,
  getConnecteursStatus,
  listerConnecteurLogs,
  type ConnecteurLogApi,
} from '../../services/connecteurs'

const connecteurs = ref<Connecteur[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)

const logs = ref<ConnecteurLogApi[]>([])
const logsConnecteurId = ref<string | null>(null)
const logsLoading = ref(false)
const logsError = ref<string | null>(null)

/** Fusionne GET /connecteurs (endpoint, volume24h) et GET /connecteurs/status (heartbeat, erreurs 24h). */
async function charger() {
  loading.value = true
  loadError.value = null
  try {
    const [liste, status] = await Promise.all([listerConnecteurs(), getConnecteursStatus()])
    const statutParId = new Map(status.connecteurs.map(s => [s.id, s]))
    connecteurs.value = liste.map(c => {
      const s = statutParId.get(c.id)
      const inst = c.institutions ?? s?.institution ?? null
      return {
        id: c.id,
        nom: c.nom,
        systeme: inst ? `${c.codeSysteme} — ${inst.nom}` : c.codeSysteme,
        statut: (c.statutCode || 'inactif') as Connecteur['statut'],
        latenceMs: s?.latenceMs ?? c.latenceMs ?? 0,
        tauxErreur: Number(s?.tauxErreur ?? c.tauxErreur ?? 0),
        dernierSync: s?.dernierHeartbeat ?? c.dernierSync ?? null,
        volume24h: c.volume24h ?? 0,
        endpoint: c.endpoint ?? '',
      }
    })
    if (!logsConnecteurId.value && connecteurs.value.length) {
      logsConnecteurId.value = connecteurs.value[0].id
      await chargerLogs()
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Impossible de charger les connecteurs'
    connecteurs.value = []
  } finally {
    loading.value = false
  }
}

async function chargerLogs() {
  if (!logsConnecteurId.value) return
  logsLoading.value = true
  logsError.value = null
  try {
    logs.value = await listerConnecteurLogs(logsConnecteurId.value)
  } catch (e) {
    logsError.value = e instanceof Error ? e.message : 'Impossible de charger les logs'
    logs.value = []
  } finally {
    logsLoading.value = false
  }
}

function showLogs(c: Connecteur) {
  logsConnecteurId.value = c.id
  chargerLogs()
}

const allOk = computed(() => connecteurs.value.length > 0 && connecteurs.value.every(c => c.statut === 'actif'))
const kpis = computed(() => [
  { label: 'Connecteurs actifs', value: connecteurs.value.filter(c=>c.statut==='actif').length + ' / ' + connecteurs.value.length, icon: 'mdi-api', color: 'success', to: '/admin/connecteurs' },
  { label: 'Connecteurs en erreur', value: connecteurs.value.filter(c=>c.statut==='erreur').length, icon: 'mdi-api-off', color: 'error', to: '/admin/monitoring' },
  { label: 'Volume 24h (total)', value: connecteurs.value.reduce((a,c)=>a+c.volume24h,0).toLocaleString('fr-FR'), icon: 'mdi-transfer', color: 'info', to: '/admin/monitoring' },
  { label: 'Latence moyenne', value: (() => { const actifs = connecteurs.value.filter(c=>c.latenceMs>0); return actifs.length ? Math.round(actifs.reduce((a,c)=>a+c.latenceMs,0)/actifs.length) + ' ms' : '—' })(), icon: 'mdi-clock-fast', color: 'primary', to: '/admin/monitoring' },
])

onMounted(charger)
</script>
