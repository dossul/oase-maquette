<template>
  <div>
    <PageHeader title="Mes exonérations actives" subtitle="Gérez vos exonérations en vigueur et anticipez les renouvellements" icon="mdi-check-decagram">
      <template #actions>
        <ExportButton label="Exporter" size="small" @export="() => {}" />
      </template>
    </PageHeader>
    <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-5" prepend-icon="mdi-alarm">
      <strong>1 exonération</strong> expire dans moins de 30 jours. Pensez à demander un renouvellement.
    </v-alert>
    <v-card rounded="lg" elevation="1" class="mb-6">
      <div class="pa-4 pb-2 d-flex align-center ga-3">
        <span class="text-body-1 font-weight-semibold">Liste des exonérations</span>
        <v-spacer />
        <v-select
          v-model="regimeFilter"
          :items="regimeOptions"
          label="Classer par régime"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="max-width:260px"
          prepend-inner-icon="mdi-filter-variant"
        />
      </div>
      <v-data-table :headers="headers" :items="filteredActives" hover>
        <template #item.regime="{ item }">
          <v-chip size="x-small" variant="tonal" :color="regimeColor(item.type)">{{ EXO_TYPE_LABELS[item.type] }}</v-chip>
        </template>
        <template #item.periode="{ item }">
          <span class="text-caption">{{ getPeriode(item) }}</span>
        </template>
        <template #item.dateEcheance="{ item }">
          <span :class="isExpiringSoon(item.dateEcheance) ? 'text-warning font-weight-bold' : ''">
            {{ item.dateEcheance ? formatDate(item.dateEcheance) : '—' }}
            <v-chip v-if="isExpiringSoon(item.dateEcheance)" color="warning" size="x-small" variant="tonal" class="ms-1">⚠ 30j</v-chip>
          </span>
        </template>
        <template #item.quota="{ item }">
          <div v-if="item.quotaTotal" style="min-width:120px">
            <div class="d-flex justify-space-between text-caption mb-1">
              <span>{{ formatMontant(item.quotaConsomme||0) }}</span>
              <span class="text-medium-emphasis">/ {{ formatMontant(item.quotaTotal) }}</span>
            </div>
            <v-progress-linear :model-value="((item.quotaConsomme||0)/item.quotaTotal)*100" color="primary" rounded height="6" />
          </div>
          <span v-else class="text-medium-emphasis text-caption">Sans plafond</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn color="primary" size="x-small" variant="tonal" :to="`/portail/demandes/${item.id}`" class="me-1">Voir</v-btn>
          <v-btn v-if="isExpiringSoon(item.dateEcheance)" color="warning" size="x-small" variant="tonal">Renouveler</v-btn>
        </template>
      </v-data-table>
    </v-card>
    <!-- ── Panel échéances ── -->
    <v-card rounded="lg" elevation="1">
      <div class="pa-4 pb-2 d-flex align-center flex-wrap ga-2">
        <v-icon icon="mdi-calendar-clock" color="primary" size="20" />
        <span class="text-body-1 font-weight-semibold">Échéances et renouvellements</span>
        <v-spacer />
        <v-btn-toggle v-model="horizonFilter" density="compact" rounded="pill" variant="outlined" mandatory color="primary">
          <v-btn value="1an"   size="x-small">< 1 an</v-btn>
          <v-btn value="2ans"  size="x-small">< 2 ans</v-btn>
          <v-btn value="5ans"  size="x-small">< 5 ans</v-btn>
          <v-btn value="tout"  size="x-small">Perpétuel</v-btn>
        </v-btn-toggle>
        <v-chip size="x-small" color="error" variant="tonal" prepend-icon="mdi-alarm">
          {{ expiringSoonCount }} expirant dans 30 j
        </v-chip>
      </div>
      <v-divider />
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col v-for="item in sortedActives" :key="item.id" cols="12" md="6">
            <v-card
              variant="outlined"
              rounded="lg"
              class="pa-3"
              :color="echeanceColor(item.dateEcheance)"
            >
              <div class="d-flex align-start justify-space-between mb-2">
                <div>
                  <div class="text-body-2 font-weight-semibold">{{ item.reference }}</div>
                  <v-chip size="x-small" variant="tonal" :color="regimeColor(item.type)" class="mt-1">
                    {{ EXO_TYPE_LABELS[item.type] }}
                  </v-chip>
                </div>
                <div class="text-right">
                  <div class="text-caption text-medium-emphasis">Échéance</div>
                  <div class="text-body-2 font-weight-bold" :class="isExpiringSoon(item.dateEcheance) ? 'text-error' : 'text-high-emphasis'">
                    {{ item.dateEcheance ? formatDate(item.dateEcheance) : '—' }}
                  </div>
                </div>
              </div>

              <!-- Barre de durée restante -->
              <div v-if="item.dateEcheance" class="mb-2">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span class="text-medium-emphasis">Jours restants</span>
                  <span :class="isExpiringSoon(item.dateEcheance) ? 'text-error font-weight-bold' : 'text-medium-emphasis'">
                    {{ daysRemaining(item.dateEcheance) }} j
                  </span>
                </div>
                <v-progress-linear
                  :model-value="daysRemainingPct(item.dateEcheance)"
                  :color="echeanceProgressColor(item.dateEcheance)"
                  rounded
                  height="6"
                  bg-color="surface-variant"
                />
              </div>

              <div class="d-flex align-center justify-space-between mt-1">
                <span class="text-caption text-medium-emphasis">{{ item.secteur }}</span>
                <div class="d-flex ga-1">
                  <v-btn size="x-small" variant="tonal" color="primary" :to="`/portail/demandes/${item.id}`">Voir</v-btn>
                  <v-btn v-if="isExpiringSoon(item.dateEcheance)" size="x-small" variant="tonal" color="error" prepend-icon="mdi-refresh">Renouveler</v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- État vide -->
        <div v-if="sortedActives.length === 0" class="text-center text-medium-emphasis py-8">
          <v-icon icon="mdi-check-circle-outline" size="40" color="success" class="mb-2" />
          <div class="text-body-2">Aucune échéance à surveiller</div>
        </div>

        <!-- Légende -->
        <div class="d-flex flex-wrap ga-3 mt-4 pt-3 border-t">
          <div class="d-flex align-center ga-1 text-caption text-medium-emphasis">
            <div style="width:10px;height:10px;border-radius:50%;background:rgb(var(--v-theme-error))" />
            Expire dans &lt; 30 j
          </div>
          <div class="d-flex align-center ga-1 text-caption text-medium-emphasis">
            <div style="width:10px;height:10px;border-radius:50%;background:rgb(var(--v-theme-warning))" />
            Expire dans &lt; 90 j
          </div>
          <div class="d-flex align-center ga-1 text-caption text-medium-emphasis">
            <div style="width:10px;height:10px;border-radius:50%;background:rgb(var(--v-theme-success))" />
            Valide
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import ExportButton from '../../components/ExportButton.vue'
import { mockDemandes } from '../../mock/data'
import { EXO_TYPE_LABELS } from '../../types'

