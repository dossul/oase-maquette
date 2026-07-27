<template>
  <div>
    <PageHeader title="Tableau de bord stratégique" subtitle="Pilotage de la politique fiscale en temps réel — UPF / MEF" icon="mdi-chart-areaspline">
      <template #actions>
        <v-select v-model="periode" :items="['Mois courant','Trimestre','Année 2026','Personnalisée']" hide-details density="compact" style="width:180px" class="me-2"/>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-check-decagram" class="me-2" @click="allerALaFile">File d'approbation</v-btn>
        <ExportButton label="Exporter la vue" :formats="[{value:'pdf',label:'PDF',icon:'mdi-file-pdf-box'},{value:'ppt',label:'PowerPoint',icon:'mdi-presentation'}]" @export="() => {}"/>
      </template>
    </PageHeader>

    <v-row class="mb-5">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k" /></v-col>
    </v-row>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>

    <!-- File d'approbation finale -->
    <v-card ref="fileCard" rounded="lg" elevation="1" class="mb-5">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center">
        File d'approbation — Décisions en attente
        <v-chip color="primary" size="x-small" variant="tonal" class="ms-2">{{ file.length }} dossier(s)</v-chip>
      </v-card-title>
      <v-card-text class="pa-0">
        <v-table density="comfortable">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Contribuable</th>
              <th class="text-end">Montant</th>
              <th>Date de dépôt</th>
              <th class="text-end">Décision</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in file" :key="d.id">
              <td class="font-weight-medium">{{ d.reference }}</td>
              <td>{{ d.contribuable?.raisonSociale || '—' }}</td>
              <td class="text-end">{{ formatFcfa(d.montantFcfa) }}</td>
              <td>{{ formatDate(d.dateDepot) }}</td>
              <td class="text-end">
                <v-btn size="small" color="success" variant="tonal" prepend-icon="mdi-check-decagram" class="me-2" @click="ouvrirDecision(d, 'approbation')">Approuver</v-btn>
                <v-btn size="small" color="error" variant="tonal" prepend-icon="mdi-close-circle-outline" @click="ouvrirDecision(d, 'rejet')">Rejeter</v-btn>
              </td>
            </tr>
            <tr v-if="!file.length">
              <td colspan="5" class="text-center text-medium-emphasis py-6">Aucune demande en attente de décision</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Alertes quotas (seuils 80 % / 100 %) -->
    <v-card rounded="lg" elevation="1" class="mb-5">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Alertes quotas — consommation par mesure</v-card-title>
      <v-card-text>
        <div v-if="!quotas.length" class="text-caption text-medium-emphasis">Aucun quota configuré.</div>
        <div v-for="q in quotasAvecTaux" :key="q.id" class="mb-3">
          <div class="d-flex justify-space-between text-caption mb-1">
            <span class="text-truncate" style="max-width:60%">{{ q.libelle }}</span>
            <span class="font-weight-bold">
              {{ formatFcfa(q.consomme) }} / {{ formatFcfa(q.total) }} — {{ Math.round(q.taux * 100) }}%
            </span>
          </div>
          <v-progress-linear
            :model-value="Math.min(q.taux * 100, 100)"
            :color="q.taux >= 1 ? 'error' : q.taux * 100 >= q.alerteSeuilPct ? 'warning' : 'success'"
            rounded height="10"
          />
          <div v-if="q.taux >= 1" class="text-caption text-error font-weight-semibold mt-1">Quota épuisé (100 %) — approbations bloquées pour cette mesure</div>
          <div v-else-if="q.taux * 100 >= q.alerteSeuilPct" class="text-caption text-warning font-weight-semibold mt-1">Quota consommé à plus de {{ q.alerteSeuilPct }} % — vigilance requise</div>
        </div>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Évolution mensuelle — Demandes déposées (2026)</v-card-title>
          <v-card-text>
            <div v-if="!evolutionData.length" class="text-caption text-medium-emphasis">Aucune donnée disponible.</div>
            <div v-for="row in evolutionData" :key="row.mois" class="mb-2 d-flex align-center ga-3">
              <div style="width:40px;font-size:0.72rem;font-weight:600;color:#6B7280">{{ row.mois }}</div>
              <div class="flex-grow-1">
                <v-progress-linear :model-value="(row.count / maxEvolution) * 100" color="primary" rounded height="10" bg-color="surface-light"/>
              </div>
              <div style="width:60px;font-size:0.75rem;font-weight:700;text-align:right">{{ row.count }}</div>
            </div>
          </v-card-text>
        </v-card>
        <v-row>
          <v-col cols="12" sm="6">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Top secteurs (FCFA)</v-card-title>
              <v-card-text class="pa-3">
                <div v-if="!topSecteurs.length" class="text-caption text-medium-emphasis">Aucune donnée disponible.</div>
                <div v-for="s in topSecteurs" :key="s.secteur" class="mb-2">
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span class="text-truncate" style="max-width:140px">{{ s.secteur }}</span>
                    <span class="font-weight-bold">{{ formatFcfa(s.montant) }}</span>
                  </div>
                  <v-progress-linear :model-value="(s.montant / maxSecteur) * 100" color="primary" rounded height="6"/>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Répartition par type d'impôt</v-card-title>
              <v-card-text>
                <div v-if="!repartitionType.length" class="text-caption text-medium-emphasis">Aucune donnée disponible.</div>
                <div v-for="t in repartitionType" :key="t.label" class="mb-3">
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span>{{ t.label }}</span>
                    <span class="font-weight-bold">{{ t.pct }}%</span>
                  </div>
                  <v-progress-linear :model-value="t.pct" :color="t.color" rounded height="8"/>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Répartition par statut</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="s in repartitionStatut" :key="s.statutCode" :title="s.statutCode" rounded="lg">
              <template #append><span class="font-weight-bold text-primary text-caption">{{ s.count }} dossier(s)</span></template>
            </v-list-item>
            <v-list-item v-if="!repartitionStatut.length" title="Aucune donnée disponible" />
          </v-list>
        </v-card>
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Top 5 contribuables</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="(b, i) in topBenef" :key="b.nom" rounded="lg">
              <template #prepend><v-avatar :color="['primary','secondary','info','success','warning'][i]" size="28" rounded="sm"><span style="font-size:0.7rem;color:white;font-weight:700">{{ i + 1 }}</span></v-avatar></template>
              <template #title><span class="text-body-2 font-weight-medium">{{ b.nom }}</span></template>
              <template #append><span class="font-weight-bold text-body-2">{{ formatFcfa(b.montant) }}</span></template>
            </v-list-item>
            <v-list-item v-if="!topBenef.length" title="Aucune donnée disponible" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de décision finale (approbation / rejet signés par PIN) -->
    <v-dialog v-model="dialog" max-width="640" persistent>
      <v-card rounded="lg">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
          {{ mode === 'approbation' ? 'Approbation finale' : 'Rejet' }} — {{ selection?.reference }}
        </v-card-title>
        <v-card-text class="pa-4">
          <div v-if="selection" class="mb-4">
            <div class="text-subtitle-2 font-weight-semibold mb-2">Résumé du dossier</div>
            <v-table density="compact">
              <tbody>
                <tr><td class="text-medium-emphasis" style="width:180px">Contribuable</td><td>{{ selection.contribuable?.raisonSociale || '—' }} <span v-if="selection.contribuable?.nif" class="text-caption">({{ selection.contribuable.nif }})</span></td></tr>
                <tr><td class="text-medium-emphasis">Montant demandé</td><td class="font-weight-bold">{{ formatFcfa(selection.montantFcfa) }}</td></tr>
                <tr><td class="text-medium-emphasis">Secteur</td><td>{{ selection.secteur || '—' }}</td></tr>
                <tr><td class="text-medium-emphasis">Date de dépôt</td><td>{{ formatDate(selection.dateDepot) }}</td></tr>
                <tr><td class="text-medium-emphasis">Instructeur</td><td>{{ selection.instructeur ? selection.instructeur.prenom + ' ' + selection.instructeur.nom : '—' }}</td></tr>
              </tbody>
            </v-table>
          </div>

          <div class="text-subtitle-2 font-weight-semibold mb-2">Quota de la mesure</div>
          <div v-if="quotaMesure" class="mb-4">
            <div class="d-flex justify-space-between text-caption mb-1">
              <span>{{ quotaMesure.libelle }}</span>
              <span class="font-weight-bold">{{ formatFcfa(quotaMesure.consomme) }} / {{ formatFcfa(quotaMesure.total) }}</span>
            </div>
            <v-progress-linear :model-value="Math.min(quotaMesure.taux * 100, 100)" :color="quotaMesure.taux >= 1 ? 'error' : quotaMesure.taux * 100 >= quotaMesure.alerteSeuilPct ? 'warning' : 'success'" rounded height="8"/>
          </div>
          <div v-else class="text-caption text-medium-emphasis mb-4">Aucun quota rattaché à cette mesure.</div>

          <div class="text-subtitle-2 font-weight-semibold mb-2">Contrôles du dossier</div>
          <div class="mb-4">
            <div v-for="b in blocages" :key="b.code" class="d-flex align-center ga-2 text-caption mb-1">
              <v-icon :icon="b.bloque ? 'mdi-alert-circle' : 'mdi-check-circle'" :color="b.bloque ? (b.gravite === 'critique' ? 'error' : 'warning') : 'success'" size="16"/>
              <span>{{ b.libelle }}<span v-if="b.details" class="text-medium-emphasis"> — {{ b.details }}</span></span>
            </div>
            <div v-if="!blocages.length" class="text-caption text-medium-emphasis">Contrôles non chargés.</div>
          </div>

          <v-alert v-if="decisionError" :type="decisionErrorType" variant="tonal" density="compact" class="mb-4">{{ decisionError }}</v-alert>

          <v-text-field
            v-model="pin"
            label="Code PIN (6 chiffres)"
            type="password"
            inputmode="numeric"
            maxlength="6"
            counter
            :rules="[v => /^\d{6}$/.test(v) || 'Le PIN doit contenir exactement 6 chiffres']"
            prepend-inner-icon="mdi-shield-key"
            hide-details="auto"
            class="mb-3"
          />
          <v-textarea
            v-model="commentaire"
            :label="mode === 'rejet' ? 'Motif du rejet (obligatoire)' : 'Commentaire (optionnel)'"
            rows="2"
            auto-grow
            hide-details="auto"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-btn variant="text" :disabled="envoi" @click="fermerDecision">Annuler</v-btn>
          <v-spacer/>
          <v-btn
            v-if="mode === 'rejet'"
            color="error"
            :loading="envoi"
            :disabled="!/^\d{6}$/.test(pin) || !commentaire.trim()"
            prepend-icon="mdi-close-circle-outline"
            @click="confirmerRejet"
          >Rejeter</v-btn>
          <v-btn
            v-else
            color="success"
            :loading="envoi"
            :disabled="!/^\d{6}$/.test(pin)"
            prepend-icon="mdi-check-decagram"
            @click="confirmerApprobation"
          >Approuver et signer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="5000">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import ExportButton from '../../components/ExportButton.vue'
