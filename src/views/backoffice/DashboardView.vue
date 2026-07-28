<template>
  <div>
    <PageHeader title="Tableau de bord — Back-office" subtitle="Vue opérationnelle de votre charge de travail" icon="mdi-view-dashboard">
      <template #actions>
        <v-chip color="primary" variant="tonal" size="small">{{ auth.user ? `${auth.user.prenom} ${auth.user.nom}` : '' }}</v-chip>
      </template>
    </PageHeader>
    <v-row class="mb-5">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k" /></v-col>
    </v-row>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>
    <AlertBanner
      v-if="dossiersEnRetard.length > 0"
      type="error"
      :title="`${dossiersEnRetard.length} dossier(s) en retard réglementaire`"
      :text="`Les dossiers ${dossiersEnRetard.slice(0, 3).map(d => d.reference).join(', ')} ont dépassé leur date d'échéance. Action urgente requise.`"
    />
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            File de traitement
            <v-btn size="x-small" variant="tonal" to="/backoffice/dossiers">Voir tout</v-btn>
          </v-card-title>
          <v-list lines="two" class="pa-0">
            <v-list-item v-for="(d, i) in queue" :key="d.id" :to="`/backoffice/dossiers/${d.id}/instruction`" :divider="i<queue.length-1" class="px-4 py-3">
              <template #prepend>
                <v-avatar :color="d.priorite==='haute'?'error':'info'" size="36" rounded="lg">
                  <v-icon icon="mdi-folder" color="white" size="18" />
                </v-avatar>
              </template>
              <template #title>
                <div class="d-flex align-center ga-2">
                  <span class="font-weight-semibold text-body-2">{{ d.reference }}</span>
                  <v-chip :color="d.priorite==='haute'?'error':'info'" size="x-small" variant="tonal">{{ d.priorite }}</v-chip>
                </div>
              </template>
              <template #subtitle><span class="text-caption">{{ d.contribuable }} · {{ d.type }} · Reçu {{ d.date }}</span></template>
              <template #append>
                <div class="text-end">
                  <div class="text-caption text-medium-emphasis">Échéance</div>
                  <div class="font-weight-bold text-body-2" :class="d.retard?'text-error':''">{{ d.delai }}</div>
                </div>
              </template>
            </v-list-item>
          </v-list>
          <div v-if="!loading && queue.length === 0 && !error" class="text-center pa-6 text-medium-emphasis text-body-2">
            Aucun dossier dans la file de traitement.
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Alertes système</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="a in alertes" :key="a.id" :prepend-icon="a.icon" :subtitle="a.date" rounded="lg" class="mb-1">
              <template #title><span class="text-body-2" :class="`text-${a.color}`">{{ a.texte }}</span></template>
            </v-list-item>
          </v-list>
          <div v-if="!loading && alertes.length === 0" class="text-center pa-4 text-medium-emphasis text-caption">
            Aucune alerte active.
          </div>
        </v-card>
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Productivité ce mois</v-card-title>
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-body-2">Dossiers traités</span>
              <span class="font-weight-bold">{{ traitesCeMois }}</span>
            </div>
            <v-progress-linear :model-value="tauxTraites" color="success" rounded height="8" class="mb-3" />
            <!-- TODO(endpoint): le délai moyen de traitement n'est pas calculable depuis l'API actuelle — masqué (vague B backend) -->
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
import AlertBanner from '../../components/AlertBanner.vue'
import { listerDemandes } from '../../services/demandes'
import { listerAnomalies } from '../../services/audit'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { STATUT_LABELS, type StatutDemande } from '../../types'

