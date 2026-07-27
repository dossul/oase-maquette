<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" class="mb-4">{{ error }}</v-alert>

    <template v-if="demande">
      <PageHeader :title="`Demande ${demande.reference}`" :subtitle="`${typeLabel} · ${demande.secteur || '—'}`" icon="mdi-file-search">
        <template #actions>
          <StatusChip :statut="demande.statut" />
          <v-btn v-if="demande.statut==='action_requise'" color="warning" size="small" prepend-icon="mdi-reply" @click="complementDialog = true">Répondre au complément</v-btn>
          <v-btn v-if="demande.statut==='approuve'" color="success" size="small" variant="tonal" prepend-icon="mdi-download" :loading="downloading" @click="downloadAttestation">Télécharger l'attestation</v-btn>
        </template>
      </PageHeader>

      <v-alert v-if="actionMessage" :type="actionOk ? 'success' : 'error'" variant="tonal" rounded="lg" class="mb-4">{{ actionMessage }}</v-alert>

      <!-- Bandeau complément requis -->
      <v-alert v-if="demande.statut==='action_requise'" type="warning" variant="tonal" rounded="lg" class="mb-4" prepend-icon="mdi-alert-circle">
        <strong>Complément de dossier requis.</strong>
        L'instructeur a demandé des éléments complémentaires pour poursuivre l'instruction de votre demande.
        Déposez le document attendu via « Répondre au complément ».
      </v-alert>
      <v-alert v-if="demande.statut==='rejete' && demande.motifRejet" type="error" variant="tonal" rounded="lg" class="mb-4" prepend-icon="mdi-close-circle">
        <strong>Demande rejetée.</strong> Motif : {{ demande.motifRejet }}
      </v-alert>

      <v-row>
        <v-col cols="12" md="4">
          <!-- Timeline -->
          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
              <v-icon icon="mdi-timeline" size="18" class="me-2" />Suivi du traitement
            </v-card-title>
            <v-card-text class="pa-4">
              <v-timeline density="compact" side="end" line-thickness="2">
                <v-timeline-item v-for="(ev, i) in timeline" :key="i" :dot-color="ev.color" :icon="ev.icon" size="small" :fill-dot="ev.current">
                  <div>
                    <div class="font-weight-semibold text-body-2" :class="ev.future ? 'text-medium-emphasis' : ''">{{ ev.label }}</div>
                    <div v-if="ev.date" class="text-caption text-medium-emphasis">{{ ev.date }}</div>
                    <div v-if="ev.agent" class="text-caption text-medium-emphasis">Agent: {{ ev.agent }}</div>
                    <v-chip v-if="ev.current" color="info" variant="tonal" size="x-small" class="mt-1">En cours</v-chip>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <!-- Header info -->
          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-text class="pa-4">
              <v-row dense>
                <v-col cols="6" sm="3"><div class="label-micro text-medium-emphasis">Référence</div><div class="font-weight-bold text-primary text-body-2">{{ demande.reference }}</div></v-col>
                <v-col cols="6" sm="3"><div class="label-micro text-medium-emphasis">Type</div><div class="text-body-2">{{ typeLabel }}</div></v-col>
                <v-col cols="6" sm="3"><div class="label-micro text-medium-emphasis">Dépôt</div><div class="text-body-2">{{ formatDate(demande.dateDepot) }}</div></v-col>
                <v-col cols="6" sm="3"><div class="label-micro text-medium-emphasis">Montant</div><div class="font-weight-bold text-body-2">{{ formatMontant(demande.montantFCFA) }}</div></v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
              <v-icon icon="mdi-format-list-checks" size="18" class="me-2" />Attributs O2 visibles sur le dossier
            </v-card-title>
            <v-card-text class="pa-4 pt-0">
              <v-row dense>
                <v-col v-for="item in o2Summary" :key="item.label" cols="12" md="6">
                  <v-card variant="outlined" rounded="lg" class="h-100">
                    <v-card-text class="pa-3">
                      <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                      <div class="text-body-2 font-weight-medium">{{ item.value }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Documents -->
          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
              <v-icon icon="mdi-file-multiple" size="18" class="me-2" />Documents
            </v-card-title>
            <v-list v-if="documents.length > 0" density="compact" class="pa-2">
              <v-list-item v-for="doc in documents" :key="doc.id" :prepend-icon="doc.icon" :subtitle="doc.size" rounded="lg" class="mb-1">
                <template #title><span class="text-body-2">{{ doc.label }}</span></template>
                <template #append>
                  <v-chip size="x-small" variant="tonal" :color="doc.rangCode === 'premier' ? 'primary' : 'secondary'">
                    Rang {{ doc.rangCode === 'premier' ? '1' : '2' }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-body-2 text-medium-emphasis">
              Aucune pièce jointe déposée pour cette demande.
            </v-card-text>
          </v-card>

          <!-- QR attestation block -->
          <v-card v-if="demande.statut==='approuve'" color="success" variant="tonal" rounded="lg" elevation="0">
            <v-card-text class="pa-4 d-flex align-center ga-4">
              <v-icon icon="mdi-qrcode" size="48" color="success" />
              <div>
                <div class="font-weight-bold text-success">Attestation d'exonération disponible</div>
                <div class="text-caption">Document officiel avec QR Code de vérification. Valide jusqu'au {{ demande.dateEcheance ? formatDate(demande.dateEcheance) : '—' }}</div>
                <v-btn color="success" variant="tonal" size="small" prepend-icon="mdi-download" class="mt-2" :loading="downloading" @click="downloadAttestation">Télécharger (PDF + QR Code)</v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- ── Dialog réponse à une demande de complément ── -->
      <v-dialog v-model="complementDialog" max-width="520">
        <v-card rounded="xl">
          <v-card-title class="pa-5 pb-2">Répondre au complément</v-card-title>
          <v-card-text class="pa-5 pt-2">
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-4">
              Déposez le document complémentaire demandé par l'instructeur, puis soumettez.
              Votre demande repassera en instruction.
            </v-alert>
            <v-file-input
              v-model="complementFile"
              label="Document complémentaire"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              prepend-icon="mdi-paperclip"
              density="compact"
              show-size
            />
            <v-textarea v-model="complementCommentaire" label="Commentaire (optionnel)" rows="2" hide-details class="mt-3" />
            <v-alert v-if="complementError" type="error" variant="tonal" density="compact" rounded="lg" class="mt-3">{{ complementError }}</v-alert>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="complementDialog = false">Annuler</v-btn>
            <v-btn color="primary" prepend-icon="mdi-send" :loading="complementSubmitting" @click="submitComplement">Soumettre le complément</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import StatusChip from '../../components/StatusChip.vue'
import { EXO_TYPE_LABELS, type ExoType, type StatutDemande } from '../../types'
import {
  getDemande,
  listerEtapesWorkflow,
  listerPiecesJointes,
  listerBasesJuridiques,
  completerDemande,
  uploadPieceJointe,
  telechargerAttestation,
  type ApiDemande,
  type ApiPieceJointe,
  type ApiWorkflowEtape,
} from '../../services/portail'

const route = useRoute()
const demandeId = String(route.params.id || '')

interface DemandeVM {
  id: string; reference: string; statut: StatutDemande; type: ExoType
  secteur: string; dateDepot: string; dateEcheance: string | null
  montantFCFA: number; motifRejet: string | null
  contribuable: string; nif: string; baseJuridique: string
  createdAt: string; updatedAt: string
}

const demande = ref<DemandeVM | null>(null)
const pieces = ref<ApiPieceJointe[]>([])
const etapes = ref<ApiWorkflowEtape[]>([])
const loading = ref(true)
const error = ref('')
const downloading = ref(false)
const actionMessage = ref('')
const actionOk = ref(true)

// ── Complément ────────────────────────────────────────────────────────────────
const complementDialog = ref(false)
const complementFile = ref<File | File[] | null>(null)
const complementCommentaire = ref('')
const complementSubmitting = ref(false)
const complementError = ref('')

const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const formatMontant = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(v)

function impotVersType(impot?: string | null): ExoType {
  if (impot === 'TVA') return 'fiscale_tva'
  if (impot === 'IS') return 'fiscale_is'
  return 'douaniere'
}

onMounted(async () => {
  loading.value = true
  try {
    const [d, bj, pj, et] = await Promise.all([
      getDemande(demandeId),
      listerBasesJuridiques().catch(() => []),
      listerPiecesJointes(demandeId).catch(() => [] as ApiPieceJointe[]),
      listerEtapesWorkflow(demandeId),
    ])
    const base = bj.find(b => b.id === d.baseJuridiqueVersionId)
    demande.value = mapDemande(d, impotVersType(base?.impotConcerne), base?.libelle || '—')
    pieces.value = pj
    etapes.value = et
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger la demande'
  } finally {
    loading.value = false
  }
})

function mapDemande(d: ApiDemande, type: ExoType, baseLibelle: string): DemandeVM {
  return {
    id: d.id,
    reference: d.reference,
    statut: (d.statutCode || 'brouillon') as StatutDemande,
    type,
    secteur: d.secteur || '—',
    dateDepot: d.dateDepot || d.createdAt,
    dateEcheance: d.dateEcheance,
    montantFCFA: Number(d.montantFcfa),
    motifRejet: d.motifRejet,
    contribuable: d.contribuable?.raisonSociale || '—',
    nif: d.contribuable?.nif || '—',
    baseJuridique: baseLibelle,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

const typeLabel = computed(() => demande.value ? EXO_TYPE_LABELS[demande.value.type] : '')

// ── Timeline : étapes workflow réelles si disponibles, sinon dérivée du statut ──
interface TimelineEvent { label: string; date: string | null; icon: string; color: string; current: boolean; future: boolean; agent?: string }

const timeline = computed<TimelineEvent[]>(() => {
  if (etapes.value.length > 0) {
    return etapes.value.map(e => {
      const done = ['valide', 'termine', 'fait'].includes(e.statutCode || '')
      const current = ['en_cours', 'en_attente'].includes(e.statutCode || '') && !done
      return {
        label: e.libelle || `Étape ${e.ordre}`,
        date: e.dateValidation ? formatDate(e.dateValidation) : null,
        icon: done ? 'mdi-check' : current ? 'mdi-progress-clock' : 'mdi-clock-outline',
        color: done ? 'success' : current ? 'info' : 'default',
        current,
        future: !done && !current,
        agent: e.utilisateurs ? `${e.utilisateurs.prenom} ${e.utilisateurs.nom}` : undefined,
      }
    })
  }
  const d = demande.value
  if (!d) return []
  const st = d.statut
  const depotFait = st !== 'brouillon'
  const instructionPassee = ['approuve', 'rejete', 'archive'].includes(st)
  const instructionCourante = ['soumis', 'en_instruction', 'action_requise'].includes(st)
  const decidee = ['approuve', 'rejete', 'archive'].includes(st)
  return [
    { label: 'Dépôt de la demande', date: depotFait ? formatDate(d.dateDepot) : null, icon: 'mdi-upload', color: depotFait ? 'success' : 'default', current: false, future: !depotFait },
    { label: 'Vérification recevabilité', date: instructionPassee || instructionCourante ? formatDate(d.updatedAt) : null, icon: 'mdi-check', color: instructionPassee || instructionCourante ? 'success' : 'default', current: false, future: !instructionPassee && !instructionCourante },
    { label: "Instruction du dossier", date: instructionCourante ? 'En cours…' : instructionPassee ? formatDate(d.updatedAt) : null, icon: 'mdi-progress-clock', color: instructionPassee ? 'success' : instructionCourante ? 'info' : 'default', current: instructionCourante, future: !instructionPassee && !instructionCourante },
    { label: st === 'rejete' ? 'Décision finale — Rejet' : 'Décision finale / Signature', date: decidee ? formatDate(d.updatedAt) : null, icon: st === 'rejete' ? 'mdi-close-circle' : 'mdi-file-sign', color: st === 'approuve' ? 'success' : st === 'rejete' ? 'error' : 'default', current: false, future: !decidee },
  ]
})

// ── Documents réels ───────────────────────────────────────────────────────────
const documents = computed(() =>
  pieces.value.map(p => ({
    id: p.id,
    label: p.nomFichier,
    icon: p.typeMime === 'application/pdf' ? 'mdi-file-pdf-box' : 'mdi-file-document-outline',
    size: p.tailleOctets >= 1024 * 1024
      ? `${(p.tailleOctets / (1024 * 1024)).toFixed(1)} Mo`
      : `${Math.max(1, Math.round(p.tailleOctets / 1024))} Ko`,
    rangCode: p.rangCode,
  })),
)

// ── Attributs O2 réels ────────────────────────────────────────────────────────
const o2Summary = computed(() => {
  const d = demande.value
  if (!d) return []
  return [
    { label: 'id_demande', value: d.id },
    { label: 'base juridique', value: d.baseJuridique },
    { label: 'contribuable / NIF', value: `${d.contribuable} / ${d.nif}` },
    { label: 'montant exonéré', value: formatMontant(d.montantFCFA) },
    { label: 'secteur', value: d.secteur },
    { label: 'date de dépôt / échéance', value: `${formatDate(d.dateDepot)} / ${d.dateEcheance ? formatDate(d.dateEcheance) : '—'}` },
  ]
})

// ── Actions ───────────────────────────────────────────────────────────────────
async function downloadAttestation() {
  if (!demande.value) return
  downloading.value = true
  actionMessage.value = ''
  try {
    await telechargerAttestation(demande.value.id)
  } catch (e) {
    actionOk.value = false
    actionMessage.value = e instanceof Error ? e.message : "Échec du téléchargement de l'attestation"
  } finally {
    downloading.value = false
  }
}

async function submitComplement() {
  if (!demande.value || complementSubmitting.value) return
  complementError.value = ''
  complementSubmitting.value = true
  try {
    const file = Array.isArray(complementFile.value) ? complementFile.value[0] : complementFile.value
    if (file) {
      await uploadPieceJointe(demande.value.id, file, 'premier')
    }
    const updated = await completerDemande(demande.value.id, complementCommentaire.value || undefined)
    demande.value = { ...demande.value, statut: updated.statutCode as StatutDemande, updatedAt: updated.updatedAt }
    pieces.value = await listerPiecesJointes(demande.value.id).catch(() => pieces.value)
    complementDialog.value = false
    complementFile.value = null
    complementCommentaire.value = ''
    actionOk.value = true
    actionMessage.value = 'Complément soumis avec succès — votre demande est repassée en instruction.'
  } catch (e) {
    complementError.value = e instanceof Error ? e.message : 'Échec de la soumission du complément'
  } finally {
    complementSubmitting.value = false
  }
}
</script>