import { ApiError } from '../../services/api'
import {
  getDashboardP4,
  getDashboardP5,
  listerQuotas,
  listerFileApprobation,
  listerDemandesDecideur,
  listerAnomaliesNouvelles,
  getBlocages,
  approuverDemande,
  rejeterDemande,
  tauxConsommation,
  formatFcfa,
  type DashboardP4,
  type DashboardP5,
  type Quota,
  type DemandeFile,
  type Blocage,
} from '../../services/decideur'

const periode = ref('Année 2026')
const fileCard = ref<{ $el: HTMLElement } | null>(null)

function allerALaFile() {
  fileCard.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
const p4 = ref<DashboardP4 | null>(null)
const p5 = ref<DashboardP5 | null>(null)
const quotas = ref<Quota[]>([])
const file = ref<DemandeFile[]>([])
const demandes = ref<DemandeFile[]>([])
const nbAlertes = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

// ── Dialog de décision ─────────────────────────────────────────────────────
const dialog = ref(false)
const mode = ref<'approbation' | 'rejet'>('approbation')
const selection = ref<DemandeFile | null>(null)
const blocages = ref<Blocage[]>([])
const pin = ref('')
const commentaire = ref('')
const envoi = ref(false)
const decisionError = ref<string | null>(null)
const decisionErrorType = ref<'error' | 'warning'>('error')

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

onMounted(chargerTout)

async function chargerTout() {
  loading.value = true
  error.value = null
  try {
    const [res4, res5, resQuotas, resFile, resDemandes, resAnomalies] = await Promise.all([
      getDashboardP4(),
      getDashboardP5(),
      listerQuotas(),
      listerFileApprobation(),
      listerDemandesDecideur(),
      listerAnomaliesNouvelles().catch(() => []),
    ])
    p4.value = res4
    p5.value = res5
    quotas.value = resQuotas
    file.value = resFile.data
    demandes.value = resDemandes.data
    const alertesQuota = resQuotas.filter((q) => tauxConsommation(q) * 100 >= q.alerteSeuilPct).length
    nbAlertes.value = resAnomalies.length + alertesQuota
  } catch {
    error.value = 'Impossible de charger les indicateurs'
  } finally {
    loading.value = false
  }
}

// ── KPIs ───────────────────────────────────────────────────────────────────
const kpis = computed(() => {
  const approuvees = p4.value?.repartitionParStatut.find((s) => s.statutCode === 'approuve')?._count.id ?? 0
  return [
    { label: 'Total exonéré', value: p5.value ? formatFcfa(p5.value.montantTotalAccorde) : '—', icon: 'mdi-currency-usd', color: 'primary', subtitle: 'Montants accordés', to: '/decideur/analyse' },
    { label: 'Exonérations actives', value: p4.value ? approuvees : '—', icon: 'mdi-check-circle', color: 'success', to: '/decideur/analyse' },
    { label: 'Contribuables', value: p5.value ? p5.value.nombreContribuables : '—', icon: 'mdi-chart-line', color: 'info', to: '/decideur/rapport-annuel' },
    { label: 'Alertes non traitées', value: nbAlertes.value, icon: 'mdi-alert', color: 'warning', subtitle: 'Anomalies + quotas en alerte', to: '/decideur/simulation' },
  ]
})

// ── Alertes quotas ─────────────────────────────────────────────────────────
const quotasAvecTaux = computed(() =>
  quotas.value
    .map((q) => ({
      ...q,
      taux: tauxConsommation(q),
      libelle: q.baseJuridiqueVersions?.libelle || `Quota ${q.typeQuotaCode}`,
    }))
    .sort((a, b) => b.taux - a.taux),
)

// ── Graphiques (données réelles) ───────────────────────────────────────────
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
const evolutionData = computed(() => {
  const parMois = new Map<number, number>()
  for (const e of p4.value?.evolutionJournaliere ?? []) {
    if (!e.dateDepot) continue
    const m = new Date(e.dateDepot).getMonth()
    parMois.set(m, (parMois.get(m) ?? 0) + e._count.id)
  }
  return [...parMois.entries()].sort((a, b) => a[0] - b[0]).map(([m, count]) => ({ mois: MOIS[m], count }))
})
const maxEvolution = computed(() => Math.max(1, ...evolutionData.value.map((e) => e.count)))

const topSecteurs = computed(() => {
  const agg = new Map<string, number>()
  for (const d of demandes.value) {
    const secteur = d.secteur || 'Non renseigné'
    agg.set(secteur, (agg.get(secteur) ?? 0) + Number(d.montantFcfa))
  }
  return [...agg.entries()]
    .map(([secteur, montant]) => ({ secteur, montant }))
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 7)
})
const maxSecteur = computed(() => Math.max(1, ...topSecteurs.value.map((s) => s.montant)))