const actives = mockDemandes.filter(d => d.statut === 'approuve')

const regimeFilter = ref<string | null>(null)
const regimeOptions = Object.entries(EXO_TYPE_LABELS).map(([value, title]) => ({ value, title }))

const filteredActives = computed(() =>
  regimeFilter.value ? actives.filter(d => d.type === regimeFilter.value) : actives
)

const headers = [
  { title: 'Référence', key: 'reference' },
  { title: 'Régime d\'exonération', key: 'regime' },
  { title: 'Période', key: 'periode' },
  { title: 'Secteur', key: 'secteur' },
  { title: 'Échéance', key: 'dateEcheance' },
  { title: 'Consommation quota', key: 'quota' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')
const formatMontant = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' FCFA'
const isExpiringSoon = (d?: string) => { if (!d) return false; const diff = new Date(d).getTime() - Date.now(); return diff > 0 && diff < 30*24*3600*1000 }

const getPeriode = (item: typeof actives[number]) => {
  if (!item.dateEcheance) return '—'
  const annee = new Date(item.dateEcheance).getFullYear()
  return `Exercice ${annee}`
}

const REGIME_COLORS: Record<string, string> = {
  douaniere: 'blue',
  fiscale_is: 'deep-purple',
  fiscale_tva: 'indigo',
  zone_franche: 'teal',
  code_investissement: 'orange',
  sectorielle: 'green',
}
const regimeColor = (type: string) => REGIME_COLORS[type] || 'primary'

// ── Filtre horizon ─────────────────────────────────────────────────────────
const horizonFilter = ref<'1an' | '2ans' | '5ans' | 'tout'>('tout')

const HORIZON_DAYS: Record<string, number> = { '1an': 365, '2ans': 730, '5ans': 1825, 'tout': Infinity }

// ── Échéances helpers ───────────────────────────────────────────────────────
const daysRemaining = (d?: string) => {
  if (!d) return 0
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / (24 * 3600 * 1000)))
}

// % restant sur une durée max de 365j (pour la barre)
const daysRemainingPct = (d?: string) => {
  if (!d) return 0
  return Math.min(100, (daysRemaining(d) / 365) * 100)
}

const echeanceColor = (d?: string) => {
  const days = daysRemaining(d)
  if (days < 30)  return 'error'
  if (days < 90)  return 'warning'
  return undefined
}

const echeanceProgressColor = (d?: string) => {
  const days = daysRemaining(d)
  if (days < 30)  return 'error'
  if (days < 90)  return 'warning'
  return 'success'
}

const isExpiring90 = (d?: string) => { if (!d) return false; return daysRemaining(d) < 90 }

const expiringSoonCount = computed(() => actives.filter(d => isExpiringSoon(d.dateEcheance)).length)

// Trier et filtrer par horizon : expirant bientôt en premier
const sortedActives = computed(() => {
  const maxDays = HORIZON_DAYS[horizonFilter.value]

  return [...filteredActives.value]
    .filter(a => {
      // "Perpétuel" : uniquement les items SANS date d'échéance
      if (horizonFilter.value === 'tout') return !a.dateEcheance
      // Autres filtres : items AVEC une échéance dans la plage
      if (!a.dateEcheance) return false
      return daysRemaining(a.dateEcheance) <= maxDays
    })
    .sort((a, b) => {
      const da = a.dateEcheance ? new Date(a.dateEcheance).getTime() : Infinity
      const db = b.dateEcheance ? new Date(b.dateEcheance).getTime() : Infinity
      return da - db
    })
})
</script>
