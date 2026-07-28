<template>
  <div>
    <PageHeader title="Monitoring & Logs système" subtitle="Santé de la plateforme OASE" icon="mdi-monitor-dashboard">
      <template #actions>
        <v-chip :color="systemOk ? 'success' : 'error'" variant="tonal" size="small" prepend-icon="mdi-circle" class="me-2">
          {{ systemOk ? 'Système opérationnel' : 'Incident détecté' }}
        </v-chip>
        <v-btn size="small" variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="charger">Rafraîchir</v-btn>
      </template>
    </PageHeader>

    <v-alert v-if="loadError" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">
      {{ loadError }}
    </v-alert>

    <v-row v-if="loading" class="mb-5">
      <v-col v-for="n in 4" :key="n" cols="6" md="3">
        <v-skeleton-loader type="card" rounded="lg"/>
      </v-col>
    </v-row>

    <v-row v-else class="mb-5">
      <v-col v-for="k in healthKpis" :key="k.label" cols="6" md="3">
        <KpiCard v-bind="k" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <!-- TODO(endpoint): pas de métriques système (CPU / RAM / disque / réseau)
             exposées par l'API v1 — section masquée en attendant l'instrumentation. -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Utilisation des ressources</v-card-title>
          <v-card-text class="pa-6 text-center text-medium-emphasis">
            <v-icon icon="mdi-server-off" size="40" class="mb-2 opacity-40"/>
            <div class="text-body-2">Métriques système non instrumentées.</div>
            <div class="text-caption">CPU, mémoire, disque et réseau seront affichés ici dès qu'un endpoint de métriques existera côté backend.</div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Journaux applicatifs (audit métier réel)
            <v-btn-toggle v-model="logLevel" density="compact" rounded="pill" variant="outlined" mandatory>
              <v-btn value="all" size="x-small">Tous</v-btn>
              <v-btn value="warn" size="x-small">WARN</v-btn>
              <v-btn value="error" size="x-small">ERROR</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-progress-linear v-if="loading" indeterminate color="primary"/>
          <div v-else class="pa-3" style="background:#1E293B;font-family:monospace;font-size:0.72rem;max-height:280px;overflow-y:auto;border-radius:0 0 8px 8px">
            <div v-if="filteredLogs.length === 0" class="pa-3 text-center" style="color:#94A3B8">Aucun événement pour ce filtre.</div>
            <div v-for="log in filteredLogs" :key="log.id" class="mb-1">
              <span style="color:#64748B">{{ log.time }}</span>
              <span :style="{ color: log.level === 'ERROR' ? '#F87171' : log.level === 'WARN' ? '#FBBF24' : '#4ADE80' }" class="ms-2">[{{ log.level }}]</span>
              <span style="color:#CBD5E1" class="ms-2">{{ log.message }}</span>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <!-- TODO(endpoint): pas de suivi des sauvegardes planifiées dans l'API v1. -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Sauvegardes planifiées</v-card-title>
          <div class="text-center pa-6 text-medium-emphasis">
            <v-icon icon="mdi-database-off" size="40" class="mb-2 opacity-40"/>
            <div class="text-body-2">Suivi des sauvegardes non instrumenté.</div>
            <div class="text-caption">L'historique des sauvegardes sera affiché dès que l'endpoint correspondant existera.</div>
          </div>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Connexions (24 dernières heures)</v-card-title>
          <v-card-text>
            <div class="text-h4 font-weight-bold text-primary mb-0">{{ totalConnexions24h }}</div>
            <div class="text-caption text-medium-emphasis mb-3">connexion(s) réussie(s) journalisée(s)</div>
            <div v-if="activeByStructure.length === 0" class="text-caption text-medium-emphasis">Aucune connexion sur la période.</div>
            <div v-for="s in activeByStructure" :key="s.label" class="mb-3">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>{{ s.label }}</span>
                <span class="font-weight-bold">{{ s.count }}</span>
              </div>
              <v-progress-linear :model-value="totalConnexions24h ? (s.count / totalConnexions24h) * 100 : 0" color="primary" rounded height="6" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { getHealth, getJobsHeartbeat, getMonitoring, type MonitoringPlateforme } from '../../services/admin'
import { listerUtilisateurs } from '../../services/utilisateurs'
import { listerAuditLogs, type AuditLogEntry } from '../../services/audit'

interface LogLine { id: string; time: string; level: 'INFO' | 'WARN' | 'ERROR'; message: string }

const logLevel = ref('all')
const loading = ref(true)
const loadError = ref<string | null>(null)