const repartitionType = computed(() => {
  if (!p5.value) return []
  const total = Number(p5.value.montantTotalAccorde) || 1
  const couleurs = ['primary', 'info', 'success', 'secondary', 'warning']
  return p5.value.montantParImpot.map((i, idx) => ({
    label: i.impot || 'Autres',
    pct: Math.round((Number(i.montant) / total) * 100),
    color: couleurs[idx % couleurs.length],
  }))
})

const repartitionStatut = computed(() =>
  (p4.value?.repartitionParStatut ?? []).map((s) => ({ statutCode: s.statutCode, count: s._count.id })),
)

const topBenef = computed(() => {
  const agg = new Map<string, number>()
  for (const d of demandes.value) {
    const nom = d.contribuable?.raisonSociale
    if (!nom) continue
    agg.set(nom, (agg.get(nom) ?? 0) + Number(d.montantFcfa))
  }
  return [...agg.entries()]
    .map(([nom, montant]) => ({ nom, montant }))
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 5)
})

// ── Décision finale ────────────────────────────────────────────────────────
const quotaMesure = computed(() => {
  if (!selection.value) return null
  const q = quotasAvecTaux.value.find((x) => x.baseJuridiqueVersionId === selection.value!.baseJuridiqueVersionId)
  return q ?? null
})