const auth = useAuthStore()
const demandes = ref<any[]>([])
const anomaliesNouvelles = ref<{ id: string; description: string; dateDetection: string | null }[]>([])
const quotas = ref<{ id: string; total: string; consomme: string; alerteSeuilPct: number; baseJuridiqueVersions?: { libelle?: string } | null }[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const STATUTS_FINAUX = ['approuve', 'rejete', 'expire', 'archive']

onMounted(async () => {
  loading.value = true
  try {
    const [resDemandes, resAnomalies, resQuotas] = await Promise.allSettled([
      listerDemandes(),
      listerAnomalies({ statutCode: 'nouvelle' }),
      api<typeof quotas.value>('/quotas'),
    ])
    if (resDemandes.status === 'fulfilled') {
      demandes.value = resDemandes.value.data.map((d) => {
        const echeance = d.dateEcheance ? new Date(d.dateEcheance as unknown as string) : null
        const retard = !!echeance && echeance.getTime() < Date.now() && !STATUTS_FINAUX.includes(d.statutCode)
        return {
          ...d,
          reference: d.reference || d.id,
          type: d.impotConcerne || d.type || '—',
          contribuable: (d as any).contribuable?.raisonSociale ?? '—',
          date: d.dateDepot ? new Date(d.dateDepot).toLocaleDateString('fr-FR') : '—',
          delai: echeance ? echeance.toLocaleDateString('fr-FR') : '—',
          priorite: retard ? 'haute' : 'normale',
          retard,
        }
      })
    } else {
      error.value = 'Impossible de charger la file de traitement'
    }
    if (resAnomalies.status === 'fulfilled') {
      anomaliesNouvelles.value = resAnomalies.value.map((a) => ({
        id: a.id,
        description: a.description || 'Anomalie détectée',
        dateDetection: a.dateDetection || null,
      }))
    }
    if (resQuotas.status === 'fulfilled') {
      quotas.value = Array.isArray(resQuotas.value) ? resQuotas.value : []
    }
  } finally {
    loading.value = false
  }
})

// Comptage par statut CANONIQUE (taxonomie centralisée src/types — STATUT_LABELS).
const countBy = (...codes: StatutDemande[]) => demandes.value.filter((d) => codes.includes(d.statutCode)).length

const dossiersEnRetard = computed(() => demandes.value.filter((d) => d.retard))

const kpis = computed(() => [
  { label: `En attente (${STATUT_LABELS.soumis} / ${STATUT_LABELS.en_instruction})`, value: countBy('soumis', 'en_instruction'), icon: 'mdi-inbox', color: 'info', to: '/backoffice/dossiers' },
  { label: 'En retard réglementaire', value: dossiersEnRetard.value.length, icon: 'mdi-alert', color: 'error', to: '/backoffice/dossiers' },
  { label: `${STATUT_LABELS.approuve}s ce mois`, value: countBy('approuve'), icon: 'mdi-check-circle', color: 'success', to: '/backoffice/dossiers' },
  { label: 'Alertes moteur règles', value: anomaliesNouvelles.value.length, icon: 'mdi-cog-play', color: 'warning', to: '/backoffice/controle' },
])
const queue = computed(() => demandes.value.slice(0, 6))

/** Alertes réelles : anomalies nouvelles (GET /anomalies) + quotas ≥ seuil d'alerte (GET /quotas). */
const alertes = computed(() => {
  const items: { id: string; icon: string; texte: string; date: string; color: string }[] = []
  for (const a of anomaliesNouvelles.value.slice(0, 4)) {
    items.push({
      id: `ano-${a.id}`,
      icon: 'mdi-alert-circle',
      texte: a.description,
      date: a.dateDetection ? new Date(a.dateDetection).toLocaleDateString('fr-FR') : '',
      color: 'error',
    })
  }
  for (const q of quotas.value) {
    const total = Number(q.total)
    const consomme = Number(q.consomme)
    if (!total) continue
    const pct = Math.round((consomme / total) * 100)
    if (pct >= (q.alerteSeuilPct ?? 80)) {
      items.push({
        id: `quota-${q.id}`,
        icon: pct >= 100 ? 'mdi-octagon' : 'mdi-gauge',
        texte: `Quota ${q.baseJuridiqueVersions?.libelle ?? 'mesure'} — ${pct}% consommé`,
        date: '',
        color: pct >= 100 ? 'error' : 'warning',
      })
    }
  }
  return items
})

/** Dossiers traités (approuvés / rejetés) dont la dernière mise à jour date du mois courant. */
const traitesCeMois = computed(() => {
  const now = new Date()
  return demandes.value.filter((d) => {
    if (!['approuve', 'rejete'].includes(d.statutCode) || !d.updatedAt) return false
    const u = new Date(d.updatedAt)
    return u.getFullYear() === now.getFullYear() && u.getMonth() === now.getMonth()
  }).length
})
const tauxTraites = computed(() => (demandes.value.length ? (traitesCeMois.value / demandes.value.length) * 100 : 0))
</script>