const apiOk = ref(false)
const jobsHealthy = ref(false)
const lastHeartbeat = ref<string | null>(null)
const monitoring = ref<MonitoringPlateforme | null>(null)
const totalUtilisateurs = ref(0)
const totalAuditEvents = ref(0)
const appLogs = ref<LogLine[]>([])
const activeByStructure = ref<{ label: string; count: number }[]>([])
const totalConnexions24h = ref(0)

const systemOk = computed(() => apiOk.value && jobsHealthy.value && (monitoring.value?.erreurs500_24h ?? 0) === 0)

/** Uptime formaté (ex: « 2 j 4 h », « 35 min ») depuis uptimeSecondes réel. */
const uptimeLabel = computed(() => {
  const s = monitoring.value?.uptimeSecondes
  if (s == null) return '—'
  const j = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (j > 0) return `${j} j ${h} h`
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
})

const healthKpis = computed(() => [
  { label: 'API', value: apiOk.value ? 'Opérationnelle' : 'Incident', icon: 'mdi-server', color: apiOk.value ? 'success' : 'error', subtitle: monitoring.value ? `v${monitoring.value.version} · uptime ${uptimeLabel.value}` : 'GET /health' },
  { label: 'Jobs planifiés', value: jobsHealthy.value ? 'Actifs' : 'Incident', icon: 'mdi-robot', color: jobsHealthy.value ? 'success' : 'error', subtitle: monitoring.value ? `${monitoring.value.jobs.actifs} en file · ${monitoring.value.jobs.echoues24h} échoué(s) 24h` : (lastHeartbeat.value ? `Heartbeat ${new Date(lastHeartbeat.value).toLocaleTimeString('fr-FR')}` : 'GET /jobs/heartbeat') },
  { label: 'Utilisateurs actifs (24h)', value: monitoring.value?.utilisateursActifs24h ?? 0, icon: 'mdi-account-multiple', color: 'info', subtitle: `GET /admin/monitoring — ${totalUtilisateurs.value} comptes au total` },
  { label: 'Erreurs 500 (24h)', value: monitoring.value?.erreurs500_24h ?? 0, icon: 'mdi-alert-octagon', color: (monitoring.value?.erreurs500_24h ?? 0) > 0 ? 'error' : 'success', subtitle: `${totalAuditEvents.value} événements d'audit (total)` },
])

/** Niveau d'affichage dérivé de l'action métier journalisée. */
function levelOf(e: AuditLogEntry): LogLine['level'] {
  if (/ECHEC|ERROR|REJET/i.test(e.action)) return 'ERROR'
  if (/RESET|MODIFIE|INVALIDE|SUSPEND/i.test(e.action)) return 'WARN'
  return 'INFO'
}

const filteredLogs = computed(() => {
  if (logLevel.value === 'all') return appLogs.value
  if (logLevel.value === 'warn') return appLogs.value.filter(l => l.level === 'WARN' || l.level === 'ERROR')
  return appLogs.value.filter(l => l.level === 'ERROR')
})

async function charger() {
  loading.value = true
  loadError.value = null
  try {
    const [health, heartbeat, users, logs, monit] = await Promise.all([
      getHealth().catch(() => null),
      getJobsHeartbeat().catch(() => null),
      listerUtilisateurs().catch(() => null),
      listerAuditLogs({ limit: 200 }).catch(() => null),
      getMonitoring().catch(() => null),
    ])
    apiOk.value = health?.status === 'ok'
    jobsHealthy.value = heartbeat?.healthy === true
    lastHeartbeat.value = heartbeat?.lastHeartbeat ?? null
    monitoring.value = monit
    totalUtilisateurs.value = users?.data?.length ?? 0
    totalAuditEvents.value = logs?.total ?? 0
    if (!monit) loadError.value = 'GET /admin/monitoring indisponible — KPIs plateforme partiels'

    const items = logs?.items ?? []
    appLogs.value = items.map(e => ({
      id: e.id,
      time: new Date(e.horodatage).toLocaleString('fr-FR', { hour12: false }),
      level: levelOf(e),
      message: `${e.action} — ${e.entite}${e.institution ? ` — ${e.institution}` : ''}`,
    }))

    // Connexions des dernières 24h, groupées par institution (calcul sur données réelles).
    const since = Date.now() - 24 * 3600 * 1000
    const parInstitution = new Map<string, number>()
    let nb = 0
    for (const e of items) {
      if (e.action !== 'LOGIN_SUCCES') continue
      if (new Date(e.horodatage).getTime() < since) continue
      nb++
      const key = e.institution || 'Non renseignée'
      parInstitution.set(key, (parInstitution.get(key) ?? 0) + 1)
    }
    totalConnexions24h.value = nb
    activeByStructure.value = [...parInstitution.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Erreur de chargement du monitoring'
  } finally {
    loading.value = false
  }
}

onMounted(charger)
</script>