async function ouvrirDecision(d: DemandeFile, m: 'approbation' | 'rejet') {
  selection.value = d
  mode.value = m
  pin.value = ''
  commentaire.value = ''
  decisionError.value = null
  blocages.value = []
  dialog.value = true
  try {
    blocages.value = await getBlocages(d.id)
  } catch {
    blocages.value = []
  }
}

function fermerDecision() {
  dialog.value = false
  selection.value = null
}

function messageErreurDecision(e: unknown): { texte: string; type: 'error' | 'warning' } {
  if (e instanceof ApiError) {
    if (e.code === 'PIN_INVALIDE' || (e.status === 401 && e.code !== 'SESSION'))
      return { texte: 'PIN invalide. Veuillez vérifier votre code PIN à 6 chiffres.', type: 'error' }
    if (e.code === 'QUOTA_EPUISE')
      return { texte: 'Quota épuisé pour cette mesure : l\'approbation est bloquée.', type: 'warning' }
    if (e.code === 'MOTIF_REQUIS')
      return { texte: 'Le motif est obligatoire pour rejeter une demande.', type: 'error' }
    if (e.code === 'PIN_REQUIS')
      return { texte: 'Le code PIN est requis pour signer la décision.', type: 'error' }
    if (e.code === 'DEMANDE_BLOQUEE')
      return { texte: 'Dossier bloqué par les contrôles automatiques. Vérifiez les contrôles ci-dessus.', type: 'warning' }
    return { texte: e.message, type: 'error' }
  }
  return { texte: 'Erreur inattendue lors de la décision.', type: 'error' }
}

async function confirmerApprobation() {
  if (!selection.value) return
  envoi.value = true
  decisionError.value = null
  try {
    await approuverDemande(selection.value.id, pin.value, commentaire.value.trim() || undefined)
    snackbarText.value = `Demande ${selection.value.reference} approuvée — acte et attestation PDF générés, contribuable notifié.`
    snackbarColor.value = 'success'
    snackbar.value = true
    fermerDecision()
    await chargerTout()
  } catch (e) {
    const m = messageErreurDecision(e)
    decisionError.value = m.texte
    decisionErrorType.value = m.type
  } finally {
    envoi.value = false
  }
}

async function confirmerRejet() {
  if (!selection.value) return
  envoi.value = true
  decisionError.value = null
  try {
    await rejeterDemande(selection.value.id, pin.value, commentaire.value.trim())
    snackbarText.value = `Demande ${selection.value.reference} rejetée.`
    snackbarColor.value = 'success'
    snackbar.value = true
    fermerDecision()
    await chargerTout()
  } catch (e) {
    const m = messageErreurDecision(e)
    decisionError.value = m.texte
    decisionErrorType.value = m.type
  } finally {
    envoi.value = false
  }
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR')
}
</script>
