<template>
  <div>
    <PageHeader title="Monitoring & Logs système" subtitle="Santé de la plateforme OASE en temps réel" icon="mdi-monitor-dashboard">
      <template #actions>
        <v-chip color="success" variant="tonal" size="small" prepend-icon="mdi-circle" class="me-2">Système opérationnel</v-chip>
        <v-btn size="small" variant="tonal" prepend-icon="mdi-refresh">Rafraîchir</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-5">
      <v-col v-for="k in healthKpis" :key="k.label" cols="6" md="3">
        <KpiCard v-bind="k" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Utilisation des ressources</v-card-title>
          <v-card-text class="pa-4">
            <div v-for="m in metrics" :key="m.label" class="mb-4">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span class="font-weight-medium">{{ m.label }}</span>
                <span class="font-weight-bold" :class="m.value > 80 ? 'text-error' : m.value > 60 ? 'text-warning' : 'text-success'">{{ m.value }}%</span>
              </div>
              <v-progress-linear :model-value="m.value" :color="m.value > 80 ? 'error' : m.value > 60 ? 'warning' : 'success'" rounded height="10" />
              <div class="text-caption text-medium-emphasis mt-1">{{ m.detail }}</div>
            </div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Journaux applicatifs
            <v-btn-toggle v-model="logLevel" density="compact" rounded="pill" variant="outlined" mandatory>
              <v-btn value="all" size="x-small">Tous</v-btn>
              <v-btn value="warn" size="x-small">WARN</v-btn>
              <v-btn value="error" size="x-small">ERROR</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <div class="pa-3" style="background:#1E293B;font-family:monospace;font-size:0.72rem;max-height:280px;overflow-y:auto;border-radius:0 0 8px 8px">
            <div v-for="log in filteredLogs" :key="log.id" class="mb-1">
              <span style="color:#64748B">{{ log.time }}</span>
              <span :style="{ color: log.level === 'ERROR' ? '#F87171' : log.level === 'WARN' ? '#FBBF24' : '#4ADE80' }" class="ms-2">[{{ log.level }}]</span>
              <span style="color:#CBD5E1" class="ms-2">{{ log.message }}</span>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Sauvegardes planifiées</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item
              v-for="b in backups"
              :key="b.date"
              :subtitle="`${b.taille} · ${b.type}`"
              prepend-icon="mdi-database-check"
              rounded="lg"
              class="mb-1"
            >
              <template #title><span class="text-body-2">{{ b.date }}</span></template>
              <template #append>
                <v-chip :color="b.statut === 'ok' ? 'success' : 'error'" size="x-small" variant="tonal">{{ b.statut === 'ok' ? 'OK' : 'Échec' }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
          <div class="pa-4 pt-0 text-caption text-medium-emphasis">
            Prochaine sauvegarde : <strong>28/04/2026 02:00</strong>
          </div>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Utilisateurs connectés</v-card-title>
          <v-card-text>
            <div class="text-h4 font-weight-bold text-primary mb-0">{{ totalActive }}</div>
            <div class="text-caption text-medium-emphasis mb-3">en ce moment</div>
            <div v-for="s in activeByStructure" :key="s.label" class="mb-3">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>{{ s.label }}</span>
                <span class="font-weight-bold">{{ s.count }}</span>
              </div>
              <v-progress-linear :model-value="(s.count / totalActive) * 100" color="primary" rounded height="6" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

const logLevel = ref('all')
const totalActive = 34

const healthKpis = [
  { label: 'Disponibilité (uptime)', value: '99.97%', icon: 'mdi-server', color: 'success', subtitle: 'Dernier 30 jours' },
  { label: 'Temps de réponse API', value: '185 ms', icon: 'mdi-clock-fast', color: 'primary', subtitle: 'Moyenne 24h' },
  { label: 'Utilisateurs connectés', value: totalActive, icon: 'mdi-account-multiple', color: 'info' },
  { label: 'Erreurs 24h', value: 12, icon: 'mdi-alert-circle', color: 'warning', subtitle: 'Dont 2 critiques' },
]

const metrics = [
  { label: 'CPU', value: 42, detail: '42% · 8 vCPU · Serveur de production' },
  { label: 'Mémoire RAM', value: 67, detail: '10,7 Go / 16 Go utilisés' },
  { label: 'Espace disque (BDD)', value: 58, detail: '116 Go / 200 Go utilisés' },
  { label: 'Bande passante réseau', value: 24, detail: '120 Mbps / 500 Mbps' },
]

const appLogs = [
  { id: 1, time: '10:45:32.441', level: 'INFO', message: 'User k.abalo@otr.tg authenticated successfully' },
  { id: 2, time: '10:44:18.882', level: 'INFO', message: 'Dossier OASE-2026-0042 status updated: en_cours → approuve' },
  { id: 3, time: '10:30:01.119', level: 'ERROR', message: 'SIGFiP connector timeout after 30000ms — retrying in 60s' },
  { id: 4, time: '10:29:58.001', level: 'WARN', message: 'SIGFiP connector response slow: 28940ms (threshold: 5000ms)' },
  { id: 5, time: '10:15:44.556', level: 'INFO', message: 'Batch job: quota sync SYDONIA completed — 1842 records processed' },
  { id: 6, time: '09:45:33.001', level: 'WARN', message: 'Failed login attempt: unknown@test.com (attempt 3/5)' },
  { id: 7, time: '09:30:14.774', level: 'INFO', message: 'Rapport annuel RDF-2025 generated by p.tchalla@upf.mef.tg' },
  { id: 8, time: '09:00:00.001', level: 'INFO', message: 'Scheduled backup started: production database snapshot' },
]

const filteredLogs = computed(() => {
  if (logLevel.value === 'all') return appLogs
  if (logLevel.value === 'warn') return appLogs.filter(l => l.level === 'WARN' || l.level === 'ERROR')
  return appLogs.filter(l => l.level === 'ERROR')
})

const backups = [
  { date: '27/04/2026 02:00', taille: '8,4 Go', type: 'Complète', statut: 'ok' },
  { date: '26/04/2026 02:00', taille: '8,2 Go', type: 'Complète', statut: 'ok' },
  { date: '25/04/2026 02:00', taille: '8,1 Go', type: 'Complète', statut: 'ok' },
  { date: '24/04/2026 02:00', taille: '—', type: 'Complète', statut: 'error' },
]

const activeByStructure = [
  { label: 'OTR Douanes', count: 12 },
  { label: 'OTR Impôts', count: 8 },
  { label: 'DGBF', count: 5 },
  { label: 'API-ZF', count: 4 },
  { label: 'UPF', count: 3 },
  { label: 'Autres', count: 2 },
]
</script>
